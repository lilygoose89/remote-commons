import { SITE_ORIGIN } from "./site";

export function llmsTxt(): string {
  return `# Remote Commons

> DRAFT: copy pending approval

Research site. Not legal or immigration advice.

## Pages

- Home: ${SITE_ORIGIN}/
- Countries index: ${SITE_ORIGIN}/index
- Whitepaper: ${SITE_ORIGIN}/whitepaper
- Methodology: ${SITE_ORIGIN}/methodology
- About: ${SITE_ORIGIN}/about
- Contribute: ${SITE_ORIGIN}/contribute

## API

- OpenAPI: ${SITE_ORIGIN}/api/openapi.json
- GET ${SITE_ORIGIN}/api/v1/countries
- GET ${SITE_ORIGIN}/api/v1/countries/{iso2}
- GET ${SITE_ORIGIN}/api/v1/visas
- GET ${SITE_ORIGIN}/api/v1/sources
- CSV: the same paths with a .csv suffix (countries, visas, sources)
- POST ${SITE_ORIGIN}/api/v1/contributions writes a pending row. It is never auto-published.
- contributions.contact_email is write-only and is not returned.

## Data rules

- The repository ships no country, visa, fee, or date records.
- Every published figure has source_id and last_checked.
- dataset_version 2023 is historical until re-verified, and verified cannot be set while it is 2023.
- Scores are derived from a method version. They are not a separate sourced figure.
`;
}
