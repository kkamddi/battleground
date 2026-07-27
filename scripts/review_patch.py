"""Approve or reject one staged patch candidate from a manual GitHub workflow."""

from __future__ import annotations

import datetime as dt
import os

from supabase_rest import SupabaseRest

WEAPON_FIELDS = {
    "base_damage": "base_damage",
    "rpm": "rpm",
    "muzzle_velocity": "muzzle_velocity",
    "magazine_size": "magazine_size",
    "reload_seconds": "reload_seconds",
}


def iso_date(value: str) -> str | None:
    return f"{value}T00:00:00Z" if value else None


def main() -> None:
    database = SupabaseRest()
    candidate_id = os.environ["CANDIDATE_ID"]
    decision = os.environ["DECISION"]
    selected = database.request(
        "patch_candidates",
        params={"id": f"eq.{candidate_id}", "select": "*", "limit": "1"},
    )
    if not selected:
        raise SystemExit(f"Patch candidate {candidate_id} was not found.")
    candidate = selected[0]
    now = dt.datetime.now(dt.timezone.utc).isoformat()
    if decision == "reject":
        database.request(
            "patch_candidates",
            method="PATCH",
            params={"id": f"eq.{candidate_id}"},
            rows={"review_status": "rejected", "reviewed_at": now},
            prefer="return=minimal",
        )
        print(f"Rejected candidate {candidate_id}.")
        return

    version = candidate.get("detected_version")
    versions = database.request(
        "patch_versions",
        params={"version": f"eq.{version}", "select": "*", "limit": "1"},
    )
    if not versions:
        raise SystemExit(f"Patch version {version} was not found.")
    patch = versions[0]
    summary = os.getenv("SUMMARY_KO") or candidate.get("summary_ko") or candidate["summary"]
    pc_date = iso_date(os.getenv("PC_APPLIED_AT", ""))
    console_date = iso_date(os.getenv("CONSOLE_APPLIED_AT", ""))
    version_update: dict[str, object] = {"status": "published", "updated_at": now}
    if pc_date:
        version_update["pc_applied_at"] = pc_date
    if console_date:
        version_update["console_applied_at"] = console_date
    database.request(
        "patch_versions",
        method="PATCH",
        params={"id": f"eq.{patch['id']}"},
        rows=version_update,
        prefer="return=minimal",
    )
    database.request(
        "patch_candidates",
        method="PATCH",
        params={"id": f"eq.{candidate_id}"},
        rows={
            "review_status": "approved",
            "reviewed_at": now,
            "patch_version_id": patch["id"],
            "summary_ko": summary,
        },
        prefer="return=minimal",
    )
    database.upsert(
        "patch_changes",
        [
            {
                "patch_version_id": patch["id"],
                "candidate_id": int(candidate_id),
                "subject_type": candidate["category"],
                "subject_key": candidate.get("subject_key"),
                "stat_key": candidate.get("stat_key"),
                "change_type": candidate.get("change_type") or "neutral",
                "before_value": candidate.get("before_value"),
                "after_value": candidate.get("after_value"),
                "unit": candidate.get("unit"),
                "summary_ko": summary,
                "source_url": candidate["source_url"],
            }
        ],
        on_conflict="candidate_id",
    )

    weapon_field = WEAPON_FIELDS.get(candidate.get("stat_key"))
    after_value = candidate.get("after_value")
    if candidate["category"] == "weapon" and candidate.get("subject_key") and weapon_field and after_value:
        database.request(
            "weapon_specs",
            method="PATCH",
            params={"weapon_key": f"eq.{candidate['subject_key']}"},
            rows={weapon_field: float(after_value), "current_patch": version, "updated_at": now},
            prefer="return=minimal",
        )
        database.upsert(
            "weapon_spec_history",
            [
                {
                    "weapon_key": candidate["subject_key"],
                    "patch_version_id": patch["id"],
                    "stat_key": candidate["stat_key"],
                    "before_value": candidate.get("before_value"),
                    "after_value": after_value,
                    "unit": candidate.get("unit"),
                    "source_url": candidate["source_url"],
                    "changed_at": pc_date or now,
                }
            ],
            on_conflict="weapon_key,patch_version_id,stat_key",
        )
    print(f"Approved candidate {candidate_id} for update {version}.")


if __name__ == "__main__":
    main()
