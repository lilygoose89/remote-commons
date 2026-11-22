import { toCsv } from "./csv";
import {
  getCountry,
  insertContribution,
  listCountries,
  listSources,
  listVisas,
  type SqlDatabase,
} from "./db";
import { csvResponse, HttpError, json, jsonError } from "./http";
import {
  type ContributionInput,
  contributionInputSchema,
  contributionResponseSchema,
  countryDetailResponseSchema,
  countryListSchema,
  iso2Schema,
  sourceListSchema,
  visaListSchema,
  visaQuerySchema,
} from "./schemas";
import { verifyTurnstile } from "./turnstile";

export interface WorkerEnv {
  TURNSTILE_REQUIRED?: string;
  TURNSTILE_SECRET_KEY?: string;
  INDEXABLE?: string;
}

export async function countriesJson(db: SqlDatabase): Promise<Response> {
  const data = await listCountries(db);
  const body = countryListSchema.parse({ data, meta: { count: data.length } });
  return json(body);
}

export async function countriesCsv(db: SqlDatabase): Promise<Response> {
  const data = await listCountries(db);
  const columns = [
    "iso2",
    "name",
    "region",
    "currency",
    "tax_residency_days",
    "tax_residency_source_id",
    "tax_residency_last_checked",
    "tax_residency_dataset_version",
    "tax_residency_verified",
    "notes",
    "metrics_json",
  ] as const;
  const rows = data.map((country) => ({
    iso2: country.iso2,
    name: country.name,
    region: country.region,
    currency: country.currency,
    tax_residency_days: country.tax_residency?.days ?? null,
    tax_residency_source_id: country.tax_residency?.source_id ?? null,
    tax_residency_last_checked: country.tax_residency?.last_checked ?? null,
    tax_residency_dataset_version:
      country.tax_residency?.dataset_version ?? null,
    tax_residency_verified: country.tax_residency?.verified ?? null,
    notes: country.notes,
    metrics_json: JSON.stringify(country.metrics),
  }));
  return csvResponse(toCsv(columns, rows), "countries.csv");
}

export async function countryJson(
  db: SqlDatabase,
  iso2: string | undefined,
): Promise<Response> {
  const parsed = iso2Schema.safeParse(iso2 ?? "");
  if (!parsed.success)
    throw new HttpError(400, "invalid_iso2", "iso2 must be two letters.");
  const country = await getCountry(db, parsed.data);
  if (!country)
    throw new HttpError(
      404,
      "not_found",
      "No country is published for that iso2 code.",
    );
  return json(countryDetailResponseSchema.parse({ data: country }));
}

export async function visasJson(db: SqlDatabase, url: URL): Promise<Response> {
  const filter = readVisaQuery(url);
  const data = await listVisas(db, filter);
  return json(visaListSchema.parse({ data, meta: { count: data.length } }));
}

export async function visasCsv(db: SqlDatabase, url: URL): Promise<Response> {
  const filter = readVisaQuery(url);
  const data = await listVisas(db, filter);
  const columns = [
    "id",
    "country_iso2",
    "name",
    "category",
    "status",
    "duration_months",
    "renewable",
    "min_income_amount",
    "min_income_currency",
    "min_income_period",
    "savings_amount",
    "savings_currency",
    "fee_amount",
    "fee_currency",
    "dependants_allowed",
    "local_work_allowed",
    "tax_treatment",
    "official_url",
    "source_id",
    "last_checked",
    "dataset_version",
    "verified",
  ] as const;
  const rows = data.map((visa) => ({
    id: visa.id,
    country_iso2: visa.country_iso2,
    name: visa.name,
    category: visa.category,
    status: visa.status,
    duration_months: visa.duration_months,
    renewable: visa.renewable,
    min_income_amount: visa.min_income?.amount ?? null,
    min_income_currency: visa.min_income?.currency ?? null,
    min_income_period: visa.min_income?.period ?? null,
    savings_amount: visa.savings?.amount ?? null,
    savings_currency: visa.savings?.currency ?? null,
    fee_amount: visa.fee?.amount ?? null,
    fee_currency: visa.fee?.currency ?? null,
    dependants_allowed: visa.dependants_allowed,
    local_work_allowed: visa.local_work_allowed,
    tax_treatment: visa.tax_treatment,
    official_url: visa.official_url,
    source_id: visa.source_id,
    last_checked: visa.last_checked,
    dataset_version: visa.dataset_version,
    verified: visa.verified,
  }));
  return csvResponse(toCsv(columns, rows), "visas.csv");
}

export async function sourcesJson(db: SqlDatabase): Promise<Response> {
  const data = await listSources(db);
  return json(sourceListSchema.parse({ data, meta: { count: data.length } }));
}

export async function sourcesCsv(db: SqlDatabase): Promise<Response> {
  const data = await listSources(db);
  const columns = [
    "id",
    "url",
    "title",
    "publisher",
    "kind",
    "accessed_on",
    "archive_url",
    "licence",
  ] as const;
  return csvResponse(toCsv(columns, data), "sources.csv");
}

export async function createContribution(
  db: SqlDatabase,
  request: Request,
  env: WorkerEnv,
  remoteIp?: string,
): Promise<Response> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 20_000) {
    return jsonError(413, "body_too_large", "The request body is too large.");
  }
  const payload = await readPayload(request);
  const parsed = contributionInputSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonError(
      400,
      "invalid_body",
      "The contribution could not be accepted.",
      parsed.error.issues.map((issue) => issue.path.join(".")),
    );
  }
  const turnstile = await verifyTurnstile({
    required: env.TURNSTILE_REQUIRED === "true",
    secret: env.TURNSTILE_SECRET_KEY,
    token: parsed.data.turnstile_token,
    remoteIp,
  });
  if (!turnstile.ok) {
    const status = turnstile.error === "turnstile_failed" ? 403 : 400;
    return jsonError(
      status,
      turnstile.error,
      "Turnstile verification did not succeed.",
    );
  }
  const result = await insertContribution(
    db,
    parsed.data satisfies ContributionInput,
  );
  return json(contributionResponseSchema.parse({ data: result }), 201);
}

function readVisaQuery(url: URL) {
  const parsed = visaQuerySchema.safeParse({
    country: url.searchParams.get("country") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    throw new HttpError(
      400,
      "invalid_query",
      "One or more query parameters are invalid.",
      parsed.error.issues.map((issue) => issue.path.join(".")),
    );
  }
  return parsed.data;
}

async function readPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) return await request.json();
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.formData();
      return Object.fromEntries(form.entries());
    }
  } catch {
    throw new HttpError(
      400,
      "invalid_body",
      "The request body could not be read.",
    );
  }
  throw new HttpError(415, "unsupported_media", "Send JSON or a form body.");
}
