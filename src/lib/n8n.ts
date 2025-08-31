// Centralized n8n webhook helper to standardize URL, headers, payload shape & contract validation
// Usage: postToN8n('generateIdeas', payload) or postToN8n('...', payload, { path: 'uuid-or-custom-path' })
import {
  validateAndNormalizeN8nPayload,
  normalizePlatforms,
  N8N_PLATFORM_ORDER,
  type AnyN8nPayload,
} from "./n8nContract";

export const N8N_BASE_URL =
  (import.meta as any)?.env?.VITE_N8N_BASE_URL ||
  "https://n8n.srv856940.hstgr.cloud";
export const N8N_DEFAULT_WEBHOOK_PATH =
  (import.meta as any)?.env?.VITE_N8N_WEBHOOK_PATH || "content-saas";

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
    (import.meta as any)?.env?.MODE ||
    (typeof process !== "undefined"
      ? process.env.NODE_ENV || "production"
      : "production");

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

  return res;
}

export function prepareSlottedPlatforms(raw?: string[] | null) {
  return normalizePlatforms(raw);
}

export { N8N_PLATFORM_ORDER };
