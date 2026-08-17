"use client";

import { useEffect, useState } from "react";
import { generatedTranslations } from "./generatedTranslations";

type Language = "ko" | "en";

const translations: Record<string, string> = {
  ...generatedTranslations,
  "맵": "Maps",
  "패치노트": "Patch Notes",
  "총기 도감": "Weapons",
  "통계": "Stats",
  "실험실": "Lab",
  "가이드": "Guides",
  "주요 메뉴": "Main navigation",
  "BGI 홈": "BGI Home",
  "홈": "Home",
  "전적 검색": "Match Search",
  "게임 내 닉네임으로 최근 전적, 플레이 스타일, 킬 무기와 자주 쓰는 파츠를 확인합니다.": "Search an in-game nickname to view recent matches, play style, kill weapons, and frequently used attachments.",
  "PUBG 게임 닉네임": "PUBG in-game nickname",
  "닉네임": "Nickname",
  "게임 내 닉네임 입력": "Enter in-game nickname",
  "PUBG 플랫폼": "PUBG platform",
  "경쟁전 상위 플레이어": "Ranked Leaders",
  "플레이어를 선택하면 최근 경기에서 확인된 총기와 파츠 조합까지 BGI 리포트로 연결됩니다.": "Select a player to open a BGI report with weapons and attachment combinations found in recent matches.",
  "플레이어": "Player",
  "현재 리더보드를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.": "The leaderboard is temporarily unavailable. Please try again shortly.",
  "순위와 시즌 기록은 PUBG 공식 API 기준입니다. 총기·파츠 리포트는 최근 14일 내 확인 가능한 경기 텔레메트리를 BGI가 분석한 결과이며, 경기 수에 따라 표본이 달라질 수 있습니다.": "Rankings and season records come from the official PUBG API. Weapon and attachment reports are based on BGI analysis of available match telemetry from the last 14 days, so sample sizes may vary.",
  "비공식 PUBG 정보 서비스입니다. KRAFTON 또는 PUBG의 공식 서비스가 아닙니다.": "An unofficial PUBG information service. Not affiliated with KRAFTON or PUBG.",
  "공식 패치노트": "Official Patch Notes",
  "데이터 기준": "Data Sources",
  "전체": "All",
  "검색": "Search",
  "총기명": "Weapon name",
  "총기": "Weapon",
  "분류": "Class",
  "탄약": "Ammo",
  "피해량": "Damage",
  "탄속": "Velocity",
  "탄창": "Magazine",
  "최근 변경": "Latest Change",
  "변경 없음": "No change",
  "조건에 맞는 총기가 없습니다.": "No weapons match these filters.",
  "파츠 도감": "Attachment Index",
  "파츠": "Attachment",
  "호환 범위": "Compatibility",
  "핵심 효과": "Key Effect",
  "추천 용도": "Recommended Use",
  "총기 스펙": "Weapon Specs",
  "총기 정보": "Weapon Info",
  "파츠 추천": "Attachment Recommendations",
  "실전 파츠 조합": "Field-tested Loadouts",
  "재장전": "Reload",
  "연사 속도": "Fire Rate",
  "탄창 용량": "Magazine Capacity",
  "연사": "Automatic fire",
  "단발": "Single fire",
  "수직": "Vertical",
  "수평": "Horizontal",
  "반동": "Recoil",
  "현행": "Current",
  "다수": "Multiple",
  "총구": "Muzzle",
  "화면 흔들림": "Screen shake",
  "은폐": "Concealment",
  "지속": "Sustained",
  "전 맵": "All maps",
  "약": "Approximately",
  "탄두": "Projectile",
  "프라이팬": "Pan",
  "년": "Year",
  "별": "By",
  "권장 배율": "Recommended Scope",
  "운용 거리": "Effective Range",
  "맵 선택": "Select Map",
  "일반전": "Normal",
  "경쟁전": "Ranked",
  "필터 닫기": "Close Filters",
  "차고지": "Garages",
  "고정 차량": "Fixed Vehicles",
  "고정 보트": "Fixed Boats",
  "글라이더": "Gliders",
  "비밀의 방": "Secret Rooms",
  "주유소": "Gas Stations",
  "상위랭커 초반 루트": "Top-player Early Routes",
  "분석 중": "Analyzing",
  "확인 중": "Checking",
  "게임 모드": "Game Mode",
  "지도 도구": "Map Tools",
  "새로고침": "Refresh",
  "성장형 스킨 목록": "Progressive Skin List",
  "성장형 스킨 필터": "Progressive Skin Filters",
  "스킨 또는 무기 검색": "Search skin or weapon",
  "출시 연도 선택": "Select release year",
  "무기 선택": "Select weapon",
  "날짜 없음": "No date",
  "신규": "New",
  "상향": "Buff",
  "하향": "Nerf",
  "삭제": "Removed",
  "변경": "Changed",
  "버그 수정": "Bug Fix",
  "시스템": "System",
  "서비스 업데이트": "Service Update",
  "시즌 콘텐츠": "Season Content",
  "신규 월드 피처": "New World Features",
  "월드 및 시스템 개선": "World & System Improvements",
  "총기별 실전 킬 순위": "Weapon Kill Rankings",
  "평균 피해량": "Average Damage",
  "승률": "Win Rate",
  "최근 5경기 평균 킬": "Average Kills (Last 5)",
  "최근 5경기 평균 피해": "Average Damage (Last 5)",
  "최근 플레이 핵심 지표": "Recent Performance",
  "전적 링크를 복사했습니다.": "Match link copied.",
  "결과 카드 저장·공유": "Save or Share Card",
  "카드를 저장했습니다.": "Card saved.",
  "최근 폼 그래프": "Recent Form Chart",
  "경기별 피해량 추이 · 상단 K는 킬 수": "Damage by match · K above each bar is kills",
  "최근 10경기 피해량과 킬 추이": "Damage and kill trend over the last 10 matches",
  "이전": "Older",
  "최근": "Latest",
  "BGI 경기 평가": "BGI Match Rating",
  "캐리 경기": "Carry Performance",
  "좋은 경기": "Strong Performance",
  "안정적인 경기": "Solid Performance",
  "아쉬운 경기": "Room to Improve",
  "교전 기여": "Combat Contribution",
  "팀 지원": "Team Support",
  "정밀 사격": "Precision",
  "이동 거리": "Distance Traveled",
  "부활": "Revives",
  "회복": "Recovery",
  "2D 리플레이 보기": "View 2D Replay",
  "리플레이 분석 중…": "Analyzing replay…",
  "이 매치의 텔레메트리를 불러올 수 없습니다.": "Telemetry is unavailable for this match.",
  "본인과 팀원의 이동·교전·자기장을 표시합니다.": "Shows your squad's movement, combat, and safe zones.",
  "일시정지": "Pause",
  "처음부터 재생": "Replay",
  "재생": "Play",
  "팀 이동 경로": "Squad Route",
  "☆ 즐겨찾기": "☆ Favorite",
  "★ 즐겨찾기 저장됨": "★ Saved",
  "즐겨찾는 플레이어": "Favorite Players",
  "즐겨찾기": "Favorites",
  "이 브라우저에 저장된 플레이어": "Players saved in this browser",
  "즐겨찾기 삭제": "Remove favorite",
  "최근 검색": "Recent Searches",
  "최근 검색한 플레이어를 바로 다시 확인하세요.": "Quickly reopen players you searched for recently.",
  "왜 이런 전적이 나왔을까?": "Why did I get these results?",
  "최근 경기의 플레이 결과를 네 가지 축으로 분석했습니다.": "Recent match results are analyzed across four performance areas.",
  "교전": "Combat",
  "생존": "Survival",
  "운영": "Rotation",
  "팀 기여": "Teamplay",
  "분석": "Analysis",
  "다음 경기 미션": "Next-match Missions",
  "다운을 만든 교전은 시야를 유지해 킬 전환률을 높이기": "Keep sight of knocked enemies and improve kill conversion.",
  "첫 10분 생존과 Top 10 진입을 우선 목표로 잡기": "Prioritize surviving the first 10 minutes and reaching the Top 10.",
  "첫 자기장 확정 뒤 이동 수단과 다음 거점을 먼저 확보하기": "Secure transport and your next position after the first circle appears.",
  "교전 전 팀 간격을 좁혀 어시스트·부활 기회를 만들기": "Stay closer to your squad before fights to create assist and revive opportunities.",
  "현재 강점을 유지하며 최근 평균 피해량을 10% 높이기": "Maintain your strengths while raising recent average damage by 10%.",
  "피해량에 비해 킬 전환이 낮습니다. 첫 타격 이후 확정 각과 팀의 집중 사격을 연결하는 과정이 핵심입니다.": "Kill conversion is low relative to damage. Focus on confirming angles after the first hit and coordinating squad fire.",
  "초중반 교전 성과는 좋지만 후반 진입률이 낮습니다. 교전 직후 정비 시간을 줄이고 다음 안전 구역을 먼저 잡는 편이 유리합니다.": "Early and mid-game fighting is strong, but late-game conversion is low. Reset faster after fights and secure the next safe position first.",
  "후반까지 살아남는 운영은 안정적이지만 유효 교전이 적습니다. 유리한 지형에서 먼저 사격할 수 있는 자리를 만드는 것이 다음 단계입니다.": "Late-game survival is stable, but effective engagements are limited. The next step is securing terrain that lets you shoot first.",
  "생존과 운영에 비해 교전 성과가 낮습니다. 유리한 자리에서 먼저 사격할 수 있는 교전을 선택해 보세요.": "Combat results trail survival and rotation. Choose engagements where your position lets you shoot first.",
  "교전 성과에 비해 생존 지표가 낮습니다. 교전 직후 정비와 다음 안전 구역 진입을 앞당겨 보세요.": "Survival trails combat performance. Reset faster after fights and enter the next safe zone earlier.",
  "전투 성과에 비해 이동과 운영 지표가 낮습니다. 첫 자기장부터 이동 수단과 다음 거점을 준비해 보세요.": "Movement and rotation trail combat performance. Prepare transport and your next position from the first circle.",
  "개인 전투 지표는 강점이지만 팀 기여는 보완할 여지가 있습니다. 팀 간격을 좁혀 함께 사격할 기회를 늘려 보세요.": "Individual combat is a strength, but team contribution has room to improve. Stay closer to your squad and create more opportunities to focus fire together.",
  "점수는 최근 경기 안에서 확인되는 피해량·킬·생존·이동·팀 기여 지표를 BGI 기준으로 환산한 참고 지표입니다.": "Scores are BGI reference metrics derived from damage, kills, survival, movement, and team contribution in recent matches.",
  "비교할 닉네임": "Nickname to compare",
  "분석 신뢰도 높음": "High confidence",
  "분석 표본 부족": "Limited sample",
  "예비 분석": "Preliminary analysis",
  "주의": "Caution",
  "미지원": "Unsupported",
  "거리": "Distance",
  "방어구": "Armor",
  "주무기": "Primary",
  "보조무기": "Secondary",
  "조준경": "Optic",
  "배치 전": "Placement pending",
  "현재 일반전": "Current Normal",
  "현재 경쟁전": "Current Ranked",
  "기록 없음": "No record",
  "선택한 모드의 시즌 기록이 없습니다.": "No season record is available for the selected mode.",
  "언랭크": "Unranked",
  "브론즈": "Bronze",
  "실버": "Silver",
  "골드": "Gold",
  "플래티넘": "Platinum",
  "다이아몬드": "Diamond",
  "마스터": "Master",
  "전적 검색 서버 설정을 마무리하고 있습니다.": "The match search server is being finalized.",
  "현재 검색 요청이 많습니다. 잠시 후 다시 시도해 주세요.": "Search traffic is high. Please try again shortly.",
  "PUBG 전적을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.": "Unable to load PUBG match data. Please try again shortly.",
  "PUBG 전적 검색·경쟁전 랭킹": "PUBG Match Search & Ranked Leaderboard",
  "PUBG 전적검색·총기·맵 정보 | BGI": "PUBG Match Search, Weapons & Maps | BGI",
  "현재 스펙, 최근 변경과 실전 파츠 조합을 총기 상세에서 함께 확인합니다. 총 49종.": "Compare current specs, recent changes, and field-tested attachment combinations for all 49 weapons.",
  "현재 스펙, 최근 변경과 실전 파츠 조합을 총기 상세에서 함께 확인합니다. 총": "Compare current specs, recent changes, and field-tested attachment combinations. Total:",
  "종.": " weapons.",
  "PUBG 총기 도감 | BGI": "PUBG Weapon Index | BGI",
  "PUBG 총기 도감": "PUBG Weapon Index",
  "성장형 스킨 도감 46종 →": "Progressive Skin Index: 46 skins →",
  "이미지·분류": "Images & Classes",
  "수치 스펙": "Numerical Specs",
  "PUBG 공식 PC·콘솔 게임 정보 페이지": "Official PUBG PC and console game information pages",
  "공개 자료와 공식 패치 이력을 교차 검증한 관리 데이터입니다. 게임 빌드와 차이가 있을 수 있습니다.": "Maintained data cross-checked against public sources and official patch history. Values may differ from the current game build.",
  "공식 패치노트 누적 변경과 실전 텔레메트리 추천을 구분해 표시합니다.": "Cumulative official patch changes and telemetry-based recommendations are shown separately.",
};

const replacements: Array<[RegExp, string]> = [
  [/경쟁전 TOP 10/g, "Ranked TOP 10"],
  [/현재 시즌/g, "Current season"],
  [/2시간마다 갱신/g, "Updated every 2 hours"],
  [/스쿼드 TPP/g, "Squad TPP"],
  [/스쿼드 FPP/g, "Squad FPP"],
  [/스쿼드/g, "Squad"],
  [/솔로 TPP/g, "Solo TPP"],
  [/솔로 FPP/g, "Solo FPP"],
  [/듀오 TPP/g, "Duo TPP"],
  [/듀오 FPP/g, "Duo FPP"],
  [/의 무기·파츠 리포트 보기/g, "'s weapon & attachment report"],
  [/총 ([0-9,]+)종/g, "$1 weapons"],
  [/([0-9,]+)경기/g, "$1 matches"],
  [/([0-9,]+)킬/g, "$1 kills"],
  [/최근 ([0-9]+)일/g, "Last $1 days"],
  [/최근 ([0-9]+)경기/g, "Last $1 matches"],
  [/일반전/g, "Normal"],
  [/경쟁전/g, "Ranked"],
  [/평균/g, "Average"],
  [/최근/g, "Recent"],
  [/총기/g, "Weapon"],
  [/파츠/g, "Attachment"],
  [/피해량/g, "Damage"],
  [/탄속/g, "Velocity"],
  [/탄창/g, "Magazine"],
  [/검색/g, "Search"],
  [/선택/g, "Select"],
  [/추천/g, "Recommended"],
  [/변경 없음/g, "No change"],
];

const generatedReplacements = Object.entries(translations)
  .filter(([source, target]) => source !== target && source.length > 0)
  .sort(([a], [b]) => b.length - a.length);

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["aria-label", "placeholder", "title"];

function translate(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;
  let result = translations[core] ?? core;
  if (result === core) {
    replacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });
  }
  generatedReplacements.forEach(([source, replacement]) => {
    result = result.replaceAll(source, replacement);
  });
  return `${leading}${result}${trailing}`;
}

function updateNode(node: Node, language: Language) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    const parent = text.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) || parent.closest("[data-no-translate]")) return;
    if (!originalText.has(text)) originalText.set(text, text.data);
    const original = originalText.get(text) ?? text.data;
    const next = language === "en" ? translate(original) : original;
    if (text.data !== next) text.data = next;
    return;
  }

  if (!(node instanceof Element)) return;
  if (node.matches("[data-no-translate], [data-no-translate] *")) return;
  let originals = originalAttributes.get(node);
  if (!originals) {
    originals = new Map<string, string>();
    originalAttributes.set(node, originals);
  }
  translatedAttributes.forEach((attribute) => {
    const value = node.getAttribute(attribute);
    if (value !== null && !originals!.has(attribute)) originals!.set(attribute, value);
    const original = originals!.get(attribute);
    if (original !== undefined) node.setAttribute(attribute, language === "en" ? translate(original) : original);
  });
  node.childNodes.forEach((child) => updateNode(child, language));
}

function applyLanguage(language: Language) {
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
  updateNode(document.head, language);
  updateNode(document.body, language);
}

export default function LanguageToggle() {
  const [language, setLanguage] = useState<Language>("ko");

  useEffect(() => {
    const sync = (event?: Event) => {
      const selected = event instanceof CustomEvent
        ? event.detail
        : document.documentElement.dataset.language ?? window.localStorage.getItem("bgi-language");
      setLanguage(selected === "en" ? "en" : "ko");
    };
    sync();
    window.addEventListener("bgi-language-change", sync);
    return () => window.removeEventListener("bgi-language-change", sync);
  }, []);

  function toggle() {
    const next: Language = language === "ko" ? "en" : "ko";
    window.dispatchEvent(new CustomEvent("bgi-language-change", { detail: next }));
  }

  return (
    <button
      aria-label={language === "ko" ? "Switch to English" : "Switch to Korean"}
      className="language-toggle"
      data-no-translate
      onClick={toggle}
      type="button"
    >
      <span className={language === "ko" ? "active" : ""}>KO</span>
      <i>/</i>
      <span className={language === "en" ? "active" : ""}>EN</span>
    </button>
  );
}

export function LanguageRuntime() {
  useEffect(() => {
    let language: Language = window.localStorage.getItem("bgi-language") === "en" ? "en" : "ko";
    applyLanguage(language);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") updateNode(mutation.target, language);
        mutation.addedNodes.forEach((node) => updateNode(node, language));
      });
    });
    observer.observe(document.documentElement, { characterData: true, childList: true, subtree: true });

    const change = (event: Event) => {
      language = event instanceof CustomEvent && event.detail === "en" ? "en" : "ko";
      window.localStorage.setItem("bgi-language", language);
      applyLanguage(language);
    };
    window.addEventListener("bgi-language-change", change);
    return () => {
      observer.disconnect();
      window.removeEventListener("bgi-language-change", change);
    };
  }, []);

  return null;
}
