/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import("@astrojs/cloudflare").Runtime<{
  DB: D1Database;
  TURNSTILE_REQUIRED?: string;
  TURNSTILE_SECRET_KEY?: string;
  INDEXABLE?: string;
}>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface ImportMetaEnv {
  readonly PUBLIC_INDEXABLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
