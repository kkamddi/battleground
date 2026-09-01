type ApprovedChange = {
  detected_version: string | null;
  category: string;
  change_type: string | null;
  summary: string;
  summary_ko: string | null;
  source_url: string;
};

type PublishedPatch = {
  version: string;
  title: string;
  source_url: string;
  published_at: string | null;
  pc_applied_at: string | null;
  console_applied_at: string | null;
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

async function query<T>(table: string, search: URLSearchParams): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const response = await fetch(`${url}/rest/v1/${table}?${search}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return [];
  return response.json() as Promise<T[]>;
}

async function approvedChanges() {
  return query<ApprovedChange>("patch_candidates", new URLSearchParams({
    select: "detected_version,category,change_type,summary,summary_ko,source_url",
    review_status: "eq.approved",
    order: "reviewed_at.desc",
    limit: "100",
  }));
}

async function publishedPatches() {
  return query<PublishedPatch>("patch_versions", new URLSearchParams({
    select: "version,title,source_url,published_at,pc_applied_at,console_applied_at",
    status: "eq.published",
    order: "published_at.desc.nullslast,created_at.desc",
    limit: "3",
  }));
}

function formatDate(value: string | null) {
  return value ? value.slice(0, 10).replaceAll("-", ".") : null;
}

export default async function ApprovedPatchFeed() {
  const [patches, rows] = await Promise.all([publishedPatches(), approvedChanges()]);
  if (!patches.length) return null;
  const versions = new Map<string, ApprovedChange[]>();
  for (const row of rows) {
    const version = row.detected_version ?? "확인 중";
    versions.set(version, [...(versions.get(version) ?? []), row]);
  }

  return (
    <section className="approved-patch-feed">
      <div className="home-section-head">
        <div><span>OFFICIAL AUTO FEED</span><h2>공식 최신 업데이트</h2></div>
        <p>PUBG 공식 패치노트를 매일 확인해 새 업데이트를 자동 반영합니다.</p>
      </div>
      {patches.map((patch) => {
        const changes = versions.get(patch.version) ?? [];
        return (
          <article key={patch.version}>
            <strong>UPDATE {patch.version}</strong>
            <p>{formatDate(patch.published_at) ?? "공식 패치노트 공개"}</p>
            {changes.length ? (
              <ul>
                {changes.slice(0, 12).map((change) => (
                  <li key={`${change.category}-${change.summary}`}>
                    <span>{categoryLabels[change.category] ?? change.category}</span>
                    <b className={change.change_type ?? "neutral"}>{changeLabels[change.change_type ?? "neutral"] ?? "변경"}</b>
                    <p>{change.summary_ko ?? change.summary}</p>
                  </li>
                ))}
              </ul>
            ) : <p>새 공식 업데이트가 감지되었습니다. 세부 변경사항은 공식 원문에서 확인할 수 있습니다.</p>}
            <a href={patch.source_url} target="_blank" rel="noreferrer">공식 원문 ↗</a>
          </article>
        );
      })}
    </section>
  );
}
