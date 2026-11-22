import type { Country, Visa } from "../src/lib/schemas";

/** Test-only fixture. Do not import this from migrations or runtime seed paths. */
export const testlandCountry: Country = {
  iso2: "XX",
  name: "Testland",
  region: null,
  currency: null,
  tax_residency: {
    days: 1,
    source_id: "xx-test-source",
    last_checked: "2020-01-01",
    dataset_version: "2023",
    verified: false,
  },
  notes: null,
  metrics: [
    {
      metric: "test_metric",
      value: 1,
      unit: null,
      source_id: "xx-test-source",
      last_checked: "2020-01-01",
      dataset_version: "2023",
      verified: false,
    },
  ],
};

export const testlandVisa: Visa = {
  id: "xx-test-remote",
  country_iso2: "XX",
  name: "Testland remote",
  category: "remote_work",
  status: "active",
  duration_months: 12,
  renewable: true,
  min_income: { amount: 1, currency: "XXX", period: "month" },
  savings: null,
  fee: null,
  dependants_allowed: false,
  local_work_allowed: false,
  tax_treatment: null,
  official_url: "https://example.invalid/xx",
  source_id: "xx-test-source",
  last_checked: "2020-01-01",
  dataset_version: "2023",
  verified: false,
};
