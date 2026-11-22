import { describe, expect, it } from "vitest";
import {
  contributionInputSchema,
  contributionResultSchema,
  countrySchema,
  visaQuerySchema,
  visaSchema,
} from "../src/lib/schemas";
import { testlandCountry, testlandVisa } from "./fixtures";

describe("schemas", () => {
  it("accepts the XX Testland fixture", () => {
    expect(countrySchema.parse(testlandCountry).iso2).toBe("XX");
    expect(visaSchema.parse(testlandVisa).verified).toBe(false);
  });

  it("rejects a visa category outside the model", () => {
    expect(
      visaSchema.safeParse({ ...testlandVisa, category: "nomad" }).success,
    ).toBe(false);
  });

  it("rejects a client-supplied contribution status", () => {
    const parsed = contributionInputSchema.safeParse({
      kind: "other",
      body: "XX Testland note",
      status: "accepted",
    });
    expect(parsed.success).toBe(false);
  });

  it("does not allow contact_email on the contribution result", () => {
    const parsed = contributionResultSchema.safeParse({
      id: 1,
      status: "pending",
      contact_email: "person@example.invalid",
    });
    expect(parsed.success).toBe(false);
  });

  it("uppercases a visa country filter", () => {
    expect(visaQuerySchema.parse({ country: "xx" }).country).toBe("XX");
  });
});
