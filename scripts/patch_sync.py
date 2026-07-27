"""Detect official PUBG patch notes and stage conservative review candidates."""

from __future__ import annotations

import hashlib
import html
import re
import urllib.request
from html.parser import HTMLParser

from supabase_rest import SupabaseRest

NEWS_URL = "https://pubg.com/en/news?category=patch_notes"
USER_AGENT = "BGI-Patch-Monitor/1.0 (+https://battleground-info.vercel.app)"

CATEGORY_RULES = (
    ("weapon", re.compile(r"\b(weapon|gun|rifle|smg|dmr|sniper|shotgun|pistol|damage|recoil|velocity|rpm)\b", re.I)),
    ("attachment", re.compile(r"\b(attachment|grip|muzzle|magazine|stock|scope|sight)\b", re.I)),
    ("map", re.compile(r"\b(map|erangel|miramar|taego|deston|rondo|vikendi|sanhok|paramo|karakin)\b", re.I)),
    ("ranked", re.compile(r"\b(ranked|esports|competitive)\b", re.I)),
    ("system", re.compile(r"\b(system|matchmaking|training|recall|blue zone|red zone|vehicle)\b", re.I)),
    ("bug_fix", re.compile(r"\b(fix|fixed|issue|bug)\b", re.I)),
)

SUBJECT_ALIASES = {
    "m416": "Item_Weapon_HK416_C",
    "aug": "Item_Weapon_AUG_C",
    "slr": "Item_Weapon_FNFal_C",
    "beryl m762": "Item_Weapon_BerylM762_C",
    "beryl": "Item_Weapon_BerylM762_C",
    "ace32": "Item_Weapon_ACE32_C",
    "akm": "Item_Weapon_AK47_C",
    "mk12": "Item_Weapon_Mk12_C",
    "mini14": "Item_Weapon_Mini14_C",
    "dragunov": "Item_Weapon_Dragunov_C",
    "mp5k": "Item_Weapon_MP5K_C",
    "ump45": "Item_Weapon_UMP_C",
    "vertical foregrip": "Item_Attach_Weapon_Lower_VerticalForeGrip_C",
    "half grip": "Item_Attach_Weapon_Lower_HalfGrip_C",
    "thumb grip": "Item_Attach_Weapon_Lower_ThumbGrip_C",
    "lightweight grip": "Item_Attach_Weapon_Lower_LightweightForeGrip_C",
    "angled foregrip": "Item_Attach_Weapon_Lower_AngledForeGrip_C",
    "compensator": "Item_Attach_Weapon_Muzzle_Compensator_Large_C",
    "muzzle brake": "Item_Attach_Weapon_Muzzle_AR_MuzzleBrake_C",
}

STAT_ALIASES = (
    ("muzzle_velocity", re.compile(r"\b(bullet|muzzle)?\s*velocity\b", re.I), "탄속"),
    ("base_damage", re.compile(r"\b(base\s+)?damage\b", re.I), "피해량"),
    ("rpm", re.compile(r"\b(rpm|rate of fire|firing rate)\b", re.I), "연사 속도"),
    ("horizontal_recoil", re.compile(r"\bhorizontal recoil\b", re.I), "수평 반동"),
    ("vertical_recoil", re.compile(r"\bvertical recoil\b", re.I), "수직 반동"),
    ("magazine_size", re.compile(r"\bmagazine (capacity|size)\b", re.I), "탄창 용량"),
    ("reload_seconds", re.compile(r"\breload(ing)? (time|speed)\b", re.I), "재장전"),
)


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if text:
            self.parts.append(text)


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def page_text(document: str) -> str:
    parser = TextExtractor()
    parser.feed(document)
    return html.unescape("\n".join(parser.parts))


def patch_links(document: str) -> list[str]:
    links = re.findall(r'href=["\'](?:https://pubg\.com)?(/en/news/\d+)[^"\']*["\']', document, re.I)
    links.extend(f"/en/news/{post_id}" for post_id in re.findall(r"\bpostId\s*:\s*(\d+)", document))
    unique: list[str] = []
    for link in links:
        url = f"https://pubg.com{link}"
        if url not in unique:
            unique.append(url)
    return unique[:3]


def classify(line: str) -> str | None:
    for category, pattern in CATEGORY_RULES:
        if pattern.search(line):
            return category
    return None


def change_type(line: str) -> str:
    if re.search(r"\b(new|added|introduc)", line, re.I):
        return "new"
    if re.search(r"\b(remove|deleted|no longer)", line, re.I):
        return "removed"
    if re.search(r"\b(increas|improv|reduc(?:ed)? recoil|faster)", line, re.I):
        return "buff"
    if re.search(r"\b(decreas|increas(?:ed)? recoil|slower)", line, re.I):
        return "nerf"
    return "neutral"

def subject_key(line: str) -> str | None:
    lowered = line.lower()
    for alias in sorted(SUBJECT_ALIASES, key=len, reverse=True):
        if re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", lowered):
            return SUBJECT_ALIASES[alias]
    return None


def stat_key(line: str) -> tuple[str | None, str | None]:
    for key, pattern, label in STAT_ALIASES:
        if pattern.search(line):
            return key, label
    return None, None


def before_after(line: str) -> tuple[str | None, str | None, str | None]:
    arrow = re.search(
        r"(?P<before>-?\d+(?:\.\d+)?)\s*(?P<unit>%|m/s|ms|seconds?|s|rounds?)?\s*"
        r"(?:→|->|to)\s*(?P<after>-?\d+(?:\.\d+)?)\s*(?P<after_unit>%|m/s|ms|seconds?|s|rounds?)?",
        line,
        re.I,
    )
    if not arrow:
        return None, None, None
    return (
        arrow.group("before"),
        arrow.group("after"),
        arrow.group("after_unit") or arrow.group("unit"),
    )


def korean_summary(line: str, subject: str | None, stat_label: str | None) -> str | None:
    before, after, unit = before_after(line)
    if not subject or not stat_label or before is None or after is None:
        return None
    display_subject = next((name.upper() if len(name) <= 5 else name.title() for name, key in SUBJECT_ALIASES.items() if key == subject and " " not in name), subject)
    suffix = unit or ""
    return f"{display_subject} {stat_label} {before}{suffix} → {after}{suffix}"


def candidates(url: str, document: str) -> list[dict[str, object]]:
    text = page_text(document)
    title_match = re.search(r"Patch Notes\s*-\s*Update\s*([0-9.]+)", text, re.I)
    if not title_match:
        return []
    version = title_match.group(1).rstrip(".")
    title = f"Patch Notes - Update {version}"
    lines = [line.strip(" •-\t") for line in text.splitlines()]
    result: list[dict[str, object]] = []
    seen: set[str] = set()
    for line in lines:
        if len(line) < 18 or len(line) > 500:
            continue
        category = classify(line)
        if not category:
            continue
        normalized = re.sub(r"\s+", " ", line)
        digest = hashlib.sha256(f"{url}\n{normalized}".encode()).hexdigest()
        if digest in seen:
            continue
        seen.add(digest)
        subject = subject_key(normalized)
        if subject and subject.startswith("Item_Attach_"):
            category = "attachment"
        stat, stat_label = stat_key(normalized)
        before, after, unit = before_after(normalized)
        result.append(
            {
                "source_url": url,
                "source_hash": digest,
                "title": title,
                "detected_version": version,
                "category": category,
                "subject_key": subject,
                "stat_key": stat,
                "change_type": change_type(normalized),
                "summary": normalized[:240],
                "summary_ko": korean_summary(normalized, subject, stat_label),
                "before_value": before,
                "after_value": after,
                "unit": unit,
                "evidence_text": normalized,
                "confidence": 0.82 if subject and (before or stat) else 0.55,
                "review_status": "pending",
            }
        )
    return result[:120]


def main() -> None:
    database = SupabaseRest()
    detected: list[dict[str, object]] = []
    for url in patch_links(fetch(NEWS_URL)):
        page_candidates = candidates(url, fetch(url))
        detected.extend(page_candidates)
        if page_candidates:
            first = page_candidates[0]
            database.upsert(
                "patch_versions",
                [{
                    "version": first["detected_version"],
                    "title": first["title"],
                    "source_url": url,
                    "status": "draft",
                }],
                on_conflict="version",
                ignore_duplicates=True,
            )
    database.upsert(
        "patch_candidates",
        detected,
        on_conflict="source_url,source_hash",
        ignore_duplicates=True,
    )
    print(f"Staged {len(detected)} conservative patch candidates for review.")


if __name__ == "__main__":
    main()
