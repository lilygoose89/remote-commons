import { SITE_ORIGIN } from "./site";

export function datasetJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Remote Commons dataset",
    description:
      "DRAFT: copy pending approval. Intended data licence is CC BY 4.0, pending owner confirmation.",
    url: `${SITE_ORIGIN}/index`,
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: {
      "@type": "Organization",
      name: "Remote Commons",
      url: SITE_ORIGIN,
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_ORIGIN}/api/v1/countries`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${SITE_ORIGIN}/api/v1/countries.csv`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_ORIGIN}/api/v1/visas`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${SITE_ORIGIN}/api/v1/visas.csv`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_ORIGIN}/api/v1/sources`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${SITE_ORIGIN}/api/v1/sources.csv`,
      },
    ],
  };
}

export function datasetJsonLdScript(): string {
  return JSON.stringify(datasetJsonLd()).replaceAll("<", "\\u003c");
}
