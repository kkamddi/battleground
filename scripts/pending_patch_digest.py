"""Print a concise, non-secret review queue for the GitHub Actions summary."""

from __future__ import annotations

import os

from supabase_rest import SupabaseRest


def main() -> None:
    rows = SupabaseRest().request(
        "patch_candidates",
        params={
            "select": "id,detected_version,category,change_type,confidence,summary_ko,summary",
            "review_status": "eq.pending",
            "order": "created_at.desc,confidence.desc",
            "limit": "30",
        },
    ) or []
    lines = [
        "## 패치 검수 대기 목록",
        "",
        "`Review staged patch change` 워크플로에 아래 ID를 입력해 승인 또는 반려합니다.",
        "",
        "| ID | 버전 | 분류 | 판정 | 신뢰도 | 요약 |",
        "|---:|---|---|---|---:|---|",
    ]
    for row in rows:
        summary = (row.get("summary_ko") or row["summary"]).replace("|", "／")[:160]
        lines.append(
            f"| {row['id']} | {row.get('detected_version') or '—'} | {row['category']} | "
            f"{row.get('change_type') or 'neutral'} | {float(row['confidence']):.2f} | {summary} |"
        )
    digest = "\n".join(lines)
    print(digest)
    summary_path = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary_file:
            summary_file.write(digest + "\n")


if __name__ == "__main__":
    main()
