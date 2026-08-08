import { destonPoints } from "./mapPoints/deston";
import { erangelPoints } from "./mapPoints/erangel";
import { karakinPoints } from "./mapPoints/karakin";
import { miramarPoints } from "./mapPoints/miramar";
import { paramoPoints } from "./mapPoints/paramo";
import { rondoPoints } from "./mapPoints/rondo";
import { sanhokPoints } from "./mapPoints/sanhok";
import { taegoPoints } from "./mapPoints/taego";
import { vikendiPoints } from "./mapPoints/vikendi";

export type MapSlug = "erangel" | "miramar" | "taego" | "rondo" | "vikendi" | "deston" | "sanhok" | "karakin" | "paramo";
export type MapMode = "normal" | "ranked";
export type PointMode = MapMode | "both";
export type MapPointSource = "game-data" | "community";
export type MapCategoryId =
  | "garage"
  | "vehicle"
  | "boat"
  | "glider"
  | "secret-room"
  | "gas-station"
  | "bunker"
  | "bear-cave"
  | "lab-camp";

export type MapPoint = [MapCategoryId, number, number, PointMode, MapPointSource];
export type MapDefinition = {
  nameKo: string;
  nameEn: string;
  image: string;
  worldSize: number;
  ranked: boolean;
  points: MapPoint[];
};

export const mapDataVersion = {
  patch: "42.2",
  verifiedAt: "2026-08-08",
  mapServiceUrl: "https://pubg.com/en/news/10415?category=notice",
  coordinateDocsUrl: "https://documentation.pubg.com/en/telemetry-objects.html",
  mapAssetsUrl: "https://github.com/pubg/api-assets/tree/master/Assets/Maps",
  gameDataSourceUrl: "https://pubgmaps.gg/",
  facilitySourceUrl: "https://pubg-maps.com/",
} as const;

export const mapCategories: Array<{ id: MapCategoryId; label: string; icon: string; color: string }> = [
  { id: "garage", label: "차고지", icon: "G", color: "#f0b429" },
  { id: "vehicle", label: "차량 스폰", icon: "V", color: "#5bc0eb" },
  { id: "boat", label: "보트 스폰", icon: "B", color: "#4f86f7" },
  { id: "glider", label: "글라이더", icon: "A", color: "#e76f51" },
  { id: "secret-room", label: "비밀 공간", icon: "K", color: "#a78bfa" },
  { id: "gas-station", label: "주유소", icon: "F", color: "#65a30d" },
  { id: "bunker", label: "벙커", icon: "U", color: "#c08457" },
  { id: "bear-cave", label: "곰 동굴", icon: "C", color: "#d97706" },
  { id: "lab-camp", label: "연구 캠프", icon: "L", color: "#14b8a6" },
];

export const mapCatalog: Record<MapSlug, MapDefinition> = {
  erangel: { nameKo: "에란겔", nameEn: "Erangel", image: "Erangel_Main_Low_Res.png", worldSize: 816000, ranked: true, points: erangelPoints },
  miramar: { nameKo: "미라마", nameEn: "Miramar", image: "Miramar_Main_Low_Res.png", worldSize: 816000, ranked: true, points: miramarPoints },
  taego: { nameKo: "태이고", nameEn: "Taego", image: "Taego_Main_Low_Res.png", worldSize: 816000, ranked: true, points: taegoPoints },
  rondo: { nameKo: "론도", nameEn: "Rondo", image: "Rondo_Main_Low_Res.png", worldSize: 816000, ranked: true, points: rondoPoints },
  vikendi: { nameKo: "비켄디", nameEn: "Vikendi", image: "Vikendi_Main_Low_Res.png", worldSize: 816000, ranked: false, points: vikendiPoints },
  deston: { nameKo: "데스턴", nameEn: "Deston", image: "Deston_Main_Low_Res.png", worldSize: 816000, ranked: false, points: destonPoints },
  sanhok: { nameKo: "사녹", nameEn: "Sanhok", image: "Sanhok_Main_Low_Res.png", worldSize: 408000, ranked: false, points: sanhokPoints },
  karakin: { nameKo: "카라킨", nameEn: "Karakin", image: "Karakin_Main_Low_Res.png", worldSize: 204000, ranked: false, points: karakinPoints },
  paramo: { nameKo: "파라모", nameEn: "Paramo", image: "Paramo_Main_Low_Res.png", worldSize: 306000, ranked: false, points: paramoPoints },
};

export const mapSlugs = Object.keys(mapCatalog) as MapSlug[];
