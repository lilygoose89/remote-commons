import type { APIRoute } from "astro";
import { openApiSpec } from "../../lib/openapi";

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(openApiSpec()), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
