import { describe, expect, it } from "vitest";
import { toCsv } from "../src/lib/csv";

describe("csv", () => {
  it("emits a header when there are no rows", () => {
    expect(toCsv(["iso2", "name"], [])).toBe("iso2,name\n");
  });

  it("quotes commas and quotes", () => {
    expect(toCsv(["name"], [{ name: 'XX "Testland", east' }])).toBe(
      'name\n"XX ""Testland"", east"\n',
    );
  });
});
