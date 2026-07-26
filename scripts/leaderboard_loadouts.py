"""Sample recent loadouts for official PUBG leaderboard players."""

from __future__ import annotations

import datetime as dt
import os
from collections import Counter
from typing import Any

from supabase_rest import SupabaseRest
from telemetry_sync import api_json, character_id, item_key

PLATFORM = "steam"
GAME_MODE = os.getenv("LEADERBOARD_GAME_MODE", "squad-fpp")


def terminal_loadout(events: list[dict[str, Any]], account_id: str) -> dict[str, list[str]]:
    equipped: set[str] = set()
    attachments: dict[str, set[str]] = {}
    death_loadout: dict[str, list[str]] = {}

    def snapshot() -> dict[str, list[str]]:
        return {weapon: sorted(attachments.get(weapon, set())) for weapon in equipped}

    for event in events:
        character = event.get("character")
        event_type = event.get("_T")
        if character_id(character) == account_id and event_type in ("LogItemEquip", "LogItemUnequip"):
            item = event.get("item") or {}
            if item.get("category") != "Weapon":
                continue
            weapon = item_key(item)
            if event_type == "LogItemEquip":
                equipped.add(weapon)
                attachments[weapon] = set(item.get("attachedItems") or [])
            else:
                equipped.discard(weapon)
        elif character_id(character) == account_id and event_type in ("LogItemAttach", "LogItemDetach"):
            weapon = item_key(event.get("parentItem"))
            attachment = item_key(event.get("childItem"))
            attachments.setdefault(weapon, set())
            if event_type == "LogItemAttach":
                attachments[weapon].add(attachment)
            else:
                attachments[weapon].discard(attachment)
        elif event_type == "LogPlayerKillV2" and character_id(event.get("victim")) == account_id:
            death_loadout = snapshot()
        elif event_type == "LogMatchEnd":
            winners = {
                result.get("accountId")
                for result in (event.get("gameResultOnFinished") or {}).get("results", [])
            }
            if account_id in winners:
                return snapshot()
    return death_loadout or snapshot()


def main() -> None:
    database = SupabaseRest()
    seasons = api_json(f"https://api.pubg.com/shards/{PLATFORM}/seasons")
    current = next(
        item["id"]
        for item in seasons.get("data", [])
        if item.get("attributes", {}).get("isCurrentSeason") and not item.get("attributes", {}).get("isOffseason")
    )
    leaderboard_shard = os.getenv("LEADERBOARD_SHARD", "pc-as")
    leaderboard = api_json(f"https://api.pubg.com/shards/{leaderboard_shard}/leaderboards/{current}/{GAME_MODE}")
    included = [item for item in leaderboard.get("included", []) if item.get("type") == "player"]
    limit = max(1, min(int(os.getenv("TOP_PLAYER_LIMIT", "10")), 25))
    leaders = []
    for rank, player in enumerate(included[:limit], start=1):
        attributes = player.get("attributes", {})
        leaders.append({"id": player["id"], "name": attributes.get("name") or player["id"], "rank": rank})
    if not leaders:
        print("No leaderboard players returned.")
        return
    ids = ",".join(player["id"] for player in leaders)
    player_response = api_json(f"https://api.pubg.com/shards/{PLATFORM}/players?filter[playerIds]={ids}")
    match_ids: dict[str, list[str]] = {}
    names: dict[str, str] = {}
    for player in player_response.get("data", []):
        names[player["id"]] = player.get("attributes", {}).get("name") or player["id"]
        matches = player.get("relationships", {}).get("matches", {}).get("data", [])
        match_ids[player["id"]] = [match["id"] for match in matches]

    matches_per_player = max(1, min(int(os.getenv("TOP_PLAYER_MATCHES", "10")), 20))
    match_cache: dict[str, dict[str, Any]] = {}
    telemetry_cache: dict[str, list[dict[str, Any]]] = {}
    rows = []
    for leader in leaders:
        loadout_counts: Counter[tuple[str, tuple[str, ...]]] = Counter()
        weapon_matches: Counter[str] = Counter()
        sampled_matches = 0
        for match_id in match_ids.get(leader["id"], []):
            match = match_cache.get(match_id)
            if match is None:
                match = api_json(f"https://api.pubg.com/shards/{PLATFORM}/matches/{match_id}")
                match_cache[match_id] = match
            attributes = match.get("data", {}).get("attributes", {})
            if attributes.get("gameMode") != GAME_MODE or attributes.get("matchType") != "competitive":
                continue
            asset = next(
                (item for item in match.get("included", []) if item.get("type") == "asset" and item.get("attributes", {}).get("URL")),
                None,
            )
            if not asset:
                continue
            telemetry_url = asset["attributes"]["URL"]
            events = telemetry_cache.get(telemetry_url)
            if events is None:
                events = api_json(telemetry_url, authenticated=False)
                telemetry_cache[telemetry_url] = events
            loadout = terminal_loadout(events, leader["id"])
            if not loadout:
                continue
            sampled_matches += 1
            for weapon, attachments in loadout.items():
                if weapon == "unknown":
                    continue
                loadout_counts[(weapon, tuple(attachments))] += 1
                weapon_matches[weapon] += 1
            if sampled_matches >= matches_per_player:
                break

        for weapon, _sample_count in weapon_matches.most_common(2):
            attachments, repeat_count = max(
                (
                    (attachment_keys, count)
                    for (candidate_weapon, attachment_keys), count in loadout_counts.items()
                    if candidate_weapon == weapon
                ),
                key=lambda item: item[1],
            )
            rows.append(
                {
                    "snapshot_date": dt.datetime.now(dt.timezone.utc).date().isoformat(),
                    "platform": PLATFORM, "game_mode": GAME_MODE,
                    "player_name": names.get(leader["id"], leader["name"]),
                    "account_id": leader["id"], "rank_metric": "official_leaderboard",
                    "rank_value": leader["rank"], "weapon_key": weapon,
                    "attachment_keys": list(attachments), "sample_matches": repeat_count,
                    "source_kind": "official_leaderboard_recent_match",
                }
            )
    database.upsert(
        "top_player_loadouts",
        rows,
        on_conflict="snapshot_date,platform,game_mode,account_id,weapon_key",
    )
    print(
        f"Stored {len(rows)} repeated loadout rows from up to "
        f"{matches_per_player} competitive matches for {len(leaders)} official leaderboard players."
    )


if __name__ == "__main__":
    main()
