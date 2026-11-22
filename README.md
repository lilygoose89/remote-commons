# Remote Commons

DRAFT skeleton for [remotecommons.org](https://remotecommons.org). Research site. Not legal or immigration advice.

Astro 5 on Cloudflare Workers (not Pages), with Cloudflare D1 as the store for countries, visas, and sources. Pages are server-rendered by the Worker. The read API is JSON, validated with Zod on the way in and out.

No country, visa, fee, or date rows are shipped. `wrangler.jsonc` uses placeholder account and database ids. Do not deploy it, do not create Cloudflare resources, and do not change DNS.

## Run locally

Node 22.

```sh
npm ci
npm run db:migrate:local
npm run build
npm run dev
```

`npm run dev` is `wrangler dev`. It serves the built Worker and a local D1 at <http://127.0.0.1:8787>. Apply migrations before the first boot so the tables exist. The local database lives under `.wrangler/` and is gitignored.

Copy `.env.example` to `.env` only if you need a local override. Do not commit `.env`.

## Data rules

- Every published figure has `source_id` and `last_checked` (`YYYY-MM-DD`). The migration enforces that where a figure exists.
- `dataset_version` `2023` is historical white-paper data. `verified` defaults to `0`, and a row cannot be `verified = 1` while `dataset_version` is `2023`.
- Country metrics and the tax-residency figure carry the same `dataset_version` / `verified` flags.
- Scores are derived from a published `methods` row. They are not independently sourced, so they do not have their own `source_id`.
- `POST /api/v1/contributions` inserts `status = 'pending'`. Nothing is auto-published.
- `contributions.contact_email` is stored and is never selected or returned.
- Turnstile runs only when `TURNSTILE_REQUIRED` is `true`. Locally it is `false`, so the check is skipped. The secret is set later with `wrangler secret put` and is not a var in `wrangler.jsonc`.

## API

| Method | Path                                                                | Notes                                     |
| ------ | ------------------------------------------------------------------- | ----------------------------------------- |
| GET    | `/api/v1/countries`                                                 | `{ data: [], meta: { count } }`           |
| GET    | `/api/v1/countries/:iso2`                                           | Country plus its visas. 404 when missing. |
| GET    | `/api/v1/visas`                                                     | Filters: `country`, `category`, `status`. |
| GET    | `/api/v1/sources`                                                   | Sources used by published figures.        |
| GET    | `/api/v1/countries.csv`, `/api/v1/visas.csv`, `/api/v1/sources.csv` | CSV variants.                             |
| GET    | `/api/openapi.json`                                                 | OpenAPI 3.1.                              |
| POST   | `/api/v1/contributions`                                             | Pending review only. JSON or a form body. |

An empty database returns empty arrays and CSV files that contain only the header row.

## Pages

`/`, `/index`, `/whitepaper`, `/methodology`, `/about`, `/contribute`.

`/index` is the countries index. It fetches `/api/v1/countries` and `/api/v1/visas` once and renders a policymaker view (one row per programme) and a nomad view (one row per country). No score is calculated.

Page prose is placeholder text marked `DRAFT: copy pending approval`. The footer on every page says the site is research, not legal or immigration advice. The index and methodology pages credit Plumia as an organization.

Also published: `/llms.txt`, `/robots.txt`, `/sitemap.xml`, and schema.org `Dataset` JSON-LD on `/` and `/index`.

## Preview indexing

Indexing is off unless both flags are the string `true`:

- `PUBLIC_INDEXABLE` at build time (meta robots, and `X-Robots-Tag` on static assets)
- `INDEXABLE` at runtime (Worker `X-Robots-Tag`, `robots.txt`)

Both default to off. `wrangler.jsonc` sets `INDEXABLE` to `false` for the default worker and the `preview` env. A production build that should be indexed has to set `PUBLIC_INDEXABLE=true` and deploy with `INDEXABLE=true`.

## Schema

`migrations/0001_init.sql` starts from the 22 Nov 2026 draft and adds:

- ISO date, slug, iso2, and paired amount/currency checks.
- `dataset_version` and `verified` on `country_metrics` and on the tax-residency columns, with a check that `2023` cannot be marked verified.
- `country_metrics` uniqueness includes `source_id`, so two sources can share a day.
- `json_valid` on `methods.weights_json`.
- Indexes for the visa filters and contribution status.

There is no seed file.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run scan-secrets
npm run build
npm run db:migrate:local
npm run smoke
```

`npm test` includes a local D1 migration check with an `XX` / Testland fixture that stays in the test process. `npm run smoke` boots `wrangler dev` and checks that the API returns empty arrays and a valid OpenAPI document.

GitHub Actions runs those checks. The deploy job is commented out.

## Licences

Code is MIT (`LICENSE`). Data is intended to be CC BY 4.0, pending owner confirmation (`DATA-LICENSE`).
