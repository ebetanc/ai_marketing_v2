// Central contract definitions for outbound n8n webhooks
// Provides types + runtime validation & normalization utilities.

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
  platforms?: SlottedPlatforms | string[]; // allow pre-normalized
  [k: string]: any;
}

export interface GenerateAnglesPayload extends BasePayload {
  identifier: "generateAngles";
  operation: "create_strategy_angles";
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
  operation: "generate_content_from_idea";
  company_id: number | string;
  strategy_id: number | string;
  idea_id: number | string;
  topic: Record<string, any>;
  platforms: SlottedPlatforms;
}

export interface AutofillPayload extends BasePayload {
  identifier: "autofill";
  operation: "company_autofill";
  website: string;
  brand?: Record<string, any>;
}

export interface RealEstateIngestPayload extends BasePayload {
  identifier: "content_saas"; // legacy identifier reused for real estate ingest
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

// Normalize a free-form platform list into slotted array matching N8N_PLATFORM_ORDER.
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
  normalized?: AnyN8nPayload;
}

export function validateAndNormalizeN8nPayload(
  payload: AnyN8nPayload,
): ContractCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const id = payload.identifier;

  if (!payload.meta) {
    warnings.push("meta missing; injecting meta object");
    payload.meta = {};
  }
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";

  if (
    payload.meta!.user_id &&
    payload.user_id &&
    payload.meta!.user_id !== payload.user_id
  ) {
    errors.push("meta.user_id and user_id mismatch");
  }

  const requireKeys = (keys: string[]) => {
    keys.forEach((k) => {
      if ((payload as any)[k] === undefined)
        errors.push(`${id}: missing field '${k}'`);
    });
  };

  switch (id) {
    case "generateAngles":
      requireKeys(["company_id", "brand", "platforms"]);
      break;
    case "generateIdeas":
      requireKeys(["company_id", "strategy_id", "angle_number", "platforms"]);
      break;
    case "generateContent":
      requireKeys([
        "company_id",
        "strategy_id",
        "idea_id",
        "topic",
        "platforms",
      ]);
      break;
    case "autofill":
      requireKeys(["website"]);
      break;
    case "content_saas":
      requireKeys(["url"]);
      break;
    default:
      warnings.push(`Unknown identifier '${id}'`);
  }

  if ("platforms" in payload) {
    const current = payload.platforms as any;
    if (!Array.isArray(current)) {
      warnings.push("platforms not array; normalizing to empty slots");
      payload.platforms = normalizePlatforms();
    } else if (
      current.length !== 8 ||
      current.some((s: any) => typeof s !== "string")
    ) {
      warnings.push("platforms shape incorrect; normalizing");
      payload.platforms = normalizePlatforms(current);
    } else {
      const mismatch = current.some(
        (val: string, idx: number) =>
          val !== "" && val.toLowerCase() !== N8N_PLATFORM_ORDER[idx],
      );
      if (mismatch) {
        warnings.push("platforms order mismatch; re-normalizing");
        payload.platforms = normalizePlatforms(current);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings, normalized: payload };
}
