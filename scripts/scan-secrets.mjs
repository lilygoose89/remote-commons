import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PATTERNS = [
  {
    name: "private-key",
    re: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/,
  },
  { name: "aws-access-key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "github-pat", re: /\bghp_[A-Za-z0-9]{36}\b/ },
  { name: "github-fine-grained-pat", re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: "slack-token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "stripe-live-key", re: /\bsk_live_[A-Za-z0-9]{10,}\b/ },
  { name: "google-api-key", re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  {
    name: "assigned-secret",
    re: /\b(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN|TURNSTILE_SECRET_KEY|AWS_SECRET_ACCESS_KEY)\s*=\s*['"]?[A-Za-z0-9_-]{20,}/,
  },
];

const FORBIDDEN_NAMES = /(^|\/)\.env$|(^|\/)credentials\.json$|\.pem$|id_rsa$/;

export function scanText(filename, text) {
  const findings = [];
  if (FORBIDDEN_NAMES.test(filename)) {
    findings.push({ filename, name: "forbidden-filename", line: 0 });
  }
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const pattern of PATTERNS) {
      if (pattern.re.test(lines[index])) {
        findings.push({ filename, name: pattern.name, line: index + 1 });
      }
    }
  }
  return findings;
}

export function trackedFiles(cwd = ROOT) {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd,
    encoding: "buffer",
  });
  if (result.status !== 0) {
    throw new Error("git ls-files failed");
  }
  return result.stdout.toString("utf8").split("\0").filter(Boolean);
}

export function scanRepository(cwd = ROOT) {
  const findings = [];
  for (const file of trackedFiles(cwd)) {
    const buffer = readFileSync(path.join(cwd, file));
    if (buffer.includes(0)) continue;
    findings.push(...scanText(file, buffer.toString("utf8")));
  }
  return findings;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const findings = scanRepository();
  if (findings.length > 0) {
    console.error("Secret scan failed:");
    for (const finding of findings) {
      console.error(`- ${finding.filename}:${finding.line} ${finding.name}`);
    }
    process.exit(1);
  }
  console.log("Secret scan passed.");
}
