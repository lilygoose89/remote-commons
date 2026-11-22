import type { APIRoute } from "astro";
import { shouldNoindex } from "../lib/flags";
import { robotsTxt } from "../lib/robots";

export const prerender = false;

export const GET: APIRoute = ({ locals }) => {
  const indexable = !shouldNoindex(
    import.meta.env.PUBLIC_INDEXABLE,
    locals.runtime?.env?.INDEXABLE,
  );
  return new Response(robotsTxt(indexable), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
