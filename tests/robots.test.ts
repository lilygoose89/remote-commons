import { describe, expect, it } from "vitest";
import { shouldNoindex } from "../src/lib/flags";
import { metaRobots, robotsTxt, staticAssetHeaders } from "../src/lib/robots";

describe("preview indexing", () => {
  it("noindexes unless both flags are exactly true", () => {
    expect(shouldNoindex(undefined, undefined)).toBe(true);
    expect(shouldNoindex("false", "false")).toBe(true);
    expect(shouldNoindex("true", "false")).toBe(true);
    expect(shouldNoindex("true", undefined)).toBe(true);
    expect(shouldNoindex("true", "true")).toBe(false);
  });

  it("writes the noindex header and robots file by default", () => {
    expect(metaRobots(undefined, "false")).toBe("noindex, nofollow");
    expect(robotsTxt(false)).toContain("Disallow: /");
    expect(staticAssetHeaders(undefined)).toContain(
      "X-Robots-Tag: noindex, nofollow",
    );
    expect(staticAssetHeaders("true")).toBeNull();
    expect(robotsTxt(true)).toContain(
      "Sitemap: https://remotecommons.org/sitemap.xml",
    );
  });
});
