import { isIndexableFlag, shouldNoindex } from "./flags";
import { SITE_ORIGIN } from "./site";

export const ROBOTS_TAG = "noindex, nofollow";

export function metaRobots(
  buildFlag: string | undefined | null,
  runtimeFlag: string | undefined | null,
): string {
  return shouldNoindex(buildFlag, runtimeFlag)
    ? "noindex, nofollow"
    : "index, follow";
}

export function robotsTxt(indexable: boolean): string {
  if (!indexable) {
    return "User-agent: *\nDisallow: /\n";
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}

/** Cloudflare static-asset headers. Null when the build is explicitly indexable. */
export function staticAssetHeaders(
  buildFlag: string | undefined | null,
): string | null {
  if (isIndexableFlag(buildFlag)) return null;
  return `/*\n  X-Robots-Tag: ${ROBOTS_TAG}\n`;
}
