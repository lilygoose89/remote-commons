import { describe, expect, it } from "vitest";
import { openApiSpec } from "../src/lib/openapi";
import {
  contributionResultSchema,
  countrySchema,
  metricSchema,
  sourceSchema,
  taxResidencySchema,
  visaSchema,
} from "../src/lib/schemas";

describe("openapi", () => {
  const spec = openApiSpec();

  it("is OpenAPI 3.1 and lists the public routes", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(Object.keys(spec.paths).sort()).toEqual(
      [
        "/api/v1/contributions",
        "/api/v1/countries",
        "/api/v1/countries.csv",
        "/api/v1/countries/{iso2}",
        "/api/v1/sources",
        "/api/v1/sources.csv",
        "/api/v1/visas",
        "/api/v1/visas.csv",
      ].sort(),
    );
  });

  it("keeps response schemas aligned with Zod and omits contact_email", () => {
    const schemas = spec.components.schemas as Record<
      string,
      { properties?: Record<string, unknown> }
    >;
    expect(Object.keys(schemas.Country?.properties ?? {}).sort()).toEqual(
      Object.keys(countrySchema.shape).sort(),
    );
    expect(Object.keys(schemas.Visa?.properties ?? {}).sort()).toEqual(
      Object.keys(visaSchema.shape).sort(),
    );
    expect(Object.keys(schemas.Source?.properties ?? {}).sort()).toEqual(
      Object.keys(sourceSchema.shape).sort(),
    );
    expect(Object.keys(schemas.Metric?.properties ?? {}).sort()).toEqual(
      Object.keys(metricSchema.shape).sort(),
    );
    expect(Object.keys(schemas.TaxResidency?.properties ?? {}).sort()).toEqual(
      Object.keys(taxResidencySchema.shape).sort(),
    );
    expect(
      Object.keys(schemas.ContributionResult?.properties ?? {}).sort(),
    ).toEqual(Object.keys(contributionResultSchema.shape).sort());
    const responses = JSON.stringify(
      spec.paths["/api/v1/contributions"].post.responses,
    );
    expect(responses.includes("contact_email")).toBe(false);
  });
});
