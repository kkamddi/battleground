"""Generate reviewed-patch before/after sample comparisons from daily aggregates."""

from __future__ import annotations

import collections
import datetime as dt
from typing import Any

from supabase_rest import SupabaseRest


def weapon_totals(rows: list[dict[str, Any]]) -> tuple[dict[str, int], int]:
    totals: dict[str, int] = collections.Counter()
    for row in rows:
        totals[row["weapon_key"]] += int(row.get("player_count") or 0)
    return totals, sum(totals.values())


def iso_date(value: str) -> dt.date:
    return dt.date.fromisoformat(value[:10])


def main() -> None:
    database = SupabaseRest()
    patches = database.select_all(
        "patch_versions",
        {"select": "id,version,pc_applied_at", "status": "eq.published", "pc_applied_at": "not.is.null"},
    )
    today = dt.datetime.now(dt.timezone.utc).date()
    comparison_rows: list[dict[str, Any]] = []
    for patch in patches:
        applied = iso_date(patch["pc_applied_at"])
        for window in (7, 30):
            before_start = applied - dt.timedelta(days=window)
            before_end = applied - dt.timedelta(days=1)
            after_start = applied
            after_end = applied + dt.timedelta(days=window - 1)
            if after_end >= today:
                continue
            before = database.select_all(
                "daily_weapon_stats",
                {
                    "select": "weapon_key,player_count",
                    "stat_date": f"gte.{before_start.isoformat()}",
                    "and": f"(stat_date.lte.{before_end.isoformat()})",
                },
            )
            after = database.select_all(
                "daily_weapon_stats",
                {
                    "select": "weapon_key,player_count",
                    "stat_date": f"gte.{after_start.isoformat()}",
                    "and": f"(stat_date.lte.{after_end.isoformat()})",
                },
            )
            before_totals, before_denominator = weapon_totals(before)
            after_totals, after_denominator = weapon_totals(after)
            before_matches = database.select_all(
                "processed_matches",
                {
                    "select": "match_id",
                    "played_at": f"gte.{before_start.isoformat()}T00:00:00Z",
                    "and": f"(played_at.lt.{applied.isoformat()}T00:00:00Z)",
                },
            )
            after_matches = database.select_all(
                "processed_matches",
                {
                    "select": "match_id",
                    "played_at": f"gte.{after_start.isoformat()}T00:00:00Z",
                    "and": f"(played_at.lt.{(after_end + dt.timedelta(days=1)).isoformat()}T00:00:00Z)",
                },
            )
            for weapon in before_totals.keys() | after_totals.keys():
                before_share = before_totals[weapon] / before_denominator if before_denominator else 0
                after_share = after_totals[weapon] / after_denominator if after_denominator else 0
                change = ((after_share - before_share) / before_share * 100) if before_share else None
                comparison_rows.append(
                    {
                        "patch_version_id": patch["id"], "metric": f"sample_player_share_{window}d",
                        "subject_type": "weapon", "subject_key": weapon,
                        "platform": "steam", "game_mode": "all", "map_name": "all",
                        "before_start": before_start.isoformat(), "before_end": before_end.isoformat(),
                        "after_start": after_start.isoformat(), "after_end": after_end.isoformat(),
                        "before_value": before_share, "after_value": after_share,
                        "change_percent": change, "sample_matches_before": len(before_matches),
                        "sample_matches_after": len(after_matches),
                    }
                )
    database.upsert(
        "patch_meta_comparisons",
        comparison_rows,
        on_conflict="patch_version_id,metric,subject_type,subject_key,platform,game_mode,map_name,before_start,before_end,after_start,after_end",
    )
    print(f"Generated {len(comparison_rows)} patch comparison rows.")


if __name__ == "__main__":
    main()

