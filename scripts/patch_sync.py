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
    return unique[:12]


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
        result.append(
            {
                "source_url": url,
                "source_hash": digest,
                "title": title,
                "detected_version": version,
                "category": category,
                "change_type": change_type(normalized),
                "summary": normalized[:240],
                "evidence_text": normalized,
                "confidence": 0.55,
                "review_status": "pending",
            }
        )
    return result[:120]


def main() -> None:
    database = SupabaseRest()
    detected: list[dict[str, object]] = []
    for url in patch_links(fetch(NEWS_URL)):
        detected.extend(candidates(url, fetch(url)))
    database.upsert(
        "patch_candidates",
        detected,
        on_conflict="source_url,source_hash",
        ignore_duplicates=True,
    )
    print(f"Staged {len(detected)} conservative patch candidates for review.")


if __name__ == "__main__":
    main()
