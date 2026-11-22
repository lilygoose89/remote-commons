import type { APIRoute } from "astro";
import { countryJson } from "../../../../lib/respond";
import { withDb } from "../../../../lib/runtime";

export const prerender = false;

export const GET: APIRoute = ({ locals, params }) =>
  withDb(locals, (db) => countryJson(db, params.iso2));
