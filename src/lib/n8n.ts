// Centralized n8n webhook helper to standardize URL, headers, payload shape & contract validation
// Usage: postToN8n('generateIdeas', payload) or postToN8n('...', payload, { path: 'uuid-or-custom-path' })
import {
  validateAndNormalizeN8nPayload,
  normalizePlatforms,
  N8N_PLATFORM_ORDER,
  type AnyN8nPayload,
} from "./n8nContract";

// Base URL for n8n webhooks.
// In development we allow overriding via VITE_N8N_BASE_URL so the Vite dev proxy
// (see vite.config.ts mapping /n8n -> remote host) can avoid browser CORS preflights.
// Create a .env.development with: VITE_N8N_BASE_URL=/n8n
// Production will normally leave this undefined so we fall back to the full domain.
export const N8N_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_N8N_BASE_URL) ||
  "https://n8n.srv856940.hstgr.cloud";
// Default generic content webhook path
export const N8N_DEFAULT_WEBHOOK_PATH = "content-saas";
// Specific video avatar webhook UUID path (updated production value)
export const N8N_VIDEO_AVATAR_WEBHOOK_PATH =
  "b7774650-a050-421b-bb73-fa302946f8c6";
// Real estate content generation webhook UUID path
export const N8N_REAL_ESTATE_WEBHOOK_PATH =
  "1776dcc3-2b3e-4cfa-abfd-0ad9cabaf6ea";
// Product campaign workflow webhook path
export const N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH =
  "5c50a899-4a7e-4fdd-af08-64f97d7c42a6";

function buildWebhookUrl(path?: string, opts?: { wait?: boolean }) {
  const base = N8N_BASE_URL.replace(/\/$/, "");
  const segment = (path ?? N8N_DEFAULT_WEBHOOK_PATH).replace(/^\//, "");
  let url = `${base}/webhook/${segment}`;
  if (opts?.wait) {
    url += url.includes("?") ? "&wait=1" : "?wait=1";
  }
  return url;
}

export type N8nPostOptions = {
  path?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

function determineDefaultContract(identifier: string) {
  switch (identifier) {
    case "generateAngles":
    case "generateIdeas":
    case "generateContent":
    case "autofill":
    case "content_saas":
      return "core-v1";
    case "videoAvatar":
      return "avatar-v1"; // avatar pages already set explicitly but fallback here
    default:
      return "generic-v1";
  }
}

export async function postToN8n(
  identifier: string,
  body: Record<string, any>,
  options: N8nPostOptions = {},
) {
  const envMode =
    (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
    "development";

  // In dev you can set VITE_N8N_WAIT=1 to force n8n to respond after execution
  // which often returns a richer JSON body instead of a generic 204/HTML.
  const waitFlag =
    envMode !== "production" &&
    typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_N8N_WAIT === "1";

  const url = buildWebhookUrl(options.path, { wait: waitFlag });

  if (body.identifier && body.identifier !== identifier) {
    console.warn(
      `postToN8n: overriding body.identifier ('${body.identifier}') with '${identifier}'`,
    );
  }

  const merged: AnyN8nPayload = {
    identifier,
    ...body,
  } as AnyN8nPayload;

  // Ensure meta exists early for enrichment
  if (!merged.meta) merged.meta = {} as any;

  // Generate a stable request id for correlation across headers, meta & logs
  const requestId = (globalThis as any)?.crypto?.randomUUID
    ? (globalThis as any).crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (!(merged.meta as any).request_id) {
    (merged.meta as any).request_id = requestId;
  }
  // Backfill contract if caller did not specify
  if (!(merged.meta as any).contract) {
    (merged.meta as any).contract = determineDefaultContract(identifier);
  }

  // Pre-normalize platforms if free-form list length not equal to 8
  if (
    Array.isArray((merged as any).platforms) &&
    (merged as any).platforms.length > 0 &&
    (merged as any).platforms.length !== 8
  ) {
    (merged as any).platforms = normalizePlatforms((merged as any).platforms);
  }

  // envMode already computed above

  if (envMode !== "production") {
    const { ok, warnings, errors, normalized } =
      validateAndNormalizeN8nPayload(merged);
    if (warnings.length) {
      console.warn(
        `[n8n-contract] Warnings for ${identifier}:\n - ${warnings.join("\n - ")}`,
      );
    }
    if (!ok) {
      console.error(
        `[n8n-contract] Errors for ${identifier}:\n - ${errors.join("\n - ")}`,
      );
    }
    if (normalized) Object.assign(merged, normalized);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "X-Client": "ai_marketing_v2",
    "X-Env": envMode,
    // Use same request id we injected into meta for downstream correlation
    "X-Request-Id": (merged.meta as any).request_id,
    ...options.headers,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(merged),
    signal: options.signal,
  });
  // If the server responded with an error, attempt to surface more diagnostics.
  if (!res.ok) {
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      // Best effort JSON parse
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (_jsonErr) {
        /* noop */
      }
      console.error("[postToN8n] Non-OK response", {
        url,
        status: res.status,
        statusText: res.statusText,
        requestHeaders: headers,
        identifier,
        requestBody: merged,
        responseBody: parsed ?? text,
      });
      // Attach a hint header value for correlation if n8n echoes it back
    } catch (e) {
      console.error("[postToN8n] Failed to read error response body", e);
    }
  }

  // Attach requestId for caller convenience (non-standard augmentation)
  (res as any).requestId = (merged.meta as any).request_id;
  return res;
}

export function prepareSlottedPlatforms(raw?: string[] | null) {
  return normalizePlatforms(raw);
}

export { N8N_PLATFORM_ORDER };

// Simple exponential backoff retry wrapper for transient failures
export interface RetryOptions {
  attempts?: number; // total attempts including first (default 3)
  baseDelayMs?: number; // initial delay (default 500)
  maxDelayMs?: number; // cap delay (default 4000)
  retryOnStatus?: number[]; // explicit statuses to retry (default 429 + 5xx)
  onAttempt?: (info: {
    attempt: number;
    attempts: number;
    lastStatus?: number;
    lastError?: any;
    delayMs?: number;
  }) => void; // callback for UI progress
}

export async function postToN8nWithRetry(
  identifier: string,
  body: Record<string, any>,
  options: N8nPostOptions & RetryOptions = {},
) {
  const {
    attempts = 3,
    baseDelayMs = 500,
    maxDelayMs = 4000,
    retryOnStatus,
    onAttempt,
    ...rest
  } = options;
  const statuses = retryOnStatus || [429, 500, 502, 503, 504, 522, 524];
  let lastError: any = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      onAttempt?.({ attempt, attempts });
      const res = await postToN8n(identifier, body, rest);
      if (!res.ok && statuses.includes(res.status) && attempt < attempts) {
        const delay = Math.min(
          maxDelayMs,
          baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100,
        );
        onAttempt?.({
          attempt,
          attempts,
          lastStatus: res.status,
          delayMs: delay,
        });
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return res;
    } catch (e: any) {
      lastError = e;
      if (attempt < attempts) {
        const delay = Math.min(
          maxDelayMs,
          baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100,
        );
        onAttempt?.({ attempt, attempts, lastError: e, delayMs: delay });
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error("postToN8nWithRetry failed");
}
