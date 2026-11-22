import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const datasetVersionSchema = z.string().regex(/^current$|^\d{4}$/);
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const iso2Schema = z
  .string()
  .regex(/^[A-Za-z]{2}$/)
  .transform((value) => value.toUpperCase());

export const visaCategorySchema = z.enum([
  "remote_work",
  "long_stay",
  "startup",
  "investor",
  "youth",
  "other",
]);

export const visaStatusSchema = z.enum([
  "active",
  "announced",
  "suspended",
  "ended",
  "unknown",
]);

export const sourceKindSchema = z.enum([
  "official",
  "press",
  "research",
  "dataset",
  "other",
]);

export const contributionKindSchema = z.enum([
  "correction",
  "new_visa",
  "source",
  "other",
]);

export const contributionTargetSchema = z.enum([
  "countries",
  "country_metrics",
  "visas",
  "sources",
  "methods",
  "scores",
]);

export const metricSchema = z
  .object({
    metric: z.string().min(1),
    value: z.number(),
    unit: z.string().nullable(),
    source_id: z.string().min(1),
    last_checked: isoDateSchema,
    dataset_version: datasetVersionSchema,
    verified: z.boolean(),
  })
  .strict();

export const taxResidencySchema = z
  .object({
    days: z.number().int().nonnegative(),
    source_id: z.string().min(1),
    last_checked: isoDateSchema,
    dataset_version: datasetVersionSchema,
    verified: z.boolean(),
  })
  .strict();

export const countrySchema = z
  .object({
    iso2: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(1),
    region: z.string().nullable(),
    currency: currencySchema.nullable(),
    tax_residency: taxResidencySchema.nullable(),
    notes: z.string().nullable(),
    metrics: z.array(metricSchema),
  })
  .strict();

export const moneyPeriodSchema = z
  .object({
    amount: z.number().nonnegative(),
    currency: currencySchema,
    period: z.enum(["month", "year"]),
  })
  .strict();

export const moneySchema = z
  .object({
    amount: z.number().nonnegative(),
    currency: currencySchema,
  })
  .strict();

export const visaSchema = z
  .object({
    id: z.string().min(1),
    country_iso2: z.string().regex(/^[A-Z]{2}$/),
    name: z.string().min(1),
    category: visaCategorySchema,
    status: visaStatusSchema,
    duration_months: z.number().int().positive().nullable(),
    renewable: z.boolean().nullable(),
    min_income: moneyPeriodSchema.nullable(),
    savings: moneySchema.nullable(),
    fee: moneySchema.nullable(),
    dependants_allowed: z.boolean().nullable(),
    local_work_allowed: z.boolean().nullable(),
    tax_treatment: z.string().nullable(),
    official_url: z.string().nullable(),
    source_id: z.string().min(1),
    last_checked: isoDateSchema,
    dataset_version: datasetVersionSchema,
    verified: z.boolean(),
  })
  .strict();

export const countryDetailSchema = countrySchema
  .extend({
    visas: z.array(visaSchema),
  })
  .strict();

export const sourceSchema = z
  .object({
    id: z.string().min(1),
    url: z.string().min(1),
    title: z.string().min(1),
    publisher: z.string().nullable(),
    kind: sourceKindSchema,
    accessed_on: isoDateSchema,
    archive_url: z.string().nullable(),
    licence: z.string().nullable(),
  })
  .strict();

export const listMetaSchema = z
  .object({
    count: z.number().int().nonnegative(),
  })
  .strict();

export function listResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z
    .object({
      data: z.array(item),
      meta: listMetaSchema,
    })
    .strict();
}

export const countryListSchema = listResponseSchema(countrySchema);
export const visaListSchema = listResponseSchema(visaSchema);
export const sourceListSchema = listResponseSchema(sourceSchema);

export const countryDetailResponseSchema = z
  .object({
    data: countryDetailSchema,
  })
  .strict();

export const visaQuerySchema = z
  .object({
    country: z.preprocess(blankToUndefined, iso2Schema.optional()),
    category: z.preprocess(blankToUndefined, visaCategorySchema.optional()),
    status: z.preprocess(blankToUndefined, visaStatusSchema.optional()),
  })
  .strict();

export const contributionInputSchema = z
  .object({
    kind: contributionKindSchema,
    target_entity: z.preprocess(
      blankToUndefined,
      contributionTargetSchema.optional(),
    ),
    target_id: z.preprocess(
      blankToUndefined,
      z.string().trim().min(1).max(80).optional(),
    ),
    body: z.string().trim().min(1).max(8000),
    source_url: z.preprocess(
      blankToUndefined,
      z.string().trim().url().max(2000).optional(),
    ),
    contact_email: z.preprocess(
      blankToUndefined,
      z.string().trim().email().max(320).optional(),
    ),
    turnstile_token: z.preprocess(
      blankToUndefined,
      z.string().trim().min(1).max(2048).optional(),
    ),
  })
  .strict();

/** Write result. contact_email is intentionally absent. */
export const contributionResultSchema = z
  .object({
    id: z.number().int().positive(),
    status: z.literal("pending"),
  })
  .strict();

export const contributionResponseSchema = z
  .object({
    data: contributionResultSchema,
  })
  .strict();

export type Country = z.infer<typeof countrySchema>;
export type CountryDetail = z.infer<typeof countryDetailSchema>;
export type Visa = z.infer<typeof visaSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type ContributionInput = z.infer<typeof contributionInputSchema>;
export type ContributionResult = z.infer<typeof contributionResultSchema>;
export type VisaQuery = z.infer<typeof visaQuerySchema>;
