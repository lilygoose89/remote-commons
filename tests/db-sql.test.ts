import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildVisaQuery, CONTRIBUTION_INSERT, READ_SQL } from "../src/lib/db";

describe("sql", () => {
  it("binds visa filters and does not interpolate them", () => {
    const query = buildVisaQuery({
      country: "XX",
      category: "remote_work",
      status: "active",
    });
    expect(query.sql).toContain("country_iso2 = ?");
    expect(query.sql).not.toContain("XX");
    expect(query.params).toEqual(["XX", "remote_work", "active"]);
  });

  it("never selects contact_email", () => {
    for (const sql of READ_SQL) {
      expect(sql.toLowerCase()).not.toContain("contact_email");
    }
    const returning = CONTRIBUTION_INSERT.split(/returning/i)[1] ?? "";
    expect(returning.toLowerCase()).not.toContain("contact_email");
    expect(CONTRIBUTION_INSERT.toLowerCase()).toContain("contact_email");
    expect(CONTRIBUTION_INSERT).toContain("'pending'");
  });

  it("ships no seed rows in the migration", () => {
    const sql = readFileSync("migrations/0001_init.sql", "utf8");
    expect(sql.toLowerCase()).not.toContain("insert");
    expect(sql).not.toContain("Testland");
    expect(sql.toLowerCase()).not.toContain("easy");
  });
});
