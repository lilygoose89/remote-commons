import { writeFile } from "node:fs/promises";
import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import { staticAssetHeaders } from "./src/lib/robots";
import { SITE_ORIGIN } from "./src/lib/site";

export default defineConfig({
  site: SITE_ORIGIN,
  output: "server",
  adapter: cloudflare({ imageService: "compile" }),
  // The adapter otherwise defaults sessions to a SESSION KV binding. This
  // skeleton does not use sessions and does not create KV namespaces.
  session: {
    driver: "memory",
  },
  trailingSlash: "ignore",
  build: {
    format: "directory",
  },
  integrations: [
    {
      name: "preview-robots-headers",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          const headers = staticAssetHeaders(process.env.PUBLIC_INDEXABLE);
          if (headers === null) return;
          await writeFile(new URL("_headers", dir), headers);
        },
      },
    },
  ],
});
