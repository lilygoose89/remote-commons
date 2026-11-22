import type { APIRoute } from "astro";
import { fromUnknown, jsonError } from "../../../lib/http";
import { createContribution } from "../../../lib/respond";
import { requireDb, workerEnv } from "../../../lib/runtime";

export const prerender = false;

export const GET: APIRoute = () =>
  jsonError(
    405,
    "method_not_allowed",
    "Use POST to submit a contribution for review.",
  );

export const POST: APIRoute = async ({ locals, request, clientAddress }) => {
  try {
    let remoteIp: string | undefined;
    try {
      remoteIp = clientAddress;
    } catch {
      remoteIp = undefined;
    }
    return await createContribution(
      requireDb(locals),
      request,
      workerEnv(locals),
      remoteIp,
    );
  } catch (error) {
    return fromUnknown(error);
  }
};
