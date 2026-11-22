import type { APIRoute } from "astro";
import { sitemapXml } from "../lib/sitemap";

export const prerender = false;

export const GET: APIRoute = () =>
  new Response(sitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
