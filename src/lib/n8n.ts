// Centralized n8n webhook helper to standardize URL, headers, payload shape & contract validation
// Usage: postToN8n('generateIdeas', payload) or postToN8n('...', payload, { path: 'uuid-or-custom-path' })
import {
  validateAndNormalizeN8nPayload,
  normalizePlatforms,
  N8N_PLATFORM_ORDER,
  type AnyN8nPayload,
} from "./n8nContract";

// Base URL for n8n webhooks (no fallback; always production domain as requested)
export const N8N_BASE_URL = "https://n8n.srv856940.hstgr.cloud";
// Default generic content webhook path
export const N8N_DEFAULT_WEBHOOK_PATH = "content-saas";
// Specific video avatar webhook UUID path
export const N8N_VIDEO_AVATAR_WEBHOOK_PATH =
  "6255e046-c4ba-4d23-a1ec-2df556e98c9f";
// Real estate content generation webhook UUID path
export const N8N_REAL_ESTATE_WEBHOOK_PATH =
  "1776dcc3-2b3e-4cfa-abfd-0ad9cabaf6ea";

function buildWebhookUrl(path?: string) {
  const base = N8N_BASE_URL.replace(/\/$/, "");
  const segment = (path ?? N8N_DEFAULT_WEBHOOK_PATH).replace(/^\//, "");
  return `${base}/webhook/${segment}`;
}

export type N8nPostOptions = {
  path?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function postToN8n(
  identifier: string,
  body: Record<string, any>,
  options: N8nPostOptions = {},
) {
  const url = buildWebhookUrl(options.path);

  if (body.identifier && body.identifier !== identifier) {
    console.warn(
      `postToN8n: overriding body.identifier ('${body.identifier}') with '${identifier}'`,
    );
  }

  const merged: AnyN8nPayload = {
    identifier,
    ...body,
  } as AnyN8nPayload;

  // Pre-normalize platforms if free-form list length not equal to 8
  if (
    Array.isArray((merged as any).platforms) &&
    (merged as any).platforms.length > 0 &&
    (merged as any).platforms.length !== 8
  ) {
    (merged as any).platforms = normalizePlatforms((merged as any).platforms);
  }

  const envMode =
    (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
    "development";

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
    "X-Client": "ai_marketing_v2",
    "X-Env": envMode,
    "X-Request-Id": (globalThis as any)?.crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

  return res;
}

export function prepareSlottedPlatforms(raw?: string[] | null) {
  return normalizePlatforms(raw);
}

export { N8N_PLATFORM_ORDER };
