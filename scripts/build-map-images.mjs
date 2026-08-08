import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const maps = [
  ["erangel", "Erangel_Main_High_Res.png"],
  ["miramar", "Miramar_Main_High_Res.png"],
  ["taego", "Taego_Main_High_Res.png"],
  ["rondo", "Rondo_Main_High_Res.png"],
  ["vikendi", "Vikendi_Main_High_Res.png"],
  ["deston", "Deston_Main_High_Res.png"],
  ["sanhok", "Sanhok_Main_High_Res.png"],
  ["karakin", "Karakin_Main_High_Res.png"],
  ["paramo", "Paramo_Main_High_Res.png"],
];

const outputDirectory = join(process.cwd(), "public", "maps");
await mkdir(outputDirectory, { recursive: true });

for (const [slug, filename] of maps) {
  const url = `https://media.githubusercontent.com/media/pubg/api-assets/master/Assets/Maps/${filename}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${filename}: HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  const output = join(outputDirectory, `${slug}.webp`);
  const result = await sharp(source)
    .resize(4096, 4096, { fit: "fill" })
    .webp({ quality: 84, effort: 5, smartSubsample: true })
    .toFile(output);
  console.log(`${slug}: ${result.width}x${result.height}, ${Math.round(result.size / 1024)}KB`);
}
