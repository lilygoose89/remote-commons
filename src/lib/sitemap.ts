import { SITE_ORIGIN } from "./site";

export const SITEMAP_PATHS = [
  "/",
  "/index",
  "/whitepaper",
  "/methodology",
  "/about",
  "/contribute",
  "/llms.txt",
] as const;

export function sitemapXml(): string {
  const urls = SITEMAP_PATHS.map(
    (path) => `  <url><loc>${SITE_ORIGIN}${path}</loc></url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
