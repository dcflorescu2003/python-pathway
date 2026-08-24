// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Minimal, spec-strict output: only <loc>. Google ignores <changefreq>/<priority>,
// and we have no authoritative per-page modification date, so <lastmod> is omitted.

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://pyroskill.info";

// Slugs are read from the tutorial data files so the sitemap stays in sync
// automatically when articles are added, renamed, or removed.
function readSlugs(file) {
  const source = readFileSync(resolve(file), "utf8");
  return [...source.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
}

const studentSlugs = readSlugs("src/data/tutorials/students.ts");
const teacherSlugs = readSlugs("src/data/tutorials/teachers.ts");

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
