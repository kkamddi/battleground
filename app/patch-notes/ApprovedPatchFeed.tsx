type ApprovedChange = {
  detected_version: string | null;
  category: string;
  change_type: string | null;
  summary: string;
  source_url: string;
};

const categoryLabels: Record<string, string> = {
  weapon: "총기",
  attachment: "파츠",
  map: "맵",
  ranked: "경쟁전",
  system: "시스템",
  bug_fix: "버그 수정",
};

const changeLabels: Record<string, string> = {
  buff: "상향",
  nerf: "하향",
  new: "신규",
  removed: "삭제",
  neutral: "변경",
};

async function approvedChanges() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const search = new URLSearchParams({
    select: "detected_version,category,change_type,summary,source_url",
    review_status: "eq.approved",
    order: "reviewed_at.desc",
    limit: "100",
  });
  const response = await fetch(`${url}/rest/v1/patch_candidates?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  return response.json() as Promise<ApprovedChange[]>;
}

export default async function ApprovedPatchFeed() {
  const rows = await approvedChanges();
  if (!rows.length) return null;
  const versions = new Map<string, ApprovedChange[]>();
  for (const row of rows) {
    const version = row.detected_version ?? "확인 중";
    versions.set(version, [...(versions.get(version) ?? []), row]);
  }

  return (
    <section className="approved-patch-feed">
      <div className="home-section-head">
        <div><span>REVIEWED AUTO FEED</span><h2>승인된 최신 변경</h2></div>
        <p>공식 원문 자동 감지 후 관리자 검수를 통과한 내용입니다.</p>
      </div>
      {[...versions.entries()].slice(0, 3).map(([version, changes]) => (
        <article key={version}>
          <strong>UPDATE {version}</strong>
          <ul>
            {changes.slice(0, 12).map((change) => (
              <li key={`${change.category}-${change.summary}`}>
                <span>{categoryLabels[change.category] ?? change.category}</span>
                <b className={change.change_type ?? "neutral"}>{changeLabels[change.change_type ?? "neutral"] ?? "변경"}</b>
                <p>{change.summary}</p>
              </li>
            ))}
          </ul>
          <a href={changes[0].source_url} target="_blank" rel="noreferrer">공식 원문 ↗</a>
        </article>
      ))}
    </section>
  );
}

