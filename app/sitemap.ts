import type { MetadataRoute } from "next";
import { weapons } from "../lib/catalog";
import { mapSlugs } from "../lib/mapData";

const siteUrl = "https://battleground-info.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/players", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/patch-notes", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/weapons", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/lab", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/lab/ttk", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/lab/loadouts", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/weapons/progressive", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/meta", changeFrequency: "daily" as const, priority: 0.9 },
    { path: "/guides", changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...mapSlugs.map((slug) => ({
      url: `${siteUrl}/maps/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...weapons.map((weapon) => ({
      url: `${siteUrl}/weapons/${weapon.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
