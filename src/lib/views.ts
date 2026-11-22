import type { Country, Visa } from "./schemas";

export interface PolicymakerRow {
  country_iso2: string;
  country_name: string;
  visa_id: string;
  name: string;
  category: Visa["category"];
  status: Visa["status"];
  duration_months: number | null;
  renewable: boolean | null;
  dependants_allowed: boolean | null;
  local_work_allowed: boolean | null;
  tax_treatment: string | null;
  dataset_version: string;
  verified: boolean;
  source_id: string;
  last_checked: string;
}

export interface NomadRow {
  iso2: string;
  name: string;
  region: string | null;
  currency: string | null;
  tax_residency_days: number | null;
  programme_count: number;
  active_remote_work_count: number;
  dataset_versions: string[];
  verified_programme_count: number;
}

/** Programme-design comparison. One row per published visa. */
export function policymakerRows(
  countries: Country[],
  visas: Visa[],
): PolicymakerRow[] {
  const names = new Map(
    countries.map((country) => [country.iso2, country.name]),
  );
  return visas.map((visa) => ({
    country_iso2: visa.country_iso2,
    country_name: names.get(visa.country_iso2) ?? visa.country_iso2,
    visa_id: visa.id,
    name: visa.name,
    category: visa.category,
    status: visa.status,
    duration_months: visa.duration_months,
    renewable: visa.renewable,
    dependants_allowed: visa.dependants_allowed,
    local_work_allowed: visa.local_work_allowed,
    tax_treatment: visa.tax_treatment,
    dataset_version: visa.dataset_version,
    verified: visa.verified,
    source_id: visa.source_id,
    last_checked: visa.last_checked,
  }));
}

/** Country comparison from the same country and visa records. No score is computed. */
export function nomadRows(countries: Country[], visas: Visa[]): NomadRow[] {
  return countries.map((country) => {
    const programmes = visas.filter(
      (visa) => visa.country_iso2 === country.iso2,
    );
    const versions = [
      ...new Set(programmes.map((visa) => visa.dataset_version)),
    ].sort();
    return {
      iso2: country.iso2,
      name: country.name,
      region: country.region,
      currency: country.currency,
      tax_residency_days: country.tax_residency?.days ?? null,
      programme_count: programmes.length,
      active_remote_work_count: programmes.filter(
        (visa) => visa.category === "remote_work" && visa.status === "active",
      ).length,
      dataset_versions: versions,
      verified_programme_count: programmes.filter((visa) => visa.verified)
        .length,
    };
  });
}
