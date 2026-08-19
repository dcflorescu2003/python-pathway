// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Minimal, spec-strict output: only <loc>. Google ignores <changefreq>/<priority>,
// and we have no authoritative per-page modification date, so <lastmod> is omitted.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://pyroskill.info";

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

const paths = [
  "/",
  "/about",
  "/tutoriale/elevi",
  "/tutoriale/profesori",
  "/privacy-policy",
  "/terms-of-use",
  "/support",
  ...studentSlugs.map((slug) => `/tutoriale/elevi/${slug}`),
  ...teacherSlugs.map((slug) => `/tutoriale/profesori/${slug}`),
];

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function generateSitemap(items) {
  const urls = items.map((path) => {
    const loc = escapeXml(new URL(path, BASE_URL).toString());
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

writeFileSync(resolve("public/sitemap.xml"), generateSitemap(paths), { encoding: "utf8" });
console.log(`sitemap.xml written (${paths.length} entries)`);
