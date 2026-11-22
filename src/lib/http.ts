export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: string[],
  ) {
    super(message);
  }
}

export class DbUnboundError extends Error {
  constructor() {
    super("db_unbound");
  }
}

export function json(
  data: unknown,
  status = 200,
  extra?: Record<string, string>,
): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": status === 200 ? "public, max-age=60" : "no-store",
    "access-control-allow-origin": "*",
  });
  if (extra) {
    for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: string[],
): Response {
  const error: { code: string; message: string; fields?: string[] } = {
    code,
    message,
  };
  if (fields && fields.length > 0) error.fields = fields;
  return json({ error }, status);
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `inline; filename="${filename}"`,
      "cache-control": "public, max-age=60",
      "access-control-allow-origin": "*",
    },
  });
}

export function fromUnknown(error: unknown): Response {
  if (error instanceof HttpError)
    return jsonError(error.status, error.code, error.message, error.fields);
  if (error instanceof DbUnboundError) {
    return jsonError(
      500,
      "db_unbound",
      "The database binding is not available.",
    );
  }
  console.error(error);
  return jsonError(500, "internal", "The request could not be completed.");
}
