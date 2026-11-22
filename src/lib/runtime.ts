import type { SqlDatabase } from "./db";
import { DbUnboundError, fromUnknown } from "./http";
import type { WorkerEnv } from "./respond";

export interface RuntimeLocals {
  runtime?: {
    env?: WorkerEnv & { DB?: SqlDatabase };
  };
}

export function requireDb(locals: RuntimeLocals): SqlDatabase {
  const db = locals.runtime?.env?.DB;
  if (!db) throw new DbUnboundError();
  return db;
}

export function workerEnv(locals: RuntimeLocals): WorkerEnv {
  return locals.runtime?.env ?? {};
}

export async function withDb(
  locals: RuntimeLocals,
  fn: (db: SqlDatabase) => Promise<Response>,
): Promise<Response> {
  try {
    return await fn(requireDb(locals));
  } catch (error) {
    return fromUnknown(error);
  }
}
