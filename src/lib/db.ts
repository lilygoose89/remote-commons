import {
  type ContributionInput,
  type ContributionResult,
  type Country,
  type CountryDetail,
  contributionResultSchema,
  countryDetailSchema,
  countrySchema,
  type Source,
  sourceSchema,
  type Visa,
  type VisaQuery,
  visaSchema,
} from "./schemas";

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
}

export interface SqlDatabase {
  prepare(query: string): SqlStatement;
}

interface CountryRow {
  iso2: string;
  name: string;
  region: string | null;
  currency: string | null;
  tax_residency_days: number | null;
  tax_residency_source_id: string | null;
  tax_residency_last_checked: string | null;
  tax_residency_dataset_version: string | null;
  tax_residency_verified: number;
  notes: string | null;
}

interface MetricRow {
  country_iso2: string;
  metric: string;
  value: number;
  unit: string | null;
  source_id: string;
  last_checked: string;
  dataset_version: string;
  verified: number;
}

interface VisaRow {
  id: string;
  country_iso2: string;
  name: string;
  category: Visa["category"];
  status: Visa["status"];
  duration_months: number | null;
  renewable: number | null;
  min_income_amount: number | null;
  min_income_currency: string | null;
  min_income_period: "month" | "year" | null;
  savings_amount: number | null;
  savings_currency: string | null;
  fee_amount: number | null;
  fee_currency: string | null;
  dependants_allowed: number | null;
  local_work_allowed: number | null;
  tax_treatment: string | null;
  official_url: string | null;
  source_id: string;
  last_checked: string;
  dataset_version: string;
  verified: number;
}

interface SourceRow {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  kind: Source["kind"];
  accessed_on: string;
  archive_url: string | null;
  licence: string | null;
}

const COUNTRY_FIELDS = `iso2, name, region, currency,
  tax_residency_days, tax_residency_source_id, tax_residency_last_checked,
  tax_residency_dataset_version, tax_residency_verified, notes`;

export const COUNTRY_SELECT = `SELECT ${COUNTRY_FIELDS} FROM countries ORDER BY name`;
export const COUNTRY_BY_ISO = `SELECT ${COUNTRY_FIELDS} FROM countries WHERE iso2 = ?`;
export const METRIC_SELECT = `SELECT country_iso2, metric, value, unit, source_id, last_checked, dataset_version, verified
  FROM country_metrics ORDER BY country_iso2, metric, last_checked`;
export const METRIC_BY_ISO = `SELECT country_iso2, metric, value, unit, source_id, last_checked, dataset_version, verified
  FROM country_metrics WHERE country_iso2 = ? ORDER BY metric, last_checked`;

export const VISA_COLUMNS = `id, country_iso2, name, category, status, duration_months, renewable,
  min_income_amount, min_income_currency, min_income_period,
  savings_amount, savings_currency, fee_amount, fee_currency,
  dependants_allowed, local_work_allowed, tax_treatment, official_url,
  source_id, last_checked, dataset_version, verified`;

export const SOURCE_SELECT = `SELECT id, url, title, publisher, kind, accessed_on, archive_url, licence
  FROM sources ORDER BY id`;

/** Read queries. None of them may name contact_email. */
export const READ_SQL = [
  COUNTRY_SELECT,
  COUNTRY_BY_ISO,
  METRIC_SELECT,
  METRIC_BY_ISO,
  SOURCE_SELECT,
];

export const CONTRIBUTION_INSERT = `INSERT INTO contributions
  (kind, target_entity, target_id, body, source_url, contact_email, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
  RETURNING id, status`;

export function buildVisaQuery(filter: VisaQuery): {
  sql: string;
  params: string[];
} {
  const clauses: string[] = [];
  const params: string[] = [];
  if (filter.country) {
    clauses.push("country_iso2 = ?");
    params.push(filter.country);
  }
  if (filter.category) {
    clauses.push("category = ?");
    params.push(filter.category);
  }
  if (filter.status) {
    clauses.push("status = ?");
    params.push(filter.status);
  }
  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  return {
    sql: `SELECT ${VISA_COLUMNS} FROM visas${where} ORDER BY country_iso2, name`,
    params,
  };
}

function requiredBit(value: number): boolean {
  if (value === 0) return false;
  if (value === 1) return true;
  throw new Error("invalid bit");
}

function optionalBit(value: number | null): boolean | null {
  if (value === null) return null;
  return requiredBit(value);
}

function toMetric(row: MetricRow) {
  return {
    metric: row.metric,
    value: row.value,
    unit: row.unit,
    source_id: row.source_id,
    last_checked: row.last_checked,
    dataset_version: row.dataset_version,
    verified: requiredBit(row.verified),
  };
}

function toCountry(row: CountryRow, metrics: MetricRow[]): Country {
  const tax =
    row.tax_residency_days === null
      ? null
      : {
          days: row.tax_residency_days,
          source_id: row.tax_residency_source_id,
          last_checked: row.tax_residency_last_checked,
          dataset_version: row.tax_residency_dataset_version,
          verified: requiredBit(row.tax_residency_verified),
        };
  return countrySchema.parse({
    iso2: row.iso2,
    name: row.name,
    region: row.region,
    currency: row.currency,
    tax_residency: tax,
    notes: row.notes,
    metrics: metrics.map(toMetric),
  });
}

function toVisa(row: VisaRow): Visa {
  return visaSchema.parse({
    id: row.id,
    country_iso2: row.country_iso2,
    name: row.name,
    category: row.category,
    status: row.status,
    duration_months: row.duration_months,
    renewable: optionalBit(row.renewable),
    min_income:
      row.min_income_amount === null
        ? null
        : {
            amount: row.min_income_amount,
            currency: row.min_income_currency,
            period: row.min_income_period,
          },
    savings:
      row.savings_amount === null
        ? null
        : { amount: row.savings_amount, currency: row.savings_currency },
    fee:
      row.fee_amount === null
        ? null
        : { amount: row.fee_amount, currency: row.fee_currency },
    dependants_allowed: optionalBit(row.dependants_allowed),
    local_work_allowed: optionalBit(row.local_work_allowed),
    tax_treatment: row.tax_treatment,
    official_url: row.official_url,
    source_id: row.source_id,
    last_checked: row.last_checked,
    dataset_version: row.dataset_version,
    verified: requiredBit(row.verified),
  });
}

function groupMetrics(rows: MetricRow[]): Map<string, MetricRow[]> {
  const grouped = new Map<string, MetricRow[]>();
  for (const row of rows) {
    const list = grouped.get(row.country_iso2) ?? [];
    list.push(row);
    grouped.set(row.country_iso2, list);
  }
  return grouped;
}

export async function listCountries(db: SqlDatabase): Promise<Country[]> {
  const countries = await db.prepare(COUNTRY_SELECT).all<CountryRow>();
  const metrics = await db.prepare(METRIC_SELECT).all<MetricRow>();
  const grouped = groupMetrics(metrics.results);
  return countries.results.map((row) =>
    toCountry(row, grouped.get(row.iso2) ?? []),
  );
}

export async function getCountry(
  db: SqlDatabase,
  iso2: string,
): Promise<CountryDetail | null> {
  const row = await db.prepare(COUNTRY_BY_ISO).bind(iso2).first<CountryRow>();
  if (!row) return null;
  const metrics = await db.prepare(METRIC_BY_ISO).bind(iso2).all<MetricRow>();
  const visas = await listVisas(db, { country: iso2 });
  return countryDetailSchema.parse({
    ...toCountry(row, metrics.results),
    visas,
  });
}

export async function listVisas(
  db: SqlDatabase,
  filter: VisaQuery,
): Promise<Visa[]> {
  const query = buildVisaQuery(filter);
  const statement = db.prepare(query.sql);
  const bound =
    query.params.length > 0 ? statement.bind(...query.params) : statement;
  const rows = await bound.all<VisaRow>();
  return rows.results.map(toVisa);
}

export async function listSources(db: SqlDatabase): Promise<Source[]> {
  const rows = await db.prepare(SOURCE_SELECT).all<SourceRow>();
  return rows.results.map((row) => sourceSchema.parse(row));
}

export async function insertContribution(
  db: SqlDatabase,
  input: ContributionInput,
): Promise<ContributionResult> {
  const row = await db
    .prepare(CONTRIBUTION_INSERT)
    .bind(
      input.kind,
      input.target_entity ?? null,
      input.target_id ?? null,
      input.body,
      input.source_url ?? null,
      input.contact_email ?? null,
    )
    .first<{ id: number; status: string }>();
  if (!row) throw new Error("insert_failed");
  return contributionResultSchema.parse(row);
}
