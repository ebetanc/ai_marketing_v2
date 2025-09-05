export const N8N_PLATFORM_ORDER = [
  "twitter",
  "linkedin",
  "newsletter",
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
  "blog",
] as const;
export type PlatformName = (typeof N8N_PLATFORM_ORDER)[number];
export type SlottedPlatforms = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];
export interface BaseMeta {
  user_id?: string | null;
  source?: string;
  ts?: string;
  contract?: string;
  [k: string]: any;
}
export interface BasePayload {
  identifier: string;
  operation: string;
  meta?: BaseMeta;
  user_id?: string | null;
  platforms?: SlottedPlatforms | string[];
  [k: string]: any;
}
export interface GenerateAnglesPayload extends BasePayload {
  identifier: "generateAngles";
  operation: string;
  company_id: number | string;
  brand: Record<string, any>;
  platforms: SlottedPlatforms;
}
export interface GenerateIdeasPayload extends BasePayload {
  identifier: "generateIdeas";
  operation: "create_ideas_from_angle";
  company_id: number | string;
  strategy_id: number | string;
  angle_number: number;
  platforms: SlottedPlatforms;
}
export interface GenerateContentPayload extends BasePayload {
  identifier: "generateContent";
  operation: string;
  company_id: number | string;
  strategy_id: number | string;
  idea_id: number | string;
  topic: Record<string, any>;
  platforms: SlottedPlatforms;
}
export interface AutofillPayload extends BasePayload {
  identifier: "autofill";
  operation: string;
  website: string;
  brand?: Record<string, any>;
}
export interface RealEstateIngestPayload extends BasePayload {
  identifier: "content_saas";
  operation: "real_estate_ingest";
  url: string;
}
export type KnownWebhookPayload =
  | GenerateAnglesPayload
  | GenerateIdeasPayload
  | GenerateContentPayload
  | AutofillPayload
  | RealEstateIngestPayload;
export type AnyN8nPayload = KnownWebhookPayload | BasePayload;
export function normalizePlatforms(raw?: string[] | null): SlottedPlatforms {
  const slots: string[] = Array(8).fill("");
  if (!raw) return slots as SlottedPlatforms;
  raw
    .map((p) => (p || "").trim().toLowerCase())
    .filter(Boolean)
    .forEach((p) => {
      const idx = N8N_PLATFORM_ORDER.indexOf(p as PlatformName);
      if (idx !== -1) slots[idx] = p;
    });
  return slots as SlottedPlatforms;
}
export interface ContractCheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  normalized?: any;
}
export function validateAndNormalizeN8nPayload(
  payload: AnyN8nPayload,
): ContractCheckResult {
  if (!payload.meta) payload.meta = {};
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";
  if (Array.isArray((payload as any).platforms)) {
    (payload as any).platforms = normalizePlatforms(
      (payload as any).platforms as string[],
    );
  }
  return { ok: true, errors: [], warnings: [], normalized: payload };
}

export const VIDEO_AVATAR_IDENTIFIER = "videoAvatar" as const;
export type VideoAvatarOperation = "generateVideo" | "attach_images" | string;
export interface VideoAvatarBasePayload extends BasePayload {
  identifier: typeof VIDEO_AVATAR_IDENTIFIER;
  operation: VideoAvatarOperation | string;
  meta?: BaseMeta;
}
export interface VideoAvatarGeneratePayload extends VideoAvatarBasePayload {
  operation: "generateVideo";
  script: string;
  image_count?: number;
}
export interface VideoAvatarAttachImagesPayload extends VideoAvatarBasePayload {
  operation: "attach_images";
  images: string[];
  script_present: boolean;
  pendingUploads?: number;
}
export type AnyVideoAvatarPayload =
  | VideoAvatarGeneratePayload
  | VideoAvatarAttachImagesPayload
  | VideoAvatarBasePayload;
export function validateAndNormalizeVideoAvatarPayload(
  payload: AnyVideoAvatarPayload,
): ContractCheckResult {
  if (!payload.meta) payload.meta = {};
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";
  return { ok: true, errors: [], warnings: [], normalized: payload };
}

export const PRODUCT_CAMPAIGN_IDENTIFIER = "productCampaign" as const;
export type ProductCampaignOperation =
  | "generateImages"
  | "generateVideo"
  | string;
export interface ProductCampaignBasePayload extends BasePayload {
  identifier: typeof PRODUCT_CAMPAIGN_IDENTIFIER;
  operation: ProductCampaignOperation;
  meta?: BaseMeta;
  campaign?: {
    objective?: string;
    description?: string;
    aspectRatio?: string;
    model?: string;
  };
  user_request?: string;
  upload_assets?: string[] | string;
}
export interface ProductCampaignGenerateImagesPayload
  extends ProductCampaignBasePayload {
  operation: "generateImages";
  user_request: string;
  upload_assets?: string[] | string;
}
export interface ProductCampaignGenerateVideoPayload
  extends ProductCampaignBasePayload {
  operation: "generateVideo";
  user_request: string;
  upload_assets?: string[] | string;
}
export type AnyProductCampaignPayload =
  | ProductCampaignGenerateImagesPayload
  | ProductCampaignGenerateVideoPayload
  | ProductCampaignBasePayload;
export function validateAndNormalizeProductCampaignPayload(
  payload: AnyProductCampaignPayload,
): ContractCheckResult {
  if (!payload.meta) payload.meta = { source: "app" } as any;
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";
  return { ok: true, errors: [], warnings: [], normalized: payload };
}
import { supabase } from "./supabase";

export const N8N_BASE_URL = "http://localhost:5678";

export const N8N_DEFAULT_WEBHOOK_PATH = "content-workflow";
export const N8N_VIDEO_AVATAR_WEBHOOK_PATH = "ai-video-with-avatar";
export const N8N_REAL_ESTATE_WEBHOOK_PATH = "real-estate-content";
export const N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH = "product-campaign";

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

interface WorkflowConfig {
  contract?: string;
  defaultOperation?: string;
  validator?: (p: any) => ReturnType<typeof validateAndNormalizeN8nPayload>;
  path?: string;
}
const WORKFLOWS: Record<string, WorkflowConfig> = {
  generateAngles: {
    contract: "core-v1",
    path: N8N_DEFAULT_WEBHOOK_PATH,
  },
  generateIdeas: {
    contract: "core-v1",
    defaultOperation: "create_ideas_from_angle",
    path: N8N_DEFAULT_WEBHOOK_PATH,
  },
  generateContent: {
    contract: "core-v1",
    path: N8N_DEFAULT_WEBHOOK_PATH,
  },
  autofill: {
    contract: "core-v1",
    path: N8N_DEFAULT_WEBHOOK_PATH,
  },
  videoAvatar: {
    contract: "avatar-v1",
    path: N8N_VIDEO_AVATAR_WEBHOOK_PATH,
    validator: (p) =>
      validateAndNormalizeVideoAvatarPayload(p as AnyVideoAvatarPayload) as any,
  },
  [PRODUCT_CAMPAIGN_IDENTIFIER]: {
    contract: "product-campaign-v1",
    path: N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH,
    validator: (p) =>
      validateAndNormalizeProductCampaignPayload(
        p as AnyProductCampaignPayload,
      ) as any,
  },
  content_saas: {
    contract: "real-estate-v1",
    defaultOperation: "real_estate_ingest",
    path: N8N_REAL_ESTATE_WEBHOOK_PATH,
  },
};
function determineDefaultContract(identifier: string) {
  return WORKFLOWS[identifier]?.contract || "generic-v1";
}
function getWorkflowValidator(identifier: string) {
  return WORKFLOWS[identifier]?.validator || validateAndNormalizeN8nPayload;
}

export async function postToN8n(
  identifier: string,
  body: Record<string, any>,
  options: N8nPostOptions = {},
) {
  const envMode =
    (typeof process !== "undefined" ? process.env.NODE_ENV : undefined) ||
    "development";

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

  if (!merged.meta) merged.meta = {} as any;

  const requestId = (globalThis as any)?.crypto?.randomUUID
    ? (globalThis as any).crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  if (!(merged.meta as any).request_id) {
    (merged.meta as any).request_id = requestId;
  }
  if (!(merged.meta as any).contract) {
    (merged.meta as any).contract = determineDefaultContract(identifier);
  }

  if (
    Array.isArray((merged as any).platforms) &&
    (merged as any).platforms.length > 0 &&
    (merged as any).platforms.length !== 8
  ) {
    (merged as any).platforms = normalizePlatforms((merged as any).platforms);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "X-Client": "ai_marketing_v2",
    "X-Env": envMode,
    "X-Request-Id": (merged.meta as any).request_id,
    ...options.headers,
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(merged),
    signal: options.signal,
  });
  if (!res.ok) {
    try {
      const cloned = res.clone();
      const text = await cloned.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch (_jsonErr) {
        /* noop */
      }
      const responseHeaders: Record<string, string> = {};
      try {
        res.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
      } catch {
        /* ignore header iteration errors */
      }
      console.error("[postToN8n] Non-OK response", {
        url,
        status: res.status,
        statusText: res.statusText,
        requestHeaders: headers,
        identifier,
        requestBody: merged,
        responseBody: parsed ?? text,
        responseHeaders,
      });
    } catch (e) {
      console.error("[postToN8n] Failed to read error response body", e);
    }
  }

  (res as any).requestId = (merged.meta as any).request_id;
  return res;
}

export function prepareSlottedPlatforms(raw?: string[] | null) {
  return normalizePlatforms(raw);
}

export interface ContractValidationMeta {
  ok: boolean;
  errors: string[];
  warnings: string[];
}
export interface ContractSendResult<T = any> extends SendN8nResult<T> {
  validation: ContractValidationMeta;
}
function buildValidationResult(v: any): ContractValidationMeta {
  return {
    ok: !!v.ok,
    errors: Array.isArray(v.errors) ? v.errors : [],
    warnings: Array.isArray(v.warnings) ? v.warnings : [],
  };
}

async function parseResponseToSendResult<T = any>(
  res: Response,
): Promise<SendN8nResult<T>> {
  let rawText = "";
  let data: any = null;
  try {
    rawText = await res.text();
    if (rawText.trim()) {
      try {
        data = JSON.parse(rawText);
      } catch {
        /* leave data null */
      }
    }
  } catch (e) {
    console.warn("[n8n-wrapper] Failed to read response body", e);
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

interface N8nRequestOptions {
  operation?: string;
  body?: Record<string, any>;
  platforms?: string[];
  autoUser?: boolean;
  path?: string;
  actionParam?: boolean;
  pathVariants?: string[];
  disablePathProbe?: boolean;
  meta?: Partial<BaseMeta>;
}

export async function n8nRequest(
  identifier: string,
  options: N8nRequestOptions = {},
): Promise<ContractSendResult> {
  const wf = WORKFLOWS[identifier];
  const op =
    options.operation ||
    options.body?.operation ||
    wf?.defaultOperation ||
    identifier;
  const payload = await createN8nPayload(
    identifier,
    op,
    {
      ...(options.body || {}),
      meta: { ...(options.body?.meta || {}), ...(options.meta || {}) },
    },
    { platforms: options.platforms, autoUser: options.autoUser },
  );
  const validator = getWorkflowValidator(identifier);
  const validated = validator(payload as any);
  const validation = buildValidationResult(validated);
  const basePath = options.path || wf?.path || N8N_DEFAULT_WEBHOOK_PATH;
  const primaryPath = options.actionParam
    ? `${basePath}?action=${op}`
    : basePath;
  const devMode =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) ||
    (typeof process !== "undefined" && process.env.NODE_ENV !== "production");
  const allowVariants =
    devMode && !options.disablePathProbe && options.pathVariants?.length;
  if (!allowVariants) {
    const res = await postToN8n(identifier, validated.normalized, {
      path: primaryPath,
    });
    const sendResult = await parseResponseToSendResult(res);
    return { ...sendResult, validation };
  }
  const attempt = async (path: string, index: number) => {
    const enriched = {
      ...(validated.normalized as any),
      meta: {
        ...(validated.normalized as any).meta,
        path_variant_index: index,
        path_variant_value: path,
      },
    };
    return await postToN8n(identifier, enriched, { path });
  };
  const variants = [primaryPath, ...(options.pathVariants || [])];
  let firstRes = await attempt(variants[0], 0);
  let firstParsed = await parseResponseToSendResult(firstRes);
  if (
    !firstParsed.ok &&
    firstParsed.status === 500 &&
    /<html|<pre>Internal Server Error/i.test(firstParsed.rawText || "")
  ) {
    for (let i = 1; i < variants.length; i++) {
      try {
        const vr = await attempt(variants[i], i);
        const vp = await parseResponseToSendResult(vr);
        if (vp.ok) return { ...vp, validation };
      } catch {}
    }
  }
  return { ...firstParsed, validation };
}

export interface VideoAvatarGenerateParams {
  script: string;
  image_count?: number;
  meta?: Partial<BaseMeta>;
  user_id?: string | null;
}

export interface StandardN8nPayloadOptions {
  autoUser?: boolean;
  contract?: string;
  platforms?: string[];
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id || null;
  } catch {
    return null;
  }
}

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
      } catch {}
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
export async function n8nCall(
  identifier: string,
  params: Record<string, any>,
  opts: {
    operation?: string;
    platforms?: string[];
    autoUser?: boolean;
    path?: string;
  } = {},
) {
  const wf = WORKFLOWS[identifier];
  const op =
    opts.operation || params.operation || wf?.defaultOperation || identifier;
  const payload = await createN8nPayload(
    identifier,
    op,
    { ...params },
    { platforms: opts.platforms, autoUser: opts.autoUser },
  );
  const path = opts.path || wf?.path;
  return sendN8n(payload, path ? { path } : undefined);
}
