"""Seed the curated weapon and attachment catalog used by BGI."""

from __future__ import annotations

import json
from pathlib import Path

from supabase_rest import SupabaseRest

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://pubg.com/en/game-info/weapons"


def read_json(name: str) -> list[dict[str, object]]:
    return json.loads((ROOT / "data" / name).read_text(encoding="utf-8"))


def main() -> None:
    database = SupabaseRest()
    weapons = read_json("weapons.json")
    attachments = read_json("attachments.json")

    database.upsert(
        "weapon_specs",
        [
            {
                "weapon_key": row["key"],
                "name": row["name"],
                "category": row["category"],
                "ammo": row["ammo"],
                "base_damage": row["damage"],
                "rpm": row.get("rpm"),
                "muzzle_velocity": row.get("velocity"),
                "magazine_size": row["magazine"],
                "extended_magazine_size": row.get("extendedMagazine"),
                "falloff_start_m": row.get("falloffStart"),
                "falloff_end_m": row.get("falloffEnd"),
                "minimum_damage_multiplier": row.get("minimumMultiplier", 1),
                "current_patch": "42.2",
                "source_url": SOURCE_URL,
                "source_kind": "curated",
            }
            for row in weapons
        ],
        on_conflict="weapon_key",
    )
    database.upsert(
        "attachments",
        [
            {
                "attachment_key": row["key"],
                "name": row["name"],
                "category": row["category"],
                "effect_summary": row["effect"],
                "effect_values": {},
                "recommended_for": row["recommendedFor"],
                "current_patch": str(row["change"]).split(" ", 1)[0],
                "source_url": SOURCE_URL,
                "source_kind": "curated",
            }
            for row in attachments
        ],
        on_conflict="attachment_key",
    )
    print(f"Seeded {len(weapons)} weapons and {len(attachments)} attachments.")


if __name__ == "__main__":
    main()
