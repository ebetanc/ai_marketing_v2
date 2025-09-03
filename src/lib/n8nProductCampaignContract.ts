// Contract & validator for Product Campaign workflow webhook
// Workflow path: N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH (see n8n.ts)
// Operations: generateImages | generateVideo (future extensibility)

import type { BaseMeta, BasePayload, ContractCheckResult } from "./n8nContract";

export const PRODUCT_CAMPAIGN_IDENTIFIER = "productCampaign" as const;

export type ProductCampaignOperation =
  | "generateImages"
  | "generateVideo"
  | string; // forward-compatible

export interface ProductCampaignBasePayload extends BasePayload {
  identifier: typeof PRODUCT_CAMPAIGN_IDENTIFIER;
  operation: ProductCampaignOperation;
  meta?: BaseMeta;
  // Generic campaign data used across branches
  campaign?: {
    objective?: string;
    description?: string;
    aspectRatio?: string; // e.g. "16:9" or "1:1"
    model?: string; // model requested by user
  };
  // Raw user instructions
  user_request?: string; // images instructions or video instructions
  // Asset references
  upload_assets?: string[] | string; // normalized to comma-separated string downstream
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
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload.meta) {
    payload.meta = { source: "app" };
    warnings.push("meta missing; injecting default meta");
  }
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";

  if (payload.identifier !== PRODUCT_CAMPAIGN_IDENTIFIER) {
    warnings.push(
      `identifier mismatch ('${payload.identifier}') → coercing to ${PRODUCT_CAMPAIGN_IDENTIFIER}`,
    );
    (payload as any).identifier = PRODUCT_CAMPAIGN_IDENTIFIER;
  }

  const op = payload.operation;
  if (!op) errors.push("operation missing");

  const ensureString = (val: any, field: string) => {
    if (val == null || typeof val !== "string" || !val.trim()) {
      errors.push(`${op}: missing or empty '${field}'`);
    }
  };

  switch (op) {
    case "generateImages":
      ensureString((payload as any).user_request, "user_request");
      break;
    case "generateVideo":
      ensureString((payload as any).user_request, "user_request");
      break;
    default:
      warnings.push(`Unknown product campaign operation '${op}'`);
  }

  // Normalize upload_assets to comma-separated string (workflow code splits again)
  if (payload.upload_assets) {
    if (Array.isArray(payload.upload_assets)) {
      (payload as any).upload_assets = payload.upload_assets
        .filter((u) => typeof u === "string" && u.trim())
        .join(",");
    } else if (typeof payload.upload_assets !== "string") {
      warnings.push("upload_assets must be string or string[]; removing");
      delete (payload as any).upload_assets;
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalized: payload,
  };
}
