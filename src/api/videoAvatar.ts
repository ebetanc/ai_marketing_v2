export interface VideoAvatarRequest {
  script: string;
  imageCount: number;
  userId?: string | null;
  companyId?: number | string | null;
  extra?: Record<string, any>;
}

export interface VideoAvatarResponse {
  ok: boolean;
  status: number;
  requestId: string;
  raw?: any;
}

const DEFAULT_WEBHOOK =
  "https://n8n.srv856940.hstgr.cloud/webhook/6255e046-c4ba-4d23-a1ec-2df556e98c9f";

export function buildVideoAvatarPayload(req: VideoAvatarRequest) {
  return {
    identifier: "videoAvatar",
    operation: "generateVideo",
    meta: { source: "app", ts: new Date().toISOString() },
    script: req.script,
    image_count: req.imageCount,
    user_id: req.userId ?? null,
    company_id: req.companyId ?? null,
    ...req.extra,
  };
}

export async function sendVideoAvatarWebhook(
  req: VideoAvatarRequest,
): Promise<VideoAvatarResponse> {
  const endpoint =
    (import.meta as any)?.env?.VITE_VIDEO_AVATAR_WEBHOOK_URL || DEFAULT_WEBHOOK;
  const payload = buildVideoAvatarPayload(req);
  const requestId =
    (globalThis as any)?.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let raw: any = undefined;
  let status = 0;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(payload),
    });
    status = res.status;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      raw = await res.json().catch(() => undefined);
    } else {
      raw = await res.text().catch(() => undefined);
    }
    return { ok: res.ok, status, requestId, raw };
  } catch (err) {
    return {
      ok: false,
      status,
      requestId,
      raw: { error: (err as any)?.message },
    };
  }
}
