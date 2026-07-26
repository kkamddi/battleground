import type { MetadataRoute } from "next";

const siteUrl = "https://battleground-info.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/patch-notes", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/weapons", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/meta", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/guides", changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date("2026-07-26"),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
