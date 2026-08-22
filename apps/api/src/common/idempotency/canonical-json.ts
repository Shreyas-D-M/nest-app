/**
 * Canonical JSON serialisation for hashing.
 *
 * Two requests that differ only in JSON key order are the same request, so the
 * hash must not depend on ordering. Without canonicalisation a client that
 * serialises its payload differently on retry would look like a *different*
 * payload and be rejected as an idempotency conflict.
 */

function normalise(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalise);
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};

    for (const key of Object.keys(record).sort()) {
      sorted[key] = normalise(record[key]);
    }

    return sorted;
  }

  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalise(value)) ?? 'null';
}
