// Centralized n8n webhook helper to standardize URL, headers, and payload shape
// Usage: postToN8n('generateIdeas', payload) or postToN8n('...', payload, { path: 'uuid-or-custom-path' })

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

  // Ensure required top-level fields exist as many n8n nodes reference $json.body.*
  const payload = {
    identifier,
    ...body,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client": "ai_marketing_v2",
    "X-Env":
      (import.meta as any)?.env?.MODE ||
      (typeof process !== "undefined"
        ? process.env.NODE_ENV || "production"
        : "production"),
    "X-Request-Id": (globalThis as any)?.crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...options.headers,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  return res;
}
