import { SITE_ORIGIN } from "./site";

const errorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error"],
  properties: {
    error: {
      type: "object",
      additionalProperties: false,
      required: ["code", "message"],
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        fields: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

const isoDate = { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } as const;
const datasetVersion = {
  type: "string",
  pattern: "^current$|^\\d{4}$",
} as const;
const currency = { type: "string", pattern: "^[A-Z]{3}$" } as const;

export function openApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Remote Commons API",
      version: "0.0.0",
      description:
        "DRAFT: copy pending approval. Read-only dataset API. POST /api/v1/contributions stores a pending row and never publishes it. contact_email is write-only.",
    },
    servers: [{ url: SITE_ORIGIN }],
    paths: {
      "/api/v1/countries": {
        get: {
          operationId: "listCountries",
          summary: "List published countries",
          responses: {
            "200": jsonResponse("CountryList"),
          },
        },
      },
      "/api/v1/countries.csv": {
        get: {
          operationId: "listCountriesCsv",
          summary: "List published countries as CSV",
          responses: { "200": csvResponse() },
        },
      },
      "/api/v1/countries/{iso2}": {
        get: {
          operationId: "getCountry",
          summary: "One published country, including its visas",
          parameters: [iso2Param()],
          responses: {
            "200": jsonResponse("CountryDetailResponse"),
            "400": jsonResponse("Error"),
            "404": jsonResponse("Error"),
          },
        },
      },
      "/api/v1/visas": {
        get: {
          operationId: "listVisas",
          summary: "List published visas",
          parameters: [countryQuery(), categoryQuery(), statusQuery()],
          responses: {
            "200": jsonResponse("VisaList"),
            "400": jsonResponse("Error"),
          },
        },
      },
      "/api/v1/visas.csv": {
        get: {
          operationId: "listVisasCsv",
          summary: "List published visas as CSV",
          parameters: [countryQuery(), categoryQuery(), statusQuery()],
          responses: {
            "200": csvResponse(),
            "400": jsonResponse("Error"),
          },
        },
      },
      "/api/v1/sources": {
        get: {
          operationId: "listSources",
          summary: "List sources",
          responses: { "200": jsonResponse("SourceList") },
        },
      },
      "/api/v1/sources.csv": {
        get: {
          operationId: "listSourcesCsv",
          summary: "List sources as CSV",
          responses: { "200": csvResponse() },
        },
      },
      "/api/v1/contributions": {
        post: {
          operationId: "createContribution",
          summary: "Store a contribution for review",
          description:
            "Writes status pending. The response is id and status only. contact_email is not returned. Nothing is auto-published.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ContributionInput" },
              },
            },
          },
          responses: {
            "201": jsonResponse("ContributionResponse"),
            "400": jsonResponse("Error"),
            "403": jsonResponse("Error"),
          },
        },
      },
    },
    components: {
      schemas: {
        Error: errorSchema,
        Metric: {
          type: "object",
          additionalProperties: false,
          required: [
            "metric",
            "value",
            "unit",
            "source_id",
            "last_checked",
            "dataset_version",
            "verified",
          ],
          properties: {
            metric: { type: "string" },
            value: { type: "number" },
            unit: { type: ["string", "null"] },
            source_id: { type: "string" },
            last_checked: isoDate,
            dataset_version: datasetVersion,
            verified: { type: "boolean" },
          },
        },
        TaxResidency: {
          type: "object",
          additionalProperties: false,
          required: [
            "days",
            "source_id",
            "last_checked",
            "dataset_version",
            "verified",
          ],
          properties: {
            days: { type: "integer", minimum: 0 },
            source_id: { type: "string" },
            last_checked: isoDate,
            dataset_version: datasetVersion,
            verified: { type: "boolean" },
          },
        },
        Country: {
          type: "object",
          additionalProperties: false,
          required: [
            "iso2",
            "name",
            "region",
            "currency",
            "tax_residency",
            "notes",
            "metrics",
          ],
          properties: {
            iso2: { type: "string", pattern: "^[A-Z]{2}$" },
            name: { type: "string" },
            region: { type: ["string", "null"] },
            currency: { type: ["string", "null"], pattern: "^[A-Z]{3}$" },
            tax_residency: {
              oneOf: [
                { $ref: "#/components/schemas/TaxResidency" },
                { type: "null" },
              ],
            },
            notes: { type: ["string", "null"] },
            metrics: {
              type: "array",
              items: { $ref: "#/components/schemas/Metric" },
            },
          },
        },
        MoneyPeriod: {
          type: "object",
          additionalProperties: false,
          required: ["amount", "currency", "period"],
          properties: {
            amount: { type: "number", minimum: 0 },
            currency,
            period: { type: "string", enum: ["month", "year"] },
          },
        },
        Money: {
          type: "object",
          additionalProperties: false,
          required: ["amount", "currency"],
          properties: {
            amount: { type: "number", minimum: 0 },
            currency,
          },
        },
        Visa: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "country_iso2",
            "name",
            "category",
            "status",
            "duration_months",
            "renewable",
            "min_income",
            "savings",
            "fee",
            "dependants_allowed",
            "local_work_allowed",
            "tax_treatment",
            "official_url",
            "source_id",
            "last_checked",
            "dataset_version",
            "verified",
          ],
          properties: {
            id: { type: "string" },
            country_iso2: { type: "string", pattern: "^[A-Z]{2}$" },
            name: { type: "string" },
            category: {
              type: "string",
              enum: [
                "remote_work",
                "long_stay",
                "startup",
                "investor",
                "youth",
                "other",
              ],
            },
            status: {
              type: "string",
              enum: ["active", "announced", "suspended", "ended", "unknown"],
            },
            duration_months: { type: ["integer", "null"] },
            renewable: { type: ["boolean", "null"] },
            min_income: {
              oneOf: [
                { $ref: "#/components/schemas/MoneyPeriod" },
                { type: "null" },
              ],
            },
            savings: {
              oneOf: [{ $ref: "#/components/schemas/Money" }, { type: "null" }],
            },
            fee: {
              oneOf: [{ $ref: "#/components/schemas/Money" }, { type: "null" }],
            },
            dependants_allowed: { type: ["boolean", "null"] },
            local_work_allowed: { type: ["boolean", "null"] },
            tax_treatment: { type: ["string", "null"] },
            official_url: { type: ["string", "null"] },
            source_id: { type: "string" },
            last_checked: isoDate,
            dataset_version: datasetVersion,
            verified: { type: "boolean" },
          },
        },
        CountryDetail: {
          allOf: [
            { $ref: "#/components/schemas/Country" },
            {
              type: "object",
              required: ["visas"],
              properties: {
                visas: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Visa" },
                },
              },
            },
          ],
        },
        Source: {
          type: "object",
          additionalProperties: false,
          required: [
            "id",
            "url",
            "title",
            "publisher",
            "kind",
            "accessed_on",
            "archive_url",
            "licence",
          ],
          properties: {
            id: { type: "string" },
            url: { type: "string" },
            title: { type: "string" },
            publisher: { type: ["string", "null"] },
            kind: {
              type: "string",
              enum: ["official", "press", "research", "dataset", "other"],
            },
            accessed_on: isoDate,
            archive_url: { type: ["string", "null"] },
            licence: { type: ["string", "null"] },
          },
        },
        ListMeta: {
          type: "object",
          additionalProperties: false,
          required: ["count"],
          properties: { count: { type: "integer", minimum: 0 } },
        },
        CountryList: listOf("Country"),
        VisaList: listOf("Visa"),
        SourceList: listOf("Source"),
        CountryDetailResponse: {
          type: "object",
          additionalProperties: false,
          required: ["data"],
          properties: { data: { $ref: "#/components/schemas/CountryDetail" } },
        },
        ContributionInput: {
          type: "object",
          additionalProperties: false,
          required: ["kind", "body"],
          properties: {
            kind: {
              type: "string",
              enum: ["correction", "new_visa", "source", "other"],
            },
            target_entity: {
              type: "string",
              enum: [
                "countries",
                "country_metrics",
                "visas",
                "sources",
                "methods",
                "scores",
              ],
            },
            target_id: { type: "string" },
            body: { type: "string", minLength: 1, maxLength: 8000 },
            source_url: { type: "string", format: "uri" },
            contact_email: {
              type: "string",
              format: "email",
              description:
                "Write-only. Stored for review. Never returned by the API.",
            },
            turnstile_token: { type: "string" },
          },
        },
        ContributionResult: {
          type: "object",
          additionalProperties: false,
          required: ["id", "status"],
          properties: {
            id: { type: "integer", minimum: 1 },
            status: { type: "string", const: "pending" },
          },
        },
        ContributionResponse: {
          type: "object",
          additionalProperties: false,
          required: ["data"],
          properties: {
            data: { $ref: "#/components/schemas/ContributionResult" },
          },
        },
      },
    },
  };
}

function listOf(ref: string) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["data", "meta"],
    properties: {
      data: { type: "array", items: { $ref: `#/components/schemas/${ref}` } },
      meta: { $ref: "#/components/schemas/ListMeta" },
    },
  };
}

function jsonResponse(schema: string) {
  return {
    description: schema,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schema}` },
      },
    },
  };
}

function csvResponse() {
  return {
    description: "CSV",
    content: { "text/csv": { schema: { type: "string" } } },
  };
}

function iso2Param() {
  return {
    name: "iso2",
    in: "path",
    required: true,
    schema: { type: "string", pattern: "^[A-Za-z]{2}$" },
  };
}

function countryQuery() {
  return {
    name: "country",
    in: "query",
    required: false,
    schema: { type: "string", pattern: "^[A-Za-z]{2}$" },
  };
}

function categoryQuery() {
  return {
    name: "category",
    in: "query",
    required: false,
    schema: {
      type: "string",
      enum: [
        "remote_work",
        "long_stay",
        "startup",
        "investor",
        "youth",
        "other",
      ],
    },
  };
}

function statusQuery() {
  return {
    name: "status",
    in: "query",
    required: false,
    schema: {
      type: "string",
      enum: ["active", "announced", "suspended", "ended", "unknown"],
    },
  };
}
