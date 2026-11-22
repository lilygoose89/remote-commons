import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
let logs = "";

const persist = await mkdtemp(path.join(tmpdir(), "remote-commons-smoke-"));
let child;

function run(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["wrangler", ...args], {
      cwd: ROOT,
      env: { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    proc.stdout.on("data", (chunk) => {
      out += chunk;
    });
    proc.stderr.on("data", (chunk) => {
      out += chunk;
    });
    proc.on("close", (code) => {
      if (code === 0) resolve(out);
      else
        reject(new Error(`wrangler ${args.join(" ")} exited ${code}\n${out}`));
    });
  });
}

async function stop() {
  if (!child?.pid) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await new Promise((resolve) => child.on("close", resolve));
}

try {
  await run([
    "d1",
    "migrations",
    "apply",
    "remote-commons",
    "--local",
    "--persist-to",
    persist,
  ]);

  child = spawn(
    "npx",
    [
      "wrangler",
      "dev",
      "--local",
      "--no-latest",
      "--ip",
      "127.0.0.1",
      "--port",
      String(PORT),
      "--inspector-port",
      "0",
      "--persist-to",
      persist,
      "--show-interactive-dev-session",
      "false",
      "--log-level",
      "error",
    ],
    {
      cwd: ROOT,
      detached: true,
      env: { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout?.on("data", (chunk) => {
    logs += chunk;
  });
  child.stderr?.on("data", (chunk) => {
    logs += chunk;
  });

  await waitForReady();
  await checkApi();
  await checkPages();
  console.log("Smoke passed.");
} finally {
  await stop();
  await rm(persist, { recursive: true, force: true });
}

async function waitForReady() {
  const deadline = Date.now() + 45_000;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE}/api/v1/countries`);
      if (response.ok) return;
      last = `status ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`worker did not become ready: ${last}\n${logs}`);
}

async function checkApi() {
  const countries = await getJson("/api/v1/countries");
  assert.deepEqual(countries.data, []);
  assert.equal(countries.meta.count, 0);

  const missing = await fetch(`${BASE}/api/v1/countries/XX`);
  assert.equal(missing.status, 404);

  const visas = await getJson("/api/v1/visas");
  assert.deepEqual(visas.data, []);
  const filtered = await getJson(
    "/api/v1/visas?country=XX&category=remote_work&status=active",
  );
  assert.deepEqual(filtered.data, []);
  const bad = await fetch(`${BASE}/api/v1/visas?category=nope`);
  assert.equal(bad.status, 400);

  const sources = await getJson("/api/v1/sources");
  assert.deepEqual(sources.data, []);

  for (const path of [
    "/api/v1/countries.csv",
    "/api/v1/visas.csv",
    "/api/v1/sources.csv",
  ]) {
    const response = await fetch(`${BASE}${path}`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(response.headers.get("content-type") ?? "", /text\/csv/);
    assert.equal(text.trim().split("\n").length, 1);
  }

  const specResponse = await fetch(`${BASE}/api/openapi.json`);
  assert.equal(specResponse.status, 200);
  const spec = await specResponse.json();
  assert.equal(spec.openapi, "3.1.0");
  for (const path of [
    "/api/v1/countries",
    "/api/v1/countries/{iso2}",
    "/api/v1/visas",
    "/api/v1/sources",
    "/api/v1/contributions",
  ]) {
    assert.ok(spec.paths[path], path);
  }
  assert.equal(
    JSON.stringify(spec.paths["/api/v1/contributions"].post.responses).includes(
      "contact_email",
    ),
    false,
  );

  const email = "person@example.invalid";
  const created = await fetch(`${BASE}/api/v1/contributions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      kind: "other",
      body: "XX Testland fixture note",
      contact_email: email,
    }),
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.data.status, "pending");
  assert.equal(JSON.stringify(createdBody).includes("contact_email"), false);
  assert.equal(JSON.stringify(createdBody).includes(email), false);

  const stillEmpty = await getJson("/api/v1/visas");
  assert.deepEqual(stillEmpty.data, []);

  const listContributions = await fetch(`${BASE}/api/v1/contributions`);
  assert.equal(listContributions.status, 405);

  const robots = await fetch(`${BASE}/api/v1/countries`);
  assert.match(robots.headers.get("x-robots-tag") ?? "", /noindex/);
}

async function checkPages() {
  const home = await fetch(`${BASE}/`);
  const homeHtml = await home.text();
  assert.equal(home.status, 200);
  assert.match(homeHtml, /DRAFT: copy pending approval/);
  assert.match(homeHtml, /application\/ld\+json/);
  assert.match(homeHtml, /noindex, nofollow/);
  assert.match(homeHtml, /research, not legal or immigration advice/);
  assert.match(home.headers.get("x-robots-tag") ?? "", /noindex/);
  assert.equal(homeHtml.includes("EASY"), false);

  const index = await text("/index");
  assert.match(index.html, /Policymaker view/);
  assert.match(index.html, /Nomad view/);
  assert.match(index.html, /Plumia \(organization\)/);
  assert.match(index.html, /application\/ld\+json/);
  const script = index.html.slice(index.html.lastIndexOf("<script"));
  assert.match(script, /fetch\("\/api\/v1\/countries"\)/);
  assert.match(script, /fetch\("\/api\/v1\/visas"\)/);

  const contribute = await text("/contribute");
  assert.match(contribute.html, /action="\/api\/v1\/contributions"/);
  assert.match(contribute.html, /name="contact_email"/);
  assert.match(contribute.html, /stored as pending/);

  const methodology = await text("/methodology");
  assert.match(methodology.html, /Plumia \(organization\)/);
  const about = await text("/about");
  assert.equal(about.html.includes("Plumia"), false);

  const paper = await text("/whitepaper");
  assert.match(paper.html, /Lily Bruns and Leanna Lee/);
  assert.match(paper.html, /No\s+PDF is published/);
  assert.equal(paper.html.includes("EASY"), false);

  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  assert.match(robots, /Disallow: \//);
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
  assert.match(sitemap, /https:\/\/remotecommons\.org\/index/);
  const llms = await (await fetch(`${BASE}/llms.txt`)).text();
  assert.match(llms, /DRAFT: copy pending approval/);
  assert.match(llms, /contact_email is write-only/);
}

async function getJson(pathname) {
  const response = await fetch(`${BASE}${pathname}`);
  assert.equal(response.status, 200, pathname);
  return response.json();
}

async function text(pathname) {
  const response = await fetch(`${BASE}${pathname}`);
  assert.equal(response.status, 200, pathname);
  return { response, html: await response.text() };
}
