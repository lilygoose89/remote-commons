/** Indexing is off unless the flag is exactly the string "true". */
export function isIndexableFlag(value: string | undefined | null): boolean {
  return value === "true";
}

/**
 * Noindex unless the build and the runtime both opt in.
 * A preview worker stays noindexed even if it is serving an indexable build.
 */
export function shouldNoindex(
  buildFlag: string | undefined | null,
  runtimeFlag: string | undefined | null,
): boolean {
  return !(isIndexableFlag(buildFlag) && isIndexableFlag(runtimeFlag));
}
