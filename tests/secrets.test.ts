import { describe, expect, it } from "vitest";
import { scanRepository, scanText } from "../scripts/scan-secrets.mjs";

describe("secret scan", () => {
  it("flags a private key and a github token", () => {
    const header = `-----BEGIN ${""}PRIVATE KEY-----`;
    const token = ["ghp_", "a".repeat(36)].join("");
    const findings = scanText(
      "sample.txt",
      `${header}\nnot-a-real-key\n${token}\n`,
    );
    expect(findings.map((finding) => finding.name)).toContain("private-key");
    expect(findings.map((finding) => finding.name)).toContain("github-pat");
  });

  it("passes on the tracked tree", () => {
    expect(scanRepository()).toEqual([]);
  });
});
