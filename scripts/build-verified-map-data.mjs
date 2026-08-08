const maps = [
  ["erangel", "에란겔", "Erangel", "baltic", "Erangel_Main_Low_Res.png", 816000, true],
  ["miramar", "미라마", "Miramar", "desert", "Miramar_Main_Low_Res.png", 816000, true],
  ["taego", "태이고", "Taego", "tiger", "Taego_Main_Low_Res.png", 816000, true],
  ["rondo", "론도", "Rondo", "neon", "Rondo_Main_Low_Res.png", 816000, true],
  ["vikendi", "비켄디", "Vikendi", "dihorotok", "Vikendi_Main_Low_Res.png", 816000, false],
  ["deston", "데스턴", "Deston", "kiki", "Deston_Main_Low_Res.png", 816000, false],
  ["sanhok", "사녹", "Sanhok", "savage", "Sanhok_Main_Low_Res.png", 408000, false],
  ["karakin", "카라킨", "Karakin", "summerland", "Karakin_Main_Low_Res.png", 204000, false],
  ["paramo", "파라모", "Paramo", "chimera", "Paramo_Main_Low_Res.png", 306000, false],
];

const xorKey = Uint8Array.from([156, 65, 227, 90, 119, 13, 178, 104, 47, 196, 139, 22, 217, 99, 174, 53]);
const decode = (input) => input.map((value, index) => value ^ xorKey[index % xorKey.length]);

async function readPak(code) {
  const response = await fetch(`https://assets.pubgmaps.gg/maps/${code}/data.pak`, {
    headers: { Referer: "https://pubgmaps.gg/", "User-Agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`${code}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const indexLength = view.getUint32(8, true);
  const index = JSON.parse(Buffer.from(decode(bytes.slice(12, 12 + indexLength))).toString());
  const values = {};
  for (const entry of index) {
    const start = 12 + indexLength + entry.o;
    values[entry.n] = JSON.parse(Buffer.from(decode(bytes.slice(start, start + entry.l))).toString());
  }
  return values;
}

function extractCommunityMapData(source) {
  const declaration = source.indexOf("const mapData =");
  const objectStart = source.indexOf("{", declaration);
  let depth = 0;
  let quote = "";
  let escaped = false;
  let objectEnd = -1;
  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) {
      objectEnd = index + 1;
      break;
    }
  }
  return Function(`return (${source.slice(objectStart, objectEnd)})`)();
}

const communitySource = await (await fetch("https://pubg-maps.com/js/main.js")).text();
const communityMaps = extractCommunityMapData(communitySource);
const output = {};
const requestedSlug = process.argv[2];
const selectedMaps = requestedSlug ? maps.filter(([slug]) => slug === requestedSlug) : maps;

if (requestedSlug && selectedMaps.length === 0) throw new Error(`Unknown map: ${requestedSlug}`);

const waterCategory = (category) => /water|boat|ocean|river/i.test(category);
const garageCategory = (category) => /garage/i.test(category);

for (const [slug, nameKo, nameEn, code, image, worldSize, ranked] of selectedMaps) {
  const { "vehicle_spawns.json": vehicleData } = await readPak(code);
  const pointMap = new Map();
  const add = (category, x, y, mode, source) => {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const key = `${category}:${roundedX}:${roundedY}:${source}`;
    const current = pointMap.get(key);
    const nextMode = current && current[3] !== mode ? "both" : mode;
    pointMap.set(key, [category, roundedX, roundedY, nextMode, source]);
  };

  for (const spawn of vehicleData.spawns ?? []) {
    const categories = spawn.categories ?? [];
    const normalCategories = categories.filter((category) => category !== "Start" && !/^Esports/i.test(category));
    if (normalCategories.length) {
      const category = normalCategories.some((value) => value === "Motorglider")
        ? "glider"
        : normalCategories.some(garageCategory)
          ? "garage"
          : normalCategories.some(waterCategory)
            ? "boat"
            : "vehicle";
      add(category, spawn.position.x, spawn.position.y, "normal", "game-data");
    }

    if (ranked) {
      const rankedCategories = categories.filter((category) =>
        (vehicleData.crGuaranteedCategories ?? []).includes(category),
      );
      if (rankedCategories.length) {
        add(
          rankedCategories.some(waterCategory) ? "boat" : "vehicle",
          spawn.position.x,
          spawn.position.y,
          "ranked",
          "game-data",
        );
      }
    }
  }

  const facilityCategory = {
    gasStations: "gas-station",
    secretBasements: "secret-room",
    secretRooms: "secret-room",
    securityRooms: "secret-room",
    bunkers: "bunker",
    bears: "bear-cave",
    labcamps: "lab-camp",
  };
  for (const marker of communityMaps[slug]?.markers ?? []) {
    const category = facilityCategory[marker.type];
    if (!category) continue;
    const mode = slug === "miramar" && category === "secret-room" ? "both" : "normal";
    add(category, (marker.x / 8192) * worldSize, (Math.abs(marker.y) / 8192) * worldSize, mode, "community");
  }

  output[slug] = {
    nameKo,
    nameEn,
    image,
    worldSize,
    ranked,
    points: [...pointMap.values()],
  };
}

if (requestedSlug) {
  const exportName = `${requestedSlug.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Points`;
  const contents = `import type { MapPoint } from "../mapData";\n\nexport const ${exportName}: MapPoint[] = ${JSON.stringify(output[requestedSlug].points)};\n`;
  const escapedContents = contents.trimEnd().replace(/^/gm, "+");
  console.log(`*** Begin Patch\n*** Add File: lib/mapPoints/${requestedSlug}.ts\n${escapedContents}\n*** End Patch`);
} else {
const serialized = JSON.stringify(output);
const file = `// Generated from game-coordinate data and cross-checked community facility data.\n// Sources and freshness metadata are intentionally kept with the dataset.\n\nexport type MapSlug = ${maps.map(([slug]) => `"${slug}"`).join(" | ")};\nexport type MapMode = "normal" | "ranked";\nexport type PointMode = MapMode | "both";\nexport type MapPointSource = "game-data" | "community";\nexport type MapCategoryId =\n+  | "garage"\n+  | "vehicle"\n+  | "boat"\n+  | "glider"\n+  | "secret-room"\n+  | "gas-station"\n+  | "bunker"\n+  | "bear-cave"\n+  | "lab-camp";\n+\n+export type MapPoint = [MapCategoryId, number, number, PointMode, MapPointSource];\n+export type MapDefinition = {\n+  nameKo: string;\n+  nameEn: string;\n+  image: string;\n+  worldSize: number;\n+  ranked: boolean;\n+  points: MapPoint[];\n+};\n+\n+export const mapDataVersion = {\n+  patch: "42.2",\n+  verifiedAt: "2026-08-08",\n+  mapServiceUrl: "https://pubg.com/en/news/10415?category=notice",\n+  coordinateDocsUrl: "https://documentation.pubg.com/en/telemetry-objects.html",\n+  mapAssetsUrl: "https://github.com/pubg/api-assets/tree/master/Assets/Maps",\n+  gameDataSourceUrl: "https://pubgmaps.gg/",\n+  facilitySourceUrl: "https://pubg-maps.com/",\n+} as const;\n+\n+export const mapCategories: Array<{ id: MapCategoryId; label: string; icon: string; color: string }> = [\n+  { id: "garage", label: "차고지", icon: "G", color: "#f0b429" },\n+  { id: "vehicle", label: "차량 스폰", icon: "V", color: "#5bc0eb" },\n+  { id: "boat", label: "보트 스폰", icon: "B", color: "#4f86f7" },\n+  { id: "glider", label: "글라이더", icon: "A", color: "#e76f51" },\n+  { id: "secret-room", label: "비밀 공간", icon: "K", color: "#a78bfa" },\n+  { id: "gas-station", label: "주유소", icon: "F", color: "#65a30d" },\n+  { id: "bunker", label: "벙커", icon: "U", color: "#c08457" },\n+  { id: "bear-cave", label: "곰 동굴", icon: "C", color: "#d97706" },\n+  { id: "lab-camp", label: "연구 캠프", icon: "L", color: "#14b8a6" },\n+];\n+\n+export const mapCatalog = ${serialized} as const satisfies Record<MapSlug, MapDefinition>;\n+\n+export const mapSlugs = Object.keys(mapCatalog) as MapSlug[];\n+`;

const normalizedFile = file.replace(/\n\+/g, "\n").replace(" as const satisfies Record<MapSlug, MapDefinition>", " satisfies Record<MapSlug, MapDefinition>");
const escaped = normalizedFile.trimEnd().replace(/^/gm, "+");
console.log(`*** Begin Patch\n*** Delete File: lib/mapData.ts\n*** Add File: lib/mapData.ts\n${escaped}\n*** End Patch`);
}
