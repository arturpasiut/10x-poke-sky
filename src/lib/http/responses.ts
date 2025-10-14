type HeaderValue = string;

const DEFAULT_HEADERS: Record<string, HeaderValue> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "private, max-age=0, must-revalidate",
};

const mergeHeaders = (initHeaders?: HeadersInit): Headers => {
  const headers = new Headers(DEFAULT_HEADERS);

  if (!initHeaders) {
    return headers;
  }

  const extra = new Headers(initHeaders);
  extra.forEach((value, key) => {
    headers.set(key, value);
  });

  return headers;
};

export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: mergeHeaders(init.headers),
  });

export interface ErrorResponseOptions {
  details?: unknown;
  headers?: HeadersInit;
  retryAfterMs?: number;
  statusText?: string;
}

export const errorResponse = (status: number, message: string, options: ErrorResponseOptions = {}): Response => {
  const headers = mergeHeaders(options.headers);

  if (typeof options.retryAfterMs === "number" && Number.isFinite(options.retryAfterMs)) {
    const seconds = Math.max(1, Math.round(options.retryAfterMs / 1000));
    headers.set("Retry-After", seconds.toString());
  }

  return jsonResponse(
    options.details === undefined
      ? { message }
      : {
          message,
          details: options.details,
        },
    {
      status,
      statusText: options.statusText,
      headers,
    }
  );
};
