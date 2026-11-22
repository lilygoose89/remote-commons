declare module "../scripts/scan-secrets.mjs" {
  export function scanText(
    filename: string,
    text: string,
  ): Array<{ filename: string; name: string; line: number }>;
  export function scanRepository(
    cwd?: string,
  ): Array<{ filename: string; name: string; line: number }>;
}
