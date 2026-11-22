-- Remote Commons D1 schema v0.
-- Started from the 22 Nov 2026 local draft. No seed rows.
--
-- Rule: every published figure has source_id and last_checked (YYYY-MM-DD).
-- dataset_version '2023' is historical white-paper data and cannot be verified
-- until the row is re-checked and moved off '2023'. verified defaults to 0.
--
-- Changes from the draft:
-- * ISO date shape checks, paired amount/currency checks, and slug/iso2 checks.
-- * dataset_version and verified on country_metrics and on the tax-residency figure.
-- * verified = 1 is rejected when dataset_version is '2023'.
-- * country_metrics uniqueness includes source_id so two sources can share a day.
-- * methods.weights_json must be valid JSON.
-- * Filter indexes for the read API.
-- Scores stay derived (method_version is their provenance). They are not
-- independently sourced figures, so they do not carry source_id.

PRAGMA foreign_keys = ON;

CREATE TABLE sources (
  id TEXT PRIMARY KEY CHECK (
    length(id) BETWEEN 1 AND 80
    AND id NOT GLOB '*[^a-z0-9-]*'
    AND id NOT GLOB '-*'
    AND id NOT GLOB '*-'
  ),
  url TEXT NOT NULL CHECK (url LIKE 'https://%' OR url LIKE 'http://%'),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  publisher TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('official', 'press', 'research', 'dataset', 'other')),
  accessed_on TEXT NOT NULL CHECK (accessed_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  archive_url TEXT CHECK (archive_url IS NULL OR archive_url LIKE 'https://%' OR archive_url LIKE 'http://%'),
  licence TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE countries (
  iso2 TEXT PRIMARY KEY CHECK (length(iso2) = 2 AND iso2 GLOB '[A-Z][A-Z]'),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  region TEXT,
  currency TEXT CHECK (currency IS NULL OR (length(currency) = 3 AND currency = upper(currency))),
  tax_residency_days INTEGER CHECK (
    tax_residency_days IS NULL OR (tax_residency_days >= 0 AND tax_residency_days <= 366)
  ),
  tax_residency_source_id TEXT REFERENCES sources(id),
  tax_residency_last_checked TEXT CHECK (
    tax_residency_last_checked IS NULL
    OR tax_residency_last_checked GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  tax_residency_dataset_version TEXT CHECK (
    tax_residency_dataset_version IS NULL
    OR tax_residency_dataset_version = 'current'
    OR tax_residency_dataset_version GLOB '[0-9][0-9][0-9][0-9]'
  ),
  tax_residency_verified INTEGER NOT NULL DEFAULT 0 CHECK (tax_residency_verified IN (0, 1)),
  notes TEXT,
  CHECK (
    tax_residency_days IS NULL
    OR (
      tax_residency_source_id IS NOT NULL
      AND tax_residency_last_checked IS NOT NULL
      AND tax_residency_dataset_version IS NOT NULL
    )
  ),
  CHECK (
    tax_residency_verified = 0
    OR (
      tax_residency_dataset_version IS NOT NULL
      AND tax_residency_dataset_version != '2023'
    )
  ),
  CHECK (tax_residency_days IS NOT NULL OR tax_residency_verified = 0)
);

CREATE TABLE country_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_iso2 TEXT NOT NULL REFERENCES countries(iso2),
  metric TEXT NOT NULL CHECK (length(metric) BETWEEN 1 AND 80 AND metric NOT GLOB '*[^a-z0-9_]*'),
  value REAL NOT NULL,
  unit TEXT,
  source_id TEXT NOT NULL REFERENCES sources(id),
  last_checked TEXT NOT NULL CHECK (last_checked GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  dataset_version TEXT NOT NULL DEFAULT 'current' CHECK (
    dataset_version = 'current' OR dataset_version GLOB '[0-9][0-9][0-9][0-9]'
  ),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  CHECK (verified = 0 OR dataset_version != '2023'),
  UNIQUE (country_iso2, metric, source_id, last_checked)
);

CREATE INDEX country_metrics_country ON country_metrics (country_iso2, metric);

CREATE TABLE visas (
  id TEXT PRIMARY KEY CHECK (
    length(id) BETWEEN 1 AND 80
    AND id NOT GLOB '*[^a-z0-9-]*'
    AND id NOT GLOB '-*'
    AND id NOT GLOB '*-'
  ),
  country_iso2 TEXT NOT NULL REFERENCES countries(iso2),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  category TEXT NOT NULL CHECK (category IN ('remote_work', 'long_stay', 'startup', 'investor', 'youth', 'other')),
  status TEXT NOT NULL CHECK (status IN ('active', 'announced', 'suspended', 'ended', 'unknown')),
  duration_months INTEGER CHECK (duration_months IS NULL OR duration_months > 0),
  renewable INTEGER CHECK (renewable IS NULL OR renewable IN (0, 1)),
  min_income_amount REAL CHECK (min_income_amount IS NULL OR min_income_amount >= 0),
  min_income_currency TEXT,
  min_income_period TEXT,
  savings_amount REAL CHECK (savings_amount IS NULL OR savings_amount >= 0),
  savings_currency TEXT,
  fee_amount REAL CHECK (fee_amount IS NULL OR fee_amount >= 0),
  fee_currency TEXT,
  dependants_allowed INTEGER CHECK (dependants_allowed IS NULL OR dependants_allowed IN (0, 1)),
  local_work_allowed INTEGER CHECK (local_work_allowed IS NULL OR local_work_allowed IN (0, 1)),
  tax_treatment TEXT,
  official_url TEXT CHECK (
    official_url IS NULL OR official_url LIKE 'https://%' OR official_url LIKE 'http://%'
  ),
  source_id TEXT NOT NULL REFERENCES sources(id),
  last_checked TEXT NOT NULL CHECK (last_checked GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  dataset_version TEXT NOT NULL DEFAULT 'current' CHECK (
    dataset_version = 'current' OR dataset_version GLOB '[0-9][0-9][0-9][0-9]'
  ),
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0, 1)),
  CHECK (verified = 0 OR dataset_version != '2023'),
  CHECK (
    (
      min_income_amount IS NULL
      AND min_income_currency IS NULL
      AND min_income_period IS NULL
    )
    OR (
      min_income_amount IS NOT NULL
      AND min_income_currency IS NOT NULL
      AND length(min_income_currency) = 3
      AND min_income_currency = upper(min_income_currency)
      AND min_income_period IN ('month', 'year')
    )
  ),
  CHECK (
    (savings_amount IS NULL AND savings_currency IS NULL)
    OR (
      savings_amount IS NOT NULL
      AND savings_currency IS NOT NULL
      AND length(savings_currency) = 3
      AND savings_currency = upper(savings_currency)
    )
  ),
  CHECK (
    (fee_amount IS NULL AND fee_currency IS NULL)
    OR (
      fee_amount IS NOT NULL
      AND fee_currency IS NOT NULL
      AND length(fee_currency) = 3
      AND fee_currency = upper(fee_currency)
    )
  )
);

CREATE INDEX visas_country ON visas (country_iso2);
CREATE INDEX visas_category ON visas (category);
CREATE INDEX visas_status ON visas (status);
CREATE INDEX visas_dataset ON visas (dataset_version, verified);

CREATE TABLE methods (
  version TEXT PRIMARY KEY CHECK (length(version) BETWEEN 1 AND 40),
  published_on TEXT CHECK (
    published_on IS NULL OR published_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  ),
  description_md TEXT NOT NULL,
  weights_json TEXT NOT NULL CHECK (json_valid(weights_json))
);

CREATE TABLE scores (
  country_iso2 TEXT NOT NULL REFERENCES countries(iso2),
  method_version TEXT NOT NULL REFERENCES methods(version),
  component TEXT NOT NULL CHECK (length(component) BETWEEN 1 AND 40),
  value REAL NOT NULL,
  computed_on TEXT NOT NULL CHECK (computed_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  PRIMARY KEY (country_iso2, method_version, component)
);

CREATE TABLE changelog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  source_id TEXT REFERENCES sources(id),
  changed_by TEXT NOT NULL,
  changed_on TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX changelog_entity ON changelog (entity, entity_id);

-- Public contributions held for review. Nothing in this table is published.
-- contact_email is optional and private. No read API selects it.
CREATE TABLE contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('correction', 'new_visa', 'source', 'other')),
  target_entity TEXT CHECK (
    target_entity IS NULL
    OR target_entity IN ('countries', 'country_metrics', 'visas', 'sources', 'methods', 'scores')
  ),
  target_id TEXT CHECK (target_id IS NULL OR length(target_id) BETWEEN 1 AND 80),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 8000),
  source_url TEXT CHECK (source_url IS NULL OR source_url LIKE 'https://%' OR source_url LIKE 'http://%'),
  contact_email TEXT CHECK (contact_email IS NULL OR length(contact_email) BETWEEN 3 AND 320),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX contributions_status ON contributions (status);
