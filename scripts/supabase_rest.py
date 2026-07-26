"""Small Supabase REST helper used by scheduled data jobs."""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from typing import Any


class SupabaseRest:
    def __init__(self) -> None:
        self.base_url = os.environ["SUPABASE_URL"].rstrip("/") + "/rest/v1"
        self.key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    def request(
        self,
        table: str,
        *,
        method: str = "GET",
        params: dict[str, str] | None = None,
        rows: list[dict[str, Any]] | dict[str, Any] | None = None,
        prefer: str | None = None,
    ) -> Any:
        query = urllib.parse.urlencode(params or {}, safe="(),.*:")
        url = f"{self.base_url}/{table}" + (f"?{query}" if query else "")
        body = json.dumps(rows, ensure_ascii=False).encode() if rows is not None else None
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        request = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read()
            return json.loads(payload) if payload else None

    def upsert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        on_conflict: str,
        ignore_duplicates: bool = False,
    ) -> None:
        if not rows:
            return
        resolution = "ignore-duplicates" if ignore_duplicates else "merge-duplicates"
        for start in range(0, len(rows), 250):
            self.request(
                table,
                method="POST",
                params={"on_conflict": on_conflict},
                rows=rows[start : start + 250],
                prefer=f"resolution={resolution},return=minimal",
            )

    def select_all(self, table: str, params: dict[str, str], page_size: int = 1000) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        offset = 0
        while True:
            page_params = {**params, "limit": str(page_size), "offset": str(offset)}
            page = self.request(table, params=page_params) or []
            result.extend(page)
            if len(page) < page_size:
                return result
            offset += page_size

