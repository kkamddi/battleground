"""Build 7/30-day weapon attachment recommendations from telemetry aggregates."""

from __future__ import annotations

import collections
import datetime as dt
import hashlib
import math
from typing import Any

from supabase_rest import SupabaseRest


def main() -> None:
    database = SupabaseRest()
    today = dt.datetime.now(dt.timezone.utc).date()
    source = database.select_all(
        "daily_loadout_stats",
        {
            "select": "stat_date,platform,game_mode,map_name,weapon_key,attachment_keys,kill_count,unique_players,winner_count,match_count",
            "stat_date": f"gte.{today - dt.timedelta(days=30)}",
        },
    )
    top_players = database.select_all(
        "top_player_loadouts",
        {
            "select": "snapshot_date,platform,game_mode,weapon_key,attachment_keys,sample_matches",
            "snapshot_date": f"gte.{today - dt.timedelta(days=30)}",
        },
    )
    output: list[dict[str, Any]] = []
    for window in (7, 30):
        start = today - dt.timedelta(days=window - 1)
        grouped: dict[tuple[str, str, str, str, tuple[str, ...]], collections.Counter[str]] = (
            collections.defaultdict(collections.Counter)
        )
        for row in source:
            if dt.date.fromisoformat(row["stat_date"]) < start:
                continue
            attachments = tuple(sorted(row.get("attachment_keys") or []))
            if len(attachments) < 2 or row["weapon_key"] == "unknown":
                continue
            key = (row["platform"], row["game_mode"], row["weapon_key"], "all", attachments)
            grouped[key].update(
                kills=int(row["kill_count"]),
                players=int(row["unique_players"]),
                winners=int(row["winner_count"]),
                matches=int(row["match_count"]),
            )
        for row in top_players:
            if dt.date.fromisoformat(row["snapshot_date"]) < start:
                continue
            attachments = tuple(sorted(row.get("attachment_keys") or []))
            if len(attachments) < 2:
                continue
            key = (row["platform"], row["game_mode"], row["weapon_key"], "all", attachments)
            grouped[key]["top"] += int(row["sample_matches"])

        weapon_totals = collections.Counter()
        for key, counts in grouped.items():
            weapon_totals[key[2]] += counts["kills"]
        for (platform, mode, weapon, map_name, attachments), counts in grouped.items():
            observations = counts["kills"] + counts["top"]
            confidence = min(1, math.log1p(observations) / math.log(101))
            score = (
                (counts["kills"] / max(weapon_totals[weapon], 1)) * 0.80
                + min(counts["winners"] / max(counts["matches"], 1), 1) * 0.15
                + min(counts["top"] / 20, 1) * 0.05
            )
            output.append(
                {
                    "stat_date": today.isoformat(),
                    "window_days": window,
                    "platform": platform,
                    "game_mode": mode,
                    "map_name": map_name,
                    "weapon_key": weapon,
                    "attachment_keys": list(attachments),
                    "loadout_hash": hashlib.sha256("\n".join(attachments).encode()).hexdigest()[:24],
                    "kill_count": counts["kills"],
                    "unique_players": counts["players"],
                    "winner_count": counts["winners"],
                    "sample_matches": counts["matches"],
                    "top_player_observations": counts["top"],
                    "popularity_score": round(score, 6),
                    "confidence": round(confidence, 5),
                }
            )
    database.upsert(
        "weapon_loadout_rankings",
        output,
        on_conflict="stat_date,window_days,platform,game_mode,map_name,weapon_key,loadout_hash",
    )
    print(f"Built {len(output)} attachment recommendation rows.")


if __name__ == "__main__":
    main()
