import attachmentData from "../data/attachments.json";
import weaponData from "../data/weapons.json";

export type WeaponCatalogItem = {
  key: string;
  slug: string;
  name: string;
  category: string;
  ammo: string;
  damage: number;
  damageDisplay: string;
  rpm: number | null;
  velocity: number | null;
  magazine: number;
  extendedMagazine: number | null;
  image: string;
  imageUrl?: string;
  falloffStart?: number;
  falloffEnd?: number;
  minimumMultiplier?: number;
  change?: string;
  changeType?: "up" | "down" | "spawn";
};

export type AttachmentCatalogItem = {
  key: string;
  name: string;
  category: string;
  compatible: string;
  effect: string;
  recommendedFor: string[];
  change: string;
};

export const weapons = weaponData as WeaponCatalogItem[];
export const attachments = attachmentData as AttachmentCatalogItem[];
export const weaponImageBase = "https://wstatic-prod.pubg.com/web/live/static/game-info/weapons/images/viewer";

export function weaponImageUrl(weapon: WeaponCatalogItem) {
  return weapon.imageUrl ?? `${weaponImageBase}/img-weapons-${weapon.image}.webp`;
}

export function weaponName(key: string) {
  const direct = weapons.find((weapon) => weapon.key === key);
  if (direct) return direct.name;

  const normalized = key.replace(/^Item_Weapon_/, "").replace(/^Weap/, "").replace(/_C$/, "");
  const internalMatch = weapons.find(
    (weapon) => weapon.key.replace(/^Item_Weapon_/, "").replace(/_C$/, "") === normalized,
  );
  if (internalMatch) return internalMatch.name;

  const aliases: Record<string, string> = {
    AK47: "AKM",
    AUG: "AUG",
    BerylM762: "Beryl M762",
    HK416: "M416",
    SLR: "SLR",
    Win94: "Win94",
    Mads_QBU88: "QBU",
  };
  return aliases[normalized] ?? normalized;
}

export function attachmentName(key: string) {
  const catalogName = attachments.find((attachment) => attachment.key === key)?.name;
  if (catalogName) return catalogName;

  const normalized = key.replace(/^Item_Attach_Weapon_/, "").replace(/_C$/, "");
  const officialNames: [string, string][] = [
    ["DualOptic_4x1x", "하이브리드 스코프"],
    ["SideRail_DotSight_RMR", "캔티드 사이트"],
    ["Thermal", "열화상 스코프"],
    ["DotSight", "레드 도트 사이트"],
    ["Holosight", "홀로그램 조준기"],
    ["Scope15x", "15배율 스코프"],
    ["PM2_01", "15배율 스코프"],
    ["Scope8x", "8배율 스코프"],
    ["CQBSS", "8배율 스코프"],
    ["Scope6x", "6배율 스코프"],
    ["Scope4x", "4배율 스코프"],
    ["ACOG", "4배율 스코프"],
    ["Scope3x", "3배율 스코프"],
    ["Scope2x", "2배율 스코프"],
    ["Aimpoint", "2배율 스코프"],
    ["QuickDraw_Large_Crossbow", "화살통"],
    ["ExtendedQuickDraw", "대용량 퀵 드로우 탄창"],
    ["ExtendedQuickDrawMag", "대용량 퀵 드로우 탄창"],
    ["QuickDraw", "퀵 드로우 탄창"],
    ["Extended", "대용량 탄창"],
    ["MuzzleBrake", "제동기"],
    ["Compensator", "보정기"],
    ["FlashHider", "소염기"],
    ["Suppressor", "소음기"],
    ["Duckbill", "덕빌"],
    ["Choke", "초크"],
    ["TiltedGrip", "틸티드 그립"],
    ["AngledForeGrip", "앵글 손잡이"],
    ["VerticalForeGrip", "수직 손잡이"],
    ["Lower_Foregrip", "수직 손잡이"],
    ["HalfGrip", "하프 그립"],
    ["LightweightForeGrip", "라이트 그립"],
    ["ThumbGrip", "엄지 그립"],
    ["LaserPointer", "레이저 사이트"],
    ["HeavyStock", "중량형 개머리판"],
    ["AR_Composite", "전술 개머리판"],
    ["CheekPad", "칙패드"],
    ["BulletLoops", "탄띠"],
    ["Stock_UZI", "개머리판"],
    ["FoldingStock", "폴딩 스톡"],
  ];
  return officialNames.find(([fragment]) => normalized.includes(fragment))?.[1]
    ?? "확인되지 않은 파츠";
}
