// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://pyroskill.info";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const studentSlugs = [
  "creeaza-cont",
  "lectii-xp-nivele",
  "vieti-streak",
  "rezolva-problema",
  "alatura-te-clasei",
  "test-sau-provocare",
  "premium-elev",
];

const teacherSlugs = [
  "profesor-verificat",
  "creeaza-clasa",
  "construieste-test",
  "trimite-provocare",
  "notare-ai",
  "analitice-rapoarte",
  "profil-competente",
  "premium-profesor",
];

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.9" },
  { path: "/tutoriale/elevi", changefreq: "monthly", priority: "0.8" },
  { path: "/tutoriale/profesori", changefreq: "monthly", priority: "0.8" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-use", changefreq: "yearly", priority: "0.3" },
  { path: "/support", changefreq: "yearly", priority: "0.4" },
  ...studentSlugs.map((s) => ({
    path: `/tutoriale/elevi/${s}`,
    changefreq: "monthly" as const,
    priority: "0.6",
  })),
  ...teacherSlugs.map((s) => ({
    path: `/tutoriale/profesori/${s}`,
    changefreq: "monthly" as const,
    priority: "0.6",
  })),
];

function generateSitemap(items: SitemapEntry[]) {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);
