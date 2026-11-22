import { defineMiddleware } from "astro:middleware";
import { shouldNoindex } from "./lib/flags";
import { ROBOTS_TAG } from "./lib/robots";

function stamp(
  response: Response,
  buildFlag: string | undefined,
  runtimeFlag: string | undefined,
): Response {
  if (!shouldNoindex(buildFlag, runtimeFlag)) return response;
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", ROBOTS_TAG);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const buildFlag = import.meta.env.PUBLIC_INDEXABLE;
  const runtimeFlag = context.locals.runtime?.env?.INDEXABLE;
  const response = await next();
  return stamp(response, buildFlag, runtimeFlag);
});
