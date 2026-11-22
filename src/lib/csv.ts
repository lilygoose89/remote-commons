export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "boolean"
      ? value
        ? "true"
        : "false"
      : typeof value === "number"
        ? String(value)
        : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(
  columns: readonly string[],
  rows: Record<string, unknown>[],
): string {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(","));
  }
  return `${lines.join("\n")}\n`;
}
