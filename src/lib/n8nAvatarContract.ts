// Contract definitions & validator for the AI Avatar Video n8n workflows
// Kept separate from the core n8n contract (`n8nContract.ts`) to allow domain specific evolution
// without bloating the base file.

import type { BaseMeta, BasePayload, ContractCheckResult } from "./n8nContract";

// Identifier used by the CreateVideoAvatar page when posting to n8n
export const VIDEO_AVATAR_IDENTIFIER = "videoAvatar" as const;

// Operations supported by the avatar workflow
export type VideoAvatarOperation =
  | "generateVideo" // queue creation of a new avatar video from script
  | "attach_images"; // attach already uploaded images to current working set

export interface VideoAvatarBasePayload extends BasePayload {
  identifier: typeof VIDEO_AVATAR_IDENTIFIER; // always "videoAvatar"
  operation: VideoAvatarOperation | string; // allow forward compatibility
  meta?: BaseMeta;
}

export interface VideoAvatarGeneratePayload extends VideoAvatarBasePayload {
  operation: "generateVideo";
  script: string; // required script text
  image_count?: number; // number of uploaded images at queue time
}

export interface VideoAvatarAttachImagesPayload extends VideoAvatarBasePayload {
  operation: "attach_images";
  images: string[]; // list of public image URLs already in storage
  script_present: boolean; // whether user already entered script
  pendingUploads?: number; // how many uploads are still in-flight (FYI only)
}

export type AnyVideoAvatarPayload =
  | VideoAvatarGeneratePayload
  | VideoAvatarAttachImagesPayload
  | VideoAvatarBasePayload; // fallback / forward-compatible

export function validateAndNormalizeVideoAvatarPayload(
  payload: AnyVideoAvatarPayload,
): ContractCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic meta guarantees (reuse style of core validator without re-importing its logic)
  if (!payload.meta) {
    warnings.push("meta missing; injecting meta object");
    payload.meta = {};
  }
  if (!payload.meta!.ts) payload.meta!.ts = new Date().toISOString();
  if (!payload.meta!.source) payload.meta!.source = "app";

  if (payload.identifier !== VIDEO_AVATAR_IDENTIFIER) {
    warnings.push(
      `Unexpected identifier '${payload.identifier}' for avatar contract; coercing to '${VIDEO_AVATAR_IDENTIFIER}'`,
    );
    (payload as any).identifier = VIDEO_AVATAR_IDENTIFIER; // mutate in place
  }

  const op = payload.operation;

  if (!op) errors.push("operation missing");

  switch (op) {
    case "generateVideo": {
      const p = payload as VideoAvatarGeneratePayload;
      if (!p.script || typeof p.script !== "string" || !p.script.trim()) {
        errors.push("generateVideo: missing or empty 'script'");
      } else if (p.script.length > 20_000) {
        warnings.push("script unusually long (>20k chars)");
      }
      if (p.image_count != null && typeof p.image_count !== "number") {
        warnings.push("image_count should be a number");
        delete (p as any).image_count;
      }
      break;
    }
    case "attach_images": {
      const p = payload as VideoAvatarAttachImagesPayload;
      if (!Array.isArray(p.images)) {
        errors.push("attach_images: images must be an array");
      } else {
        // Basic URL sanity (lightweight)
        const invalid = p.images.find(
          (u) => typeof u !== "string" || !/^https?:\/\//i.test(u),
        );
        if (invalid) warnings.push("one or more image URLs look invalid");
      }
      if (typeof p.script_present !== "boolean") {
        warnings.push("script_present coerced to boolean");
        (p as any).script_present = !!p.script_present;
      }
      if (p.pendingUploads != null && typeof p.pendingUploads !== "number") {
        warnings.push("pendingUploads should be a number; removing");
        delete (p as any).pendingUploads;
      }
      break;
    }
    default:
      warnings.push(`Unknown operation '${op}' for videoAvatar`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    normalized: payload,
  };
}
