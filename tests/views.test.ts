import { describe, expect, it } from "vitest";
import { nomadRows, policymakerRows } from "../src/lib/views";
import { testlandCountry, testlandVisa } from "./fixtures";

describe("views", () => {
  it("builds both views from the same fixture records", () => {
    const countries = [testlandCountry];
    const visas = [testlandVisa];
    const programmes = policymakerRows(countries, visas);
    const compared = nomadRows(countries, visas);
    expect(programmes).toHaveLength(1);
    expect(programmes[0]?.country_name).toBe("Testland");
    expect(programmes[0]?.dataset_version).toBe("2023");
    expect(programmes[0]?.verified).toBe(false);
    expect(compared).toHaveLength(1);
    expect(compared[0]).toMatchObject({
      iso2: "XX",
      name: "Testland",
      programme_count: 1,
      active_remote_work_count: 1,
      verified_programme_count: 0,
      dataset_versions: ["2023"],
    });
  });
});
