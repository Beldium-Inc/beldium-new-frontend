// Every backend failure arrives in one envelope:
//   { "status": "failed", "message": "...", "error": { "code": "...", "details": ... } }
// `message` is written to be shown to a user, `code` is stable and meant for
// branching, and `details` carries the field-level structure on validation
// failures. ApiError keeps all three so callers can choose.

export type ErrorDetails = Record<string, unknown> | null;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ErrorDetails;

  constructor(message: string, options: { code: string; status: number; details?: ErrorDetails }) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details ?? null;
  }

  /** True when the request never reached the API (server down, CORS, offline). */
  get isNetworkError(): boolean {
    return this.code === "network_error";
  }

  /**
   * Validation details flattened to one message per field, ready to drop into
   * a form's error state. Nested structures keep their dotted path.
   */
  fieldErrors(): Record<string, string> {
    const flat: Record<string, string> = {};
    collect(this.details, "", flat);
    return flat;
  }
}

function collect(value: unknown, path: string, out: Record<string, string>): void {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    if (path) out[path] = value;
    return;
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => item !== null && item !== undefined);
    if (first !== undefined) collect(first, path, out);
    return;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collect(item, path ? `${path}.${key}` : key, out);
    }
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

/** Build an ApiError from a parsed response body, tolerating non-envelope shapes. */
export function apiErrorFromBody(body: unknown, status: number): ApiError {
  const envelope = (body ?? {}) as { message?: unknown; detail?: unknown; error?: unknown };
  const error = (envelope.error ?? {}) as { code?: unknown; details?: unknown };
  const details =
    error.details !== null && typeof error.details === "object"
      ? (error.details as Record<string, unknown>)
      : null;

  return new ApiError(
    asString(envelope.message, asString(envelope.detail, `Request failed with status ${status}.`)),
    { code: asString(error.code, `http_${status}`), status, details },
  );
}

export function networkError(cause: unknown): ApiError {
  const error = new ApiError(
    "Cannot reach the Beldium API. Check that the server is running and try again.",
    { code: "network_error", status: 0 },
  );
  error.cause = cause;
  return error;
}
