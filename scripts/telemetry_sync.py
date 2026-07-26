"""Aggregate a bounded daily PUBG Steam telemetry sample without storing raw files."""

from __future__ import annotations

import collections
import datetime as dt
import gzip
import hashlib
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

from supabase_rest import SupabaseRest

API_ROOT = "https://api.pubg.com/shards/steam"
USER_AGENT = "BGI-Telemetry-Aggregator/1.0 (+https://battleground-info.vercel.app)"


def api_json(url: str, *, authenticated: bool = True) -> dict[str, Any] | list[dict[str, Any]]:
    headers = {"Accept": "application/vnd.api+json", "User-Agent": USER_AGENT}
    if authenticated:
        headers["Authorization"] = f"Bearer {os.environ['PUBG_API_KEY']}"
    request = urllib.request.Request(url, headers=headers)
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                payload = response.read()
                if response.headers.get("Content-Encoding") == "gzip" or payload.startswith(b"\x1f\x8b"):
                    payload = gzip.decompress(payload)
                return json.loads(payload)
        except urllib.error.HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                raise
            retry_after = int(error.headers.get("Retry-After", "0") or 0)
            time.sleep(max(retry_after, 2**attempt))
    raise RuntimeError("unreachable")


def dimensions(match: dict[str, Any]) -> tuple[str, str, str, str]:
    attributes = match["data"]["attributes"]
    played_at = attributes["createdAt"][:10]
    return (
        played_at,
        "steam",
        attributes.get("gameMode") or "unknown",
        attributes.get("mapName") or "unknown",
    )


def character_id(character: dict[str, Any] | None) -> str:
    return (character or {}).get("accountId") or (character or {}).get("name") or "unknown"


def item_key(item: dict[str, Any] | None) -> str:
    return (item or {}).get("itemId") or "unknown"


def attachments_from_damage_info(info: dict[str, Any] | None) -> tuple[str, ...]:
    additional = (info or {}).get("additionalInfo") or []
    return tuple(sorted(value for value in additional if isinstance(value, str) and value.startswith("Item_Attach_")))


def aggregate(
    match: dict[str, Any], events: list[dict[str, Any]]
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    stat_date, platform, mode, map_name = dimensions(match)
    base = (stat_date, platform, mode, map_name)
    weapon_stats: dict[tuple[str, ...], collections.Counter[str]] = collections.defaultdict(collections.Counter)
    attachment_stats: dict[tuple[str, ...], collections.Counter[str]] = collections.defaultdict(collections.Counter)
    loadout_stats: dict[tuple[str, ...], collections.Counter[str]] = collections.defaultdict(collections.Counter)
    loadout_attachments: dict[tuple[str, ...], tuple[str, ...]] = {}
    live_attachments: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    equipped_weapons: dict[str, set[str]] = collections.defaultdict(set)
    weapon_players: dict[str, set[str]] = collections.defaultdict(set)
    loadout_players: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    winners: set[str] = set()
    winner_weapons: dict[str, set[str]] = collections.defaultdict(set)
    player_names: dict[str, str] = {}

    for event in events:
        event_type = event.get("_T")
        character = event.get("character") or event.get("attacker") or event.get("killer")
        account = character_id(character)
        if character and character.get("name"):
            player_names[account] = character["name"]

        if event_type in ("LogItemAttach", "LogItemDetach"):
            weapon = item_key(event.get("parentItem"))
            attachment = item_key(event.get("childItem"))
            key = (*base, weapon, attachment)
            attachment_stats[key]["attach_events" if event_type == "LogItemAttach" else "detach_events"] += 1
            if event_type == "LogItemAttach":
                live_attachments[(account, weapon)].add(attachment)
            else:
                live_attachments[(account, weapon)].discard(attachment)

        elif event_type in ("LogItemEquip", "LogItemUnequip"):
            item = event.get("item") or {}
            if item.get("category") == "Weapon":
                weapon = item_key(item)
                if event_type == "LogItemEquip":
                    equipped_weapons[account].add(weapon)
                else:
                    equipped_weapons[account].discard(weapon)

        elif event_type == "LogPlayerAttack":
            weapon = item_key(event.get("weapon"))
            weapon_stats[(*base, weapon)]["attacks"] += 1
            weapon_players[weapon].add(account)

        elif event_type == "LogPlayerTakeDamage":
            weapon = event.get("damageCauserName") or "unknown"
            damage = max(float(event.get("damage") or 0), 0)
            weapon_stats[(*base, weapon)]["damage_events"] += 1
            weapon_stats[(*base, weapon)]["total_damage_milli"] += round(damage * 1000)
            weapon_players[weapon].add(account)

        elif event_type == "LogPlayerKillV2":
            info = event.get("killerDamageInfo") or event.get("finishDamageInfo") or {}
            killer = character_id(event.get("killer") or event.get("finisher"))
            weapon = info.get("damageCauserName") or "unknown"
            key = (*base, weapon)
            weapon_stats[key]["kills"] += 1
            weapon_players[weapon].add(killer)
            if str(info.get("damageReason", "")).lower() == "headshot":
                weapon_stats[key]["headshot_kills"] += 1
            distance = float(info.get("distance") or 0)
            if distance > 0:
                weapon_stats[key]["distance_sum_milli"] += round(distance * 1000)
                weapon_stats[key]["distance_samples"] += 1
            attached = attachments_from_damage_info(info) or tuple(sorted(live_attachments[(killer, weapon)]))
            loadout_hash = hashlib.sha256("\n".join(attached).encode()).hexdigest()[:24]
            loadout_key = (*base, weapon, loadout_hash)
            loadout_stats[loadout_key]["kill_count"] += 1
            loadout_attachments[loadout_key] = attached
            loadout_players[(weapon, loadout_hash)].add(killer)
            for attachment in attached:
                attachment_stats[(*base, weapon, attachment)]["kill_equipped_count"] += 1

        elif event_type == "LogMatchEnd":
            results = (event.get("gameResultOnFinished") or {}).get("results") or []
            for result in results:
                winner = result.get("accountId")
                if not winner:
                    continue
                winners.add(winner)
                for weapon in equipped_weapons[winner]:
                    winner_weapons[winner].add(weapon)
                    weapon_stats[(*base, weapon)]["winner_holds"] += 1
                    attached = tuple(sorted(live_attachments[(winner, weapon)]))
                    loadout_hash = hashlib.sha256("\n".join(attached).encode()).hexdigest()[:24]
                    loadout_key = (*base, weapon, loadout_hash)
                    loadout_attachments[loadout_key] = attached
                    loadout_stats[loadout_key]["winner_count"] += 1

    weapon_rows = []
    for key, counts in weapon_stats.items():
        weapon = key[-1]
        weapon_rows.append(
            {
                "stat_date": key[0], "platform": key[1], "game_mode": key[2], "map_name": key[3],
                "weapon_key": weapon, "match_count": 1, "player_count": len(weapon_players[weapon]),
                "attacks": counts["attacks"], "damage_events": counts["damage_events"],
                "total_damage": counts["total_damage_milli"] / 1000, "kills": counts["kills"],
                "headshot_kills": counts["headshot_kills"],
                "distance_sum_m": counts["distance_sum_milli"] / 1000,
                "distance_samples": counts["distance_samples"], "winner_holds": counts["winner_holds"],
            }
        )
    attachment_rows = [
        {
            "stat_date": key[0], "platform": key[1], "game_mode": key[2], "map_name": key[3],
            "weapon_key": key[4], "attachment_key": key[5], "match_count": 1, **counts,
        }
        for key, counts in attachment_stats.items()
    ]
    loadout_rows = [
        {
            "stat_date": key[0], "platform": key[1], "game_mode": key[2], "map_name": key[3],
            "weapon_key": key[4], "loadout_hash": key[5],
            "attachment_keys": list(loadout_attachments[key]),
            "kill_count": counts["kill_count"], "unique_players": len(loadout_players[(key[4], key[5])]),
            "winner_count": counts["winner_count"], "match_count": 1,
        }
        for key, counts in loadout_stats.items()
    ]
    top_rows = [
        {
            "snapshot_date": stat_date, "platform": platform, "game_mode": mode,
            "player_name": player_names.get(account, account), "account_id": account,
            "rank_metric": "winner_sample", "rank_value": 1, "weapon_key": weapon,
            "attachment_keys": sorted(live_attachments[(account, weapon)]),
            "sample_matches": 1, "source_kind": "telemetry_sample",
        }
        for account in winners
        for weapon in winner_weapons[account]
    ]
    return weapon_rows, attachment_rows, loadout_rows, top_rows


def main() -> None:
    database = SupabaseRest()
    max_matches = max(1, min(int(os.getenv("MAX_MATCHES", "100")), 1000))
    day = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=1)).date().isoformat()
    sample = api_json(f"{API_ROOT}/samples?filter[createdAt-start]={day}T00:00:00Z")
    match_ids = [item["id"] for item in sample.get("data", {}).get("relationships", {}).get("matches", {}).get("data", [])]
    written = 0
    for match_id in match_ids[:max_matches]:
        existing = database.request("processed_matches", params={"match_id": f"eq.{match_id}", "select": "match_id", "limit": "1"})
        if existing:
            continue
        match = api_json(f"{API_ROOT}/matches/{match_id}")
        asset = next(
            (item for item in match.get("included", []) if item.get("type") == "asset" and item.get("attributes", {}).get("URL")),
            None,
        )
        if not asset:
            continue
        events = api_json(asset["attributes"]["URL"], authenticated=False)
        weapon_rows, attachment_rows, loadout_rows, top_rows = aggregate(match, events)
        database.request(
            "rpc/accumulate_match_stats",
            method="POST",
            rows={
                "weapon_rows": weapon_rows,
                "attachment_rows": attachment_rows,
                "loadout_rows": loadout_rows,
            },
        )
        database.upsert("top_player_loadouts", top_rows, on_conflict="snapshot_date,platform,game_mode,account_id,weapon_key")
        attributes = match["data"]["attributes"]
        database.upsert(
            "processed_matches",
            [{
                "match_id": match_id, "platform": "steam", "game_mode": attributes.get("gameMode") or "unknown",
                "map_name": attributes.get("mapName") or "unknown", "played_at": attributes["createdAt"],
                "duration_seconds": attributes.get("duration"), "telemetry_url": asset["attributes"]["URL"],
            }],
            on_conflict="match_id",
        )
        written += 1
    print(f"Processed {written} new matches from {min(len(match_ids), max_matches)} sampled IDs.")


if __name__ == "__main__":
    main()
