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

export function weaponName(key: string) {
  return weapons.find((weapon) => weapon.key === key)?.name ?? key.replace(/^Item_Weapon_|_C$/g, "");
}

export function attachmentName(key: string) {
  return attachments.find((attachment) => attachment.key === key)?.name
    ?? key.replace(/^Item_Attach_Weapon_|_C$/g, "").replaceAll("_", " ");
}
