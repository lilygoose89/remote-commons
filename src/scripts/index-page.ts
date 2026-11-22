import type { Country, Visa } from "../lib/schemas";
import {
  type NomadRow,
  nomadRows,
  type PolicymakerRow,
  policymakerRows,
} from "../lib/views";

export function mountIndex(doc: Document): void {
  const root = doc.querySelector("[data-index]");
  if (!root) return;
  const policymaker = root.querySelector("[data-policymaker]");
  const nomad = root.querySelector("[data-nomad]");
  if (!(policymaker instanceof HTMLElement) || !(nomad instanceof HTMLElement))
    return;
  void load(policymaker, nomad);
}

async function load(
  policymaker: HTMLElement,
  nomad: HTMLElement,
): Promise<void> {
  try {
    const [countriesResponse, visasResponse] = await Promise.all([
      fetch("/api/v1/countries"),
      fetch("/api/v1/visas"),
    ]);
    if (!countriesResponse.ok || !visasResponse.ok) throw new Error("load");
    const countriesBody = (await countriesResponse.json()) as {
      data: Country[];
    };
    const visasBody = (await visasResponse.json()) as { data: Visa[] };
    renderPolicymaker(
      policymaker,
      policymakerRows(countriesBody.data, visasBody.data),
    );
    renderNomad(nomad, nomadRows(countriesBody.data, visasBody.data));
  } catch {
    note(policymaker, "DRAFT: copy pending approval");
    note(nomad, "DRAFT: copy pending approval");
  }
}

function renderPolicymaker(section: HTMLElement, rows: PolicymakerRow[]): void {
  const columns = [
    "Country",
    "Programme",
    "Category",
    "Status",
    "Duration (months)",
    "Renewable",
    "Dependants",
    "Local work",
    "Tax treatment",
    "Dataset version",
    "Verified",
    "Source",
    "Last checked",
  ];
  const body = rows.map((row) => [
    row.country_name,
    row.name,
    row.category,
    row.status,
    cell(row.duration_months),
    bit(row.renewable),
    bit(row.dependants_allowed),
    bit(row.local_work_allowed),
    cell(row.tax_treatment),
    row.dataset_version,
    bit(row.verified),
    row.source_id,
    row.last_checked,
  ]);
  section.appendChild(countLine(rows.length));
  section.appendChild(table(columns, body));
}

function renderNomad(section: HTMLElement, rows: NomadRow[]): void {
  const columns = [
    "Country",
    "Region",
    "Currency",
    "Tax residency days",
    "Programmes",
    "Active remote-work programmes",
    "Dataset versions",
    "Verified programmes",
  ];
  const body = rows.map((row) => [
    row.name,
    cell(row.region),
    cell(row.currency),
    cell(row.tax_residency_days),
    String(row.programme_count),
    String(row.active_remote_work_count),
    row.dataset_versions.join(" "),
    String(row.verified_programme_count),
  ]);
  section.appendChild(countLine(rows.length));
  section.appendChild(table(columns, body));
}

function table(columns: string[], body: string[][]): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const tableEl = document.createElement("table");
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  for (const column of columns) {
    const cellEl = document.createElement("th");
    cellEl.scope = "col";
    cellEl.textContent = column;
    headRow.appendChild(cellEl);
  }
  head.appendChild(headRow);
  const tableBody = document.createElement("tbody");
  for (const row of body) {
    const tr = document.createElement("tr");
    for (const value of row) {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  }
  tableEl.appendChild(head);
  tableEl.appendChild(tableBody);
  wrap.appendChild(tableEl);
  return wrap;
}

function countLine(count: number): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.dataset.count = String(count);
  paragraph.textContent = String(count);
  return paragraph;
}

function note(section: HTMLElement, text: string): void {
  const paragraph = document.createElement("p");
  paragraph.className = "draft";
  paragraph.textContent = text;
  section.appendChild(paragraph);
}

function cell(value: string | number | null): string {
  if (value === null) return "";
  return String(value);
}

function bit(value: boolean | null): string {
  if (value === null) return "";
  return value ? "yes" : "no";
}
