// Centralized n8n webhook helper to standardize URL, headers, payload shape & contract validation
// Usage: postToN8n('generateIdeas', payload) or postToN8n('...', payload, { path: 'uuid-or-custom-path' })
import {
  validateAndNormalizeVideoAvatarPayload,
  VIDEO_AVATAR_IDENTIFIER,
  type AnyVideoAvatarPayload,
} from "./n8nAvatarContract";
import {
  N8N_PLATFORM_ORDER,
  normalizePlatforms,
  validateAndNormalizeN8nPayload,
  type AnyN8nPayload,
} from "./n8nContract";
import {
  PRODUCT_CAMPAIGN_IDENTIFIER,
  validateAndNormalizeProductCampaignPayload,
  type AnyProductCampaignPayload,
} from "./n8nProductCampaignContract";
import { supabase } from "./supabase";

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

// Default contract inference table (extend as needed)
const CONTRACT_MAP: Record<string, string> = {
  generateAngles: "core-v1",
  generateIdeas: "core-v1",
  generateContent: "core-v1",
  autofill: "core-v1",
  content_saas: "core-v1",
  videoAvatar: "avatar-v1",
};
function determineDefaultContract(identifier: string) {
  return CONTRACT_MAP[identifier] || "generic-v1";
}

// Validator registry (identifier -> validator fn)
type ValidatorFn = (
  p: any,
) => ReturnType<typeof validateAndNormalizeN8nPayload>;
const VALIDATORS: Record<string, ValidatorFn> = {
  [VIDEO_AVATAR_IDENTIFIER]: (p) =>
    validateAndNormalizeVideoAvatarPayload(p as AnyVideoAvatarPayload) as any,
  [PRODUCT_CAMPAIGN_IDENTIFIER]: (p) =>
    validateAndNormalizeProductCampaignPayload(
      p as AnyProductCampaignPayload,
    ) as any,
};

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
    try {
      const validator =
        VALIDATORS[identifier] || validateAndNormalizeN8nPayload;
      const { ok, warnings, errors, normalized } = validator(merged) as any;
      if (warnings?.length) {
        console.warn(
          `[n8n-contract] Warnings for ${identifier}:\n - ${warnings.join(
            "\n - ",
          )}`,
        );
      }
      if (!ok) {
        console.error(
          `[n8n-contract] Errors for ${identifier}:\n - ${errors.join(
            "\n - ",
          )}`,
        );
      }
      if (normalized) Object.assign(merged, normalized);
    } catch (e) {
      console.warn("[n8n-contract] Validation failed", e);
    }
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

// ---------------------------------------------------------------------------
// Standardized high-level helpers
// ---------------------------------------------------------------------------

export interface StandardN8nPayloadOptions {
  autoUser?: boolean; // inject current user id if absent (default true)
  contract?: string; // override inferred contract
  platforms?: string[]; // free-form platform list; normalized if provided
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id || null;
  } catch {
    return null;
  }
}

// Build a standardized payload merging identifier / operation / meta / user / platforms
export async function createN8nPayload<Extra extends Record<string, any>>(
  identifier: string,
  operation: string,
  extra: Extra = {} as Extra,
  opts: StandardN8nPayloadOptions = {},
): Promise<AnyN8nPayload & Extra> {
  const { autoUser = true, contract, platforms } = opts;
  const userId = autoUser ? await getCurrentUserId() : null;
  const meta = {
    user_id: userId ?? undefined,
    source: "app",
    ts: new Date().toISOString(),
    contract: contract || (extra as any)?.meta?.contract,
    ...(extra as any)?.meta,
  };
  const base: AnyN8nPayload & Extra = {
    identifier,
    operation,
    user_id: (extra as any).user_id ?? userId ?? undefined,
    ...extra,
    meta,
  } as any;
  if (platforms && !base.platforms) {
    (base as any).platforms = normalizePlatforms(platforms);
  } else if (Array.isArray((base as any).platforms)) {
    (base as any).platforms = normalizePlatforms(
      (base as any).platforms as string[],
    );
  }
  return base;
}

export interface SendN8nResult<T = any> {
  ok: boolean;
  status: number;
  requestId?: string;
  data: T | null;
  rawText: string;
  response: Response;
}

export async function sendN8n<T = any>(
  payload: AnyN8nPayload,
  options: N8nPostOptions = {},
): Promise<SendN8nResult<T>> {
  const res = await postToN8n(payload.identifier, payload as any, options);
  let rawText = "";
  let data: any = null;
  try {
    rawText = await res.text();
    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch {
        // leave as null, caller can inspect rawText
      }
    }
  } catch (e) {
    console.warn("[sendN8n] Failed reading body", e);
  }
  return {
    ok: res.ok,
    status: res.status,
    requestId: (res as any).requestId,
    data,
    rawText,
    response: res,
  };
}

// Internal generic builder to reduce duplication
async function buildAndSend(
  identifier: string,
  operation: string,
  params: Record<string, any>,
  opts: { platforms?: string[]; autoUser?: boolean; path?: string } = {},
) {
  const payload = await createN8nPayload(
    identifier,
    operation,
    { ...params },
    { platforms: opts.platforms, autoUser: opts.autoUser },
  );
  return sendN8n(payload, opts.path ? { path: opts.path } : undefined);
}

// Convenience per-operation builders (public API unchanged)
export async function n8nAutofill(params: {
  website: string;
  brand?: Record<string, any>;
  [k: string]: any;
}) {
  return buildAndSend("autofill", "company_autofill", params);
}

export async function n8nGenerateAngles(params: {
  company_id: number | string;
  brand: any;
  platforms: string[];
  [k: string]: any;
}) {
  return buildAndSend("generateAngles", "create_strategy_angles", params, {
    platforms: params.platforms,
  });
}

export async function n8nGenerateIdeas(params: {
  company_id: number | string;
  strategy_id: number | string;
  angle_number: number;
  platforms: string[];
  [k: string]: any;
}) {
  return buildAndSend("generateIdeas", "create_ideas_from_angle", params, {
    platforms: params.platforms,
  });
}

export async function n8nGenerateContent(params: {
  company_id: number | string;
  strategy_id: number | string;
  idea_id: number | string;
  topic: any;
  platforms: string[];
  [k: string]: any;
}) {
  return buildAndSend("generateContent", "generate_content_from_idea", params, {
    platforms: params.platforms,
  });
}

export async function n8nRealEstateIngest(params: { url: string }) {
  return buildAndSend("content_saas", "real_estate_ingest", params, {
    autoUser: true,
    path: N8N_REAL_ESTATE_WEBHOOK_PATH,
  });
}

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
