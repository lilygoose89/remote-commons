import type { APIRoute } from "astro";
import { sourcesCsv } from "../../../lib/respond";
import { withDb } from "../../../lib/runtime";

export const prerender = false;

export const GET: APIRoute = ({ locals }) => withDb(locals, sourcesCsv);
