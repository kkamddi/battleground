"""Sync reviewed official progressive-skin references for the BGI laboratory."""

from __future__ import annotations

import re
import urllib.request

from supabase_rest import SupabaseRest

USER_AGENT = "BGI-Progressive-Monitor/1.0 (+https://battleground-info.vercel.app)"

SKINS = [
    {
        "slug": "pretend-prototype-slr",
        "name": "상상력 풀가동",
        "weapon_key": "Item_Weapon_FNFal_C",
        "max_level": 10,
        "acquisition": "밀수품 상자 · 스크랩 브로커",
        "pc_sale_start": "2026-07-15T00:00:00Z",
        "pc_sale_end": "2026-12-02T00:00:00Z",
        "console_sale_start": "2026-07-23T00:00:00Z",
        "console_sale_end": "2026-12-10T00:00:00Z",
        "source_url": "https://www.pubg.com/ko/news/10427",
        "source_published_at": "2026-07-14T00:00:00Z",
        "levels": [
            "기본 스킨 외형", "헤드샷 킬 배틀스탯", "무기 살펴보기 애니메이션",
            "탄창 / 총구 스킨", "중급 스킨 외형", "킬피드 스킨",
            "스코프 / 개머리판 스킨", "전리품 상자 스킨", "고급 스킨 외형", "킬 이펙트",
        ],
    },
    {
        "slug": "ride-or-die-m249",
        "name": "라이드 오어 다이",
        "weapon_key": "Item_Weapon_M249_C",
        "max_level": 6,
        "acquisition": "밀수품 상자 · 스크랩 브로커",
        "pc_sale_start": "2026-05-13T00:00:00Z",
        "pc_sale_end": "2026-10-14T00:00:00Z",
        "console_sale_start": "2026-05-21T00:00:00Z",
        "console_sale_end": "2026-10-22T00:00:00Z",
        "source_url": "https://www.pubg.com/ko/news/10041",
        "source_published_at": "2026-05-12T00:00:00Z",
        "levels": [
            "기본 스킨 외형", "탄창 / 개머리판 스킨", "헤드샷 킬 배틀스탯",
            "스코프 스킨", "킬피드 스킨", "중급 스킨 외형",
        ],
    },
    {
        "slug": "cosmic-caliber-kar98k",
        "name": "코스믹 캘리버",
        "weapon_key": "Item_Weapon_Kar98k_C",
        "max_level": 10,
        "acquisition": "밀수품 상자 · 스크랩 브로커",
        "source_url": "https://www.pubg.com/ko/news/9892",
        "source_published_at": "2026-04-08T00:00:00Z",
        "levels": [],
    },
    {
        "slug": "time-keeper-m416",
        "name": "타임 키퍼",
        "weapon_key": "Item_Weapon_HK416_C",
        "max_level": 10,
        "acquisition": "밀수품 상자 · 스크랩 브로커",
        "source_url": "https://pubg.com/ko/news/9707",
        "source_published_at": "2026-02-10T00:00:00Z",
        "levels": [
            "기본 스킨 외형", "헤드샷 킬 배틀스탯", "무기 살펴보기 애니메이션",
            "탄창 / 총구 스킨", "중급 스킨 외형", "킬피드 스킨",
            "손잡이 / 개머리판 스킨", "전리품 상자 스킨", "스코프 스킨",
            "고급 스킨 외형 / 상시 이펙트",
        ],
    },
]


def official_image(url: str) -> str | None:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            document = response.read().decode("utf-8", errors="replace")
    except OSError:
        return None
    match = re.search(
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
        document,
        re.I,
    )
    return match.group(1) if match else None


def main() -> None:
    database = SupabaseRest()
    for skin in SKINS:
        image = official_image(skin["source_url"])
        row = {key: value for key, value in skin.items() if key != "levels"}
        row.update({
            "image_url": image,
            "availability_status": "available",
            "review_status": "approved",
        })
        database.upsert("progressive_skins", [row], on_conflict="slug")
        selected = database.request(
            "progressive_skins",
            params={"slug": f"eq.{skin['slug']}", "select": "id", "limit": "1"},
        )
        if not selected or not skin["levels"]:
            continue
        database.upsert(
            "progressive_skin_levels",
            [
                {
                    "progressive_skin_id": selected[0]["id"],
                    "level": index,
                    "unlock_type": "level_reward",
                    "description_ko": description,
                    "image_url": None,
                }
                for index, description in enumerate(skin["levels"], start=1)
            ],
            on_conflict="progressive_skin_id,level",
        )
    print(f"Seeded {len(SKINS)} reviewed progressive skins.")


if __name__ == "__main__":
    main()
