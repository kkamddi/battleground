export type ProgressiveLevel = {
  level: number;
  description: string;
  kind: "외형 변화" | "기능 해금";
  preview?: "base" | "official";
};

export type ProgressiveSkin = {
  slug: string;
  name: string;
  weapon: string;
  released: string;
  maxLevel: number | null;
  officialUrl?: string;
  officialImageUrl?: string;
  baseImageUrl?: string;
  baseImageSourceUrl?: string;
  catalogImageUrl?: string;
  catalogSourceUrl?: string;
  levels?: ProgressiveLevel[];
};

const levels = (items: Array<[string, ProgressiveLevel["kind"], ProgressiveLevel["preview"]?]>) =>
  items.map(([description, kind, preview], index) => ({ level: index + 1, description, kind, preview }));

const progressiveCatalogBase: ProgressiveSkin[] = [
  {
    slug: "pretend-prototype-slr",
    name: "상상력 풀가동",
    weapon: "SLR",
    released: "2026.07",
    maxLevel: 10,
    officialUrl: "https://www.pubg.com/ko/news/10427",
    officialImageUrl: "https://wstatic-prod-boc.krafton.com/common/news/20260714/0BLcjwHD.jpg",
    baseImageUrl: "https://cdn.pubgitems.info/i-large/12012046.png",
    baseImageSourceUrl: "https://pubgitems.info/weapons/dmr/12012046-pretend-prototype-slr",
    levels: levels([
      ["기본 스킨 외형", "외형 변화", "base"], ["헤드샷 킬 배틀스탯", "기능 해금"],
      ["무기 살펴보기 애니메이션", "기능 해금"], ["탄창 / 총구 스킨", "외형 변화"],
      ["중급 스킨 외형", "외형 변화"], ["킬피드 스킨", "기능 해금"],
      ["스코프 / 개머리판 스킨", "외형 변화"], ["전리품 상자 스킨", "외형 변화"],
      ["고급 스킨 외형", "외형 변화", "official"], ["킬 이펙트", "기능 해금"],
    ]),
  },
  {
    slug: "ride-or-die-m249",
    name: "라이드 오어 다이",
    weapon: "M249",
    released: "2026.05",
    maxLevel: 6,
    officialUrl: "https://www.pubg.com/ko/news/10041",
    officialImageUrl: "https://wstatic-prod-boc.krafton.com/common/news/20260512/O77JyKWI.jpg",
    baseImageUrl: "https://cdn.pubgitems.info/i-large/12012045.png",
    baseImageSourceUrl: "https://pubgitems.info/weapons/lmg/12012045-ride-or-die-m249",
    levels: levels([
      ["기본 스킨 외형", "외형 변화", "base"], ["탄창 / 개머리판 스킨", "외형 변화"],
      ["헤드샷 킬 배틀스탯", "기능 해금"], ["스코프 스킨", "외형 변화"],
      ["킬피드 스킨", "기능 해금"], ["중급 스킨 외형", "외형 변화", "official"],
    ]),
  },
  { slug: "cosmic-caliber-kar98k", name: "코스믹 캘리버", weapon: "Kar98k", released: "2026.04", maxLevel: 10, officialUrl: "https://www.pubg.com/ko/news/9892" },
  { slug: "void-pan", name: "Void", weapon: "프라이팬", released: "2026", maxLevel: null },
  { slug: "absolute-zero-groza", name: "Absolute Zero", weapon: "Groza", released: "2026", maxLevel: null },
  {
    slug: "time-keeper-m416",
    name: "타임 키퍼",
    weapon: "M416",
    released: "2026.02",
    maxLevel: 10,
    officialUrl: "https://pubg.com/ko/news/9707",
    officialImageUrl: "https://wstatic-prod-boc.krafton.com/common/news/20260129/6435pixJ.jpg",
    baseImageUrl: "https://cdn.pubgitems.info/i-large/12012041.png",
    baseImageSourceUrl: "https://pubgitems.info/weapons/ar/12012041-time-keeper-m416",
    levels: levels([
      ["기본 스킨 외형", "외형 변화", "base"], ["헤드샷 킬 배틀스탯", "기능 해금"],
      ["무기 살펴보기 애니메이션", "기능 해금"], ["탄창 / 총구 스킨", "외형 변화"],
      ["중급 스킨 외형", "외형 변화"], ["킬피드 스킨", "기능 해금"],
      ["손잡이 / 개머리판 스킨", "외형 변화"], ["전리품 상자 스킨", "외형 변화"],
      ["스코프 스킨", "외형 변화"], ["고급 스킨 외형 / 상시 이펙트", "외형 변화", "official"],
    ]),
  },
  { slug: "obscura-mk12", name: "Obscura", weapon: "Mk12", released: "2025", maxLevel: null },
  { slug: "faded-ghost-awm", name: "Faded Ghost", weapon: "AWM", released: "2025", maxLevel: null },
  { slug: "winter-eclipse-mp5k", name: "Winter Eclipse", weapon: "MP5K", released: "2025", maxLevel: null },
  { slug: "final-serenade-m24", name: "Final Serenade", weapon: "M24", released: "2025", maxLevel: null },
  { slug: "g-dragon-aug", name: "G-DRAGON", weapon: "AUG", released: "2025", maxLevel: null },
  { slug: "sun-scorched-s1897", name: "Sun Scorched", weapon: "S1897", released: "2025", maxLevel: null },
  { slug: "demons-touch-ace32", name: "Demon's Touch", weapon: "ACE32", released: "2025", maxLevel: null },
  { slug: "chrono-cannon-sks", name: "Chrono Cannon", weapon: "SKS", released: "2025", maxLevel: null },
  { slug: "hocus-focus-mk12", name: "Hocus Focus", weapon: "Mk12", released: "2025", maxLevel: null },
  { slug: "siren-pan", name: "Siren", weapon: "프라이팬", released: "2025", maxLevel: null },
  { slug: "cerberus-m249", name: "Cerberus", weapon: "M249", released: "2024", maxLevel: null },
  { slug: "medusa-beryl-m762", name: "Medusa", weapon: "Beryl M762", released: "2024", maxLevel: null },
  { slug: "minotaur-aug", name: "Minotaur", weapon: "AUG", released: "2024", maxLevel: null },
  { slug: "midnight-menace-kar98k", name: "Midnight Menace", weapon: "Kar98k", released: "2024", maxLevel: null },
  { slug: "zero-g-mp5k", name: "ZERO-G", weapon: "MP5K", released: "2024", maxLevel: null },
  { slug: "no-signal-m416", name: "No Signal", weapon: "M416", released: "2024", maxLevel: null },
  { slug: "rest-in-pink-dragunov", name: "Rest in Pink", weapon: "Dragunov", released: "2024", maxLevel: null },
  { slug: "bumper-blaster-aug", name: "Bumper Blaster", weapon: "AUG", released: "2024", maxLevel: null },
  { slug: "tang-sanzang-pan", name: "Tang Sanzang", weapon: "프라이팬", released: "2024", maxLevel: null },
  { slug: "sha-wujing-mini14", name: "Sha Wujing", weapon: "Mini14", released: "2024", maxLevel: null },
  { slug: "zhu-bajie-m416", name: "Zhu Bajie", weapon: "M416", released: "2024", maxLevel: null },
  { slug: "sun-wukong-m24", name: "Sun Wukong", weapon: "M24", released: "2024", maxLevel: null },
  { slug: "santas-helper-akm", name: "Santa's Helper", weapon: "AKM", released: "2023", maxLevel: null },
  { slug: "bunny-patrol-mk12", name: "Bunny Patrol", weapon: "Mk12", released: "2023", maxLevel: null },
  { slug: "atlantis-dbs", name: "Atlantis", weapon: "DBS", released: "2023", maxLevel: null },
  { slug: "deadly-dollhouse-slr", name: "Deadly Dollhouse", weapon: "SLR", released: "2023", maxLevel: null },
  { slug: "neon-dream-aug", name: "Neon Dream", weapon: "AUG", released: "2023", maxLevel: null },
  { slug: "white-tiger-pan", name: "White Tiger", weapon: "프라이팬", released: "2023", maxLevel: null },
  { slug: "black-tortoise-sks", name: "Black Tortoise", weapon: "SKS", released: "2023", maxLevel: null },
  { slug: "azure-dragon-beryl-m762", name: "Azure Dragon", weapon: "Beryl M762", released: "2023", maxLevel: null },
  { slug: "phoenix-m416", name: "Phoenix", weapon: "M416", released: "2023", maxLevel: null },
  {
    slug: "demon-hunter-ace32",
    name: "Demon Hunter",
    weapon: "ACE32",
    released: "2022",
    maxLevel: 10,
    officialUrl: "https://www.pubg.com/en/news/1532",
    levels: levels([
      ["기본 스킨 외형", "외형 변화"], ["탄창 / 총구 스킨", "외형 변화"],
      ["킬 배틀스탯", "기능 해금"], ["중급 스킨 외형", "외형 변화"],
      ["무기 살펴보기 애니메이션", "기능 해금"], ["킬피드 스킨", "기능 해금"],
      ["손잡이 / 개머리판 스킨", "외형 변화"], ["고급 스킨 외형", "외형 변화"],
      ["전리품 상자 스킨", "외형 변화"], ["스코프 스킨", "외형 변화"],
    ]),
  },
  { slug: "over-the-rainbow-m24", name: "Over the Rainbow", weapon: "M24", released: "2022", maxLevel: null },
  { slug: "darkest-depths-beryl-m762", name: "Darkest Depths", weapon: "Beryl M762", released: "2022", maxLevel: null },
  { slug: "cyber-threat-mk12", name: "Cyber Threat", weapon: "Mk12", released: "2022", maxLevel: null },
  { slug: "tiger-hunter-kar98k", name: "Tiger Hunter", weapon: "Kar98k", released: "2022", maxLevel: null },
  { slug: "yule-sleigh-mini14", name: "Yule Sleigh", weapon: "Mini14", released: "2021", maxLevel: null },
  {
    slug: "trick-or-treat-m416",
    name: "Trick-or-treat",
    weapon: "M416",
    released: "2021",
    maxLevel: 10,
    officialUrl: "https://pubg.com/en/news/1714",
    levels: levels([
      ["기본 스킨 외형", "외형 변화"], ["탄창 / 총구 스킨", "외형 변화"],
      ["중급 스킨 외형", "외형 변화"], ["킬 배틀스탯", "기능 해금"],
      ["무기 살펴보기 애니메이션", "기능 해금"], ["킬피드 스킨", "기능 해금"],
      ["손잡이 / 개머리판 스킨", "외형 변화"], ["고급 스킨 외형", "외형 변화"],
      ["전리품 상자 스킨", "외형 변화"], ["스코프 스킨", "외형 변화"],
    ]),
  },
  {
    slug: "buzzkill-slr",
    name: "Buzzkill",
    weapon: "SLR",
    released: "2021",
    maxLevel: 10,
    officialUrl: "https://www.pubg.com/en/news/1722",
    levels: levels([
      ["기본 스킨 외형", "외형 변화"], ["총구 / 개머리판 스킨", "외형 변화"],
      ["중급 스킨 외형", "외형 변화"], ["킬 배틀스탯", "기능 해금"],
      ["무기 살펴보기 애니메이션", "기능 해금"], ["킬피드 스킨", "기능 해금"],
      ["스코프 스킨", "외형 변화"], ["고급 스킨 외형", "외형 변화"],
      ["전리품 상자 스킨", "외형 변화"], ["탄창 스킨", "외형 변화"],
    ]),
  },
  { slug: "gear-head-beryl-m762", name: "Gear Head", weapon: "Beryl M762", released: "2021", maxLevel: null },
];

const catalogCategoryByWeapon: Record<string, string> = {
  SLR: "dmr",
  M249: "lmg",
  Kar98k: "sr",
  프라이팬: "melee",
  Groza: "ar",
  M416: "ar",
  Mk12: "dmr",
  AWM: "sr",
  MP5K: "smg",
  M24: "sr",
  AUG: "ar",
  S1897: "shotgun",
  ACE32: "ar",
  SKS: "dmr",
  "Beryl M762": "ar",
  Dragunov: "dmr",
  Mini14: "dmr",
  AKM: "ar",
  DBS: "shotgun",
};

export const progressiveCatalog: ProgressiveSkin[] = progressiveCatalogBase.map((skin, index) => {
  const itemNumber = progressiveCatalogBase.length - index;
  const itemId = `120120${String(itemNumber).padStart(2, "0")}`;
  const category = catalogCategoryByWeapon[skin.weapon];
  return {
    ...skin,
    catalogImageUrl: `https://cdn.pubgitems.info/i-large/${itemId}.png`,
    catalogSourceUrl: `https://pubgitems.info/weapons/${category}/${itemId}-${skin.slug}`,
  };
});
