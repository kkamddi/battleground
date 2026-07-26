"""Sample recent loadouts for official PUBG leaderboard players."""

from __future__ import annotations

import datetime as dt
import os
from typing import Any

from supabase_rest import SupabaseRest
from telemetry_sync import api_json, character_id, item_key

PLATFORM = "steam"
GAME_MODE = os.getenv("LEADERBOARD_GAME_MODE", "squad-fpp")


def final_loadout(events: list[dict[str, Any]], account_id: str) -> dict[str, list[str]]:
    equipped: set[str] = set()
    attachments: dict[str, set[str]] = {}
    for event in events:
        character = event.get("character")
        if character_id(character) != account_id:
            continue
        event_type = event.get("_T")
        if event_type in ("LogItemEquip", "LogItemUnequip"):
            item = event.get("item") or {}
            if item.get("category") != "Weapon":
                continue
            weapon = item_key(item)
            if event_type == "LogItemEquip":
                equipped.add(weapon)
                attachments.setdefault(weapon, set()).update(item.get("attachedItems") or [])
            else:
                equipped.discard(weapon)
        elif event_type in ("LogItemAttach", "LogItemDetach"):
            weapon = item_key(event.get("parentItem"))
            attachment = item_key(event.get("childItem"))
            attachments.setdefault(weapon, set())
            if event_type == "LogItemAttach":
                attachments[weapon].add(attachment)
            else:
                attachments[weapon].discard(attachment)
    return {weapon: sorted(attachments.get(weapon, set())) for weapon in equipped}


def main() -> None:
    database = SupabaseRest()
    seasons = api_json(f"https://api.pubg.com/shards/{PLATFORM}/seasons")
    current = next(
        item["id"]
        for item in seasons.get("data", [])
        if item.get("attributes", {}).get("isCurrentSeason") and not item.get("attributes", {}).get("isOffseason")
    )
    leaderboard_shard = os.getenv("LEADERBOARD_SHARD", PLATFORM)
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
    match_ids: dict[str, str] = {}
    names: dict[str, str] = {}
    for player in player_response.get("data", []):
        names[player["id"]] = player.get("attributes", {}).get("name") or player["id"]
        matches = player.get("relationships", {}).get("matches", {}).get("data", [])
        if matches:
            match_ids[player["id"]] = matches[0]["id"]
    rows = []
    for leader in leaders:
        match_id = match_ids.get(leader["id"])
        if not match_id:
            continue
        match = api_json(f"https://api.pubg.com/shards/{PLATFORM}/matches/{match_id}")
        asset = next(
            (item for item in match.get("included", []) if item.get("type") == "asset" and item.get("attributes", {}).get("URL")),
            None,
        )
        if not asset:
            continue
        events = api_json(asset["attributes"]["URL"], authenticated=False)
        for weapon, attachments in final_loadout(events, leader["id"]).items():
            rows.append(
                {
                    "snapshot_date": dt.datetime.now(dt.timezone.utc).date().isoformat(),
                    "platform": PLATFORM, "game_mode": GAME_MODE,
                    "player_name": names.get(leader["id"], leader["name"]),
                    "account_id": leader["id"], "rank_metric": "official_leaderboard",
                    "rank_value": leader["rank"], "weapon_key": weapon,
                    "attachment_keys": attachments, "sample_matches": 1,
                    "source_kind": "official_leaderboard_recent_match",
                }
            )
    database.upsert(
        "top_player_loadouts",
        rows,
        on_conflict="snapshot_date,platform,game_mode,account_id,weapon_key",
    )
    print(f"Stored {len(rows)} recent loadout rows for {len(leaders)} official leaderboard players.")


if __name__ == "__main__":
    main()

