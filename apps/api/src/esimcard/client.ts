import { env } from '../env.js';
import { logger } from '../lib/logger.js';

export class EsimcardError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'EsimcardError';
  }
}

type Query = Record<string, string | number | boolean | undefined>;
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Query;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Low-level esimcard API call. Uses the static reseller Bearer token.
 *
 * NOTE: The token is a long-lived personal access token, so we don't /login per
 * request. If esimcard ever returns 401 we surface a clear error — refreshing it
 * would require stored reseller credentials (a future enhancement).
 */
export async function esimcardRequest<T = unknown>(
  pathname: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(env.ESIMCARD_BASE_URL + pathname);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.ESIMCARD_TOKEN}`,
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 60_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    logger.error('esimcard request failed', { pathname, err: String(err) });
    throw new EsimcardError(0, `Network error calling esimcard: ${String(err)}`);
  }
  clearTimeout(timeout);

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!res.ok) {
    const message =
      (json as { message?: string })?.message ?? `esimcard responded ${res.status}`;
    if (res.status === 401) {
      logger.error('esimcard token rejected (401) — token may be expired/revoked', { pathname });
    }
    throw new EsimcardError(res.status, message, json ?? text);
  }

  return json as T;
}
