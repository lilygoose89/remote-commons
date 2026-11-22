import type { APIRoute } from "astro";
import { visasCsv } from "../../../lib/respond";
import { withDb } from "../../../lib/runtime";

export const prerender = false;

export const GET: APIRoute = ({ locals, url }) =>
  withDb(locals, (db) => visasCsv(db, url));
