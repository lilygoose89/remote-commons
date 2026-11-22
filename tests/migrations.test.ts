import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const persist = mkdtempSync(path.join(tmpdir(), "remote-commons-d1-"));
const env = { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" };

function wrangler(args: string[]) {
  return spawnSync("npx", ["wrangler", ...args], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
  });
}

function apply() {
  return wrangler([
    "d1",
    "migrations",
    "apply",
    "remote-commons",
    "--local",
    "--persist-to",
    persist,
  ]);
}

function execute(sql: string) {
  const file = path.join(persist, "statement.sql");
  writeFileSync(file, sql);
  return wrangler([
    "d1",
    "execute",
    "remote-commons",
    "--local",
    "--json",
    "--persist-to",
    persist,
    "--file",
    file,
  ]);
}

beforeAll(() => {
  const first = apply();
  expect(first.status, first.stderr || first.stdout).toBe(0);
  const second = apply();
  expect(second.status, second.stderr || second.stdout).toBe(0);
});

afterAll(() => {
  rmSync(persist, { recursive: true, force: true });
});

describe("local D1 migrations", () => {
  it("creates the dataset tables and no rows", () => {
    const result = execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '_cf_METADATA' AND name != 'd1_migrations' ORDER BY name;",
    );
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const names = JSON.stringify(result.stdout);
    for (const table of [
      "sources",
      "countries",
      "country_metrics",
      "visas",
      "methods",
      "scores",
      "changelog",
      "contributions",
    ]) {
      expect(names).toContain(table);
    }
    const count = execute("SELECT COUNT(*) AS n FROM countries;");
    expect(count.status, count.stderr || count.stdout).toBe(0);
    expect(count.stdout).toMatch(/"n":\s*0/);
  });

  it("rejects a published figure without a source and a verified 2023 row", () => {
    const ok = execute(`
      INSERT INTO sources (id, url, title, kind, accessed_on)
      VALUES ('xx-test-source', 'https://example.invalid/xx', 'XX Testland fixture', 'other', '2020-01-01');
      INSERT INTO countries (iso2, name) VALUES ('XX', 'Testland');
    `);
    expect(ok.status, ok.stderr || ok.stdout).toBe(0);

    const missingSource = execute(`
      INSERT INTO visas (id, country_iso2, name, category, status, source_id, last_checked)
      VALUES ('xx-missing', 'XX', 'Missing source', 'other', 'unknown', 'xx-no-such-source', '2020-01-01');
    `);
    expect(missingSource.status).not.toBe(0);

    const historicalVerified = execute(`
      INSERT INTO visas (
        id, country_iso2, name, category, status, source_id, last_checked, dataset_version, verified
      ) VALUES (
        'xx-old', 'XX', 'Historical', 'other', 'unknown', 'xx-test-source', '2020-01-01', '2023', 1
      );
    `);
    expect(historicalVerified.status).not.toBe(0);

    const taxWithoutSource = execute(`
      UPDATE countries SET tax_residency_days = 1 WHERE iso2 = 'XX';
    `);
    expect(taxWithoutSource.status).not.toBe(0);
  });
});
