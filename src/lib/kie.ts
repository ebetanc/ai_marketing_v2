/** KIE AI API integration helpers (image animation + Veo3 video generation).
 * Configuration:
 *  - Base URL now hard‑coded (KIE_BASE_URL) to avoid needing an env var for the host.
 *  - VITE_KIE_API_KEY still required (secret key; if sensitive, proxy via server instead of exposing in browser env).
 * If API key should not live in frontend, route this through a secure edge function instead.
 */

// NOTE: Do NOT include trailing slash. Chosen without /v1 so explicit versioned paths may be appended consistently.
const KIE_BASE_URL = "https://api.kie.ai";

interface AnimateImageRequest {
  prompt: string;
  image_base64: string; // raw base64 (no data: prefix)
  // Optional future params
  duration_seconds?: number;
  aspect_ratio?: string; // "square" | "16:9" | "9:16"
}

interface Veo3GenerateRequest {
  prompt: string;
  model?: string; // "veo3" | "veo3_fast"
  aspectRatio?: string; // docs: e.g. "16:9" (platform re-frames 9:16)
  imageUrls?: string[]; // optional single reference frame
  watermark?: string;
  callBackUrl?: string;
  enableFallback?: boolean;
  seeds?: number; // docs show plural
}

export interface AnimateImageResponse {
  request_id?: string;
  video_url: string;
  // Optional progress metadata
  [k: string]: any;
}

export interface Veo3JobResponse {
  job_id?: string; // internal mapping to taskId
  status?: string; // generating | completed | failed
  video_url?: string; // first video url (convenience)
  video_urls?: string[]; // all urls parsed from resultUrls
  raw?: any; // raw status payload
  [k: string]: any;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result; // strip data URL prefix
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export async function animateImageWithKIE(args: {
  file: File;
  prompt: string;
  durationSeconds?: number;
  aspectRatio?: "square" | "16:9" | "9:16";
  signal?: AbortSignal;
}): Promise<AnimateImageResponse> {
  const apiKey = import.meta.env.VITE_KIE_API_KEY as string | undefined;
  if (!apiKey) throw new Error("KIE API key not configured (VITE_KIE_API_KEY)");

  // Allow explicit override path (must start with /)
  const override = import.meta.env.VITE_KIE_ANIMATE_PATH as string | undefined; // e.g. /image/animate
  const candidatePaths = override
    ? [override]
    : [
        "/image/animate",
        "/images/animate",
        "/image/animation",
        "/animate/image",
        "/animate",
        "/video/animate-image",
      ];

  const b64 = await fileToBase64(args.file);
  const jsonPayload: AnimateImageRequest = {
    prompt: args.prompt.trim(),
    image_base64: b64,
    ...(args.durationSeconds ? { duration_seconds: args.durationSeconds } : {}),
    ...(args.aspectRatio ? { aspect_ratio: args.aspectRatio } : {}),
  };

  let lastError: any;
  for (const path of candidatePaths) {
    if (args.signal?.aborted) throw new Error("Animation aborted");
    try {
      const url = `${KIE_BASE_URL}${path}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Client": "lighting-ui",
        },
        body: JSON.stringify(jsonPayload),
        signal: args.signal,
      });
      if (!res.ok) {
        // If 404, try next path, otherwise capture detailed error and break
        const status = res.status;
        let bodyText = "";
        try {
          const data = await res.json();
          bodyText = data?.error || data?.message || JSON.stringify(data);
        } catch (_e) {
          // ignore
        }
        const errMsg = `KIE animate error (${status}) at ${path}${bodyText ? `: ${bodyText}` : ""}`;
        if (status === 404) {
          lastError = new Error(errMsg);
          continue; // try next path
        }
        throw new Error(errMsg);
      }
      const json = (await res.json()) as AnimateImageResponse;
      if (!json.video_url)
        throw new Error(`Missing video_url in KIE response (path ${path})`);
      return { ...json, _endpoint: path } as AnimateImageResponse;
    } catch (e) {
      lastError = e;
      // Proceed to next candidate if it's a 404-derived attempt; otherwise break
    }
  }
  // If we exhausted candidates, surface guidance.
  throw new Error(
    `${lastError?.message || lastError || "Animation failed"}. ` +
      `Tried paths: ${candidatePaths.join(", ")}. Configure VITE_KIE_ANIMATE_PATH if your endpoint differs.`,
  );
}

// Veo3 direct prompt→video (no input image)
export async function generateVeo3Video(args: {
  prompt: string;
  aspectRatio?: "16:9" | "9:16"; // docs emphasise 16:9 native; 9:16 re-framed
  imageUrls?: string[];
  model?: "veo3" | "veo3_fast";
  watermark?: string;
  callBackUrl?: string;
  enableFallback?: boolean;
  seeds?: number;
  signal?: AbortSignal;
}): Promise<Veo3JobResponse> {
  const apiKey = import.meta.env.VITE_KIE_API_KEY as string | undefined;
  if (!apiKey) throw new Error("KIE API key not configured (VITE_KIE_API_KEY)");
  const payload: Veo3GenerateRequest = {
    prompt: args.prompt.trim(),
    ...(args.model ? { model: args.model } : {}),
    ...(args.aspectRatio ? { aspectRatio: args.aspectRatio } : {}),
    ...(args.imageUrls?.length ? { imageUrls: args.imageUrls } : {}),
    ...(args.watermark ? { watermark: args.watermark } : {}),
    ...(args.callBackUrl ? { callBackUrl: args.callBackUrl } : {}),
    ...(typeof args.enableFallback === "boolean"
      ? { enableFallback: args.enableFallback }
      : {}),
    ...(typeof args.seeds === "number" ? { seeds: args.seeds } : {}),
  };
  const res = await fetch(`${KIE_BASE_URL}/api/v1/veo/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Client": "lighting-ui",
    },
    body: JSON.stringify(payload),
    signal: args.signal,
  });
  const json = await res.json().catch(() => ({}) as any);
  if (!res.ok || json?.code !== 200) {
    const msg =
      json?.msg ||
      json?.error ||
      json?.message ||
      `Veo3 generate failed (${res.status})`;
    throw new Error(msg);
  }
  const taskId = json?.data?.taskId as string | undefined;
  if (!taskId) throw new Error("Missing taskId in Veo3 response");
  return { job_id: taskId, status: "queued", raw: json };
}

// Polling utility (generic) for job endpoints that supply job_id & status
export async function pollKieJob(opts: {
  getStatus: () => Promise<Veo3JobResponse>;
  isDone?: (r: Veo3JobResponse) => boolean;
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<Veo3JobResponse> {
  const interval = opts.intervalMs ?? 2500;
  const timeout = opts.timeoutMs ?? 120000;
  const started = Date.now();
  const doneCheck =
    opts.isDone ||
    ((r: Veo3JobResponse) => r.status === "completed" || r.status === "failed");
  while (true) {
    if (opts.signal?.aborted) throw new Error("Polling aborted");
    if (Date.now() - started > timeout) throw new Error("Job polling timeout");
    const state = await opts.getStatus();
    if (doneCheck(state)) return state;
    await new Promise((res) => setTimeout(res, interval));
  }
}

// Retrieve Veo3 job status with fallback path resolution. Tries a set of candidate endpoint patterns.
export async function getVeo3Job(
  jobId: string,
  signal?: AbortSignal,
): Promise<Veo3JobResponse> {
  const apiKey = import.meta.env.VITE_KIE_API_KEY as string | undefined;
  if (!apiKey) throw new Error("KIE API key not configured (VITE_KIE_API_KEY)");
  const url = `${KIE_BASE_URL}/api/v1/veo/record-info?taskId=${encodeURIComponent(jobId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, "X-Client": "lighting-ui" },
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 200) {
    const msg =
      json?.msg ||
      json?.error ||
      json?.message ||
      `Status check failed (${res.status})`;
    throw new Error(msg);
  }
  const data = json.data;
  const successFlag = data?.successFlag;
  let status: string = "generating";
  if (successFlag === 1) status = "completed";
  else if (successFlag === 2 || successFlag === 3) status = "failed";
  let video_urls: string[] | undefined;
  let video_url: string | undefined;
  // Flexible parsing for result URLs (API may return stringified JSON, array, or single URL)
  const ru =
    (data as any)?.resultUrls ??
    (data as any)?.resultUrl ??
    (data as any)?.videoUrls;
  if (typeof ru === "string") {
    // Try to detect if it's a JSON array or a plain URL
    const trimmed = ru.trim();
    if (trimmed.startsWith("[")) {
      try {
        video_urls = JSON.parse(trimmed);
        if (Array.isArray(video_urls)) video_url = video_urls[0];
      } catch (_e) {
        // fallback: treat as single URL
        video_url = ru;
        video_urls = [ru];
      }
    } else {
      video_url = ru;
      video_urls = [ru];
    }
  } else if (Array.isArray(ru)) {
    video_urls = ru;
    video_url = ru[0];
  } else if (ru && typeof ru === "object") {
    // Some APIs might wrap URLs in an object: { urls: [...] }
    const maybeArr = (ru as any).urls || (ru as any).data;
    if (Array.isArray(maybeArr)) {
      video_urls = maybeArr;
      video_url = maybeArr[0];
    }
  }
  // Debug in development
  if (import.meta.env.DEV) {
    console.debug("getVeo3Job parsed", {
      jobId,
      status,
      video_url,
      video_urls_source: typeof ru,
    });
  }
  return { job_id: jobId, status, video_url, video_urls, raw: json };
}

export async function getVeo3Video1080p(
  jobId: string,
  signal?: AbortSignal,
): Promise<{ video_urls?: string[]; raw: any }> {
  const apiKey = import.meta.env.VITE_KIE_API_KEY as string | undefined;
  if (!apiKey) throw new Error("KIE API key not configured (VITE_KIE_API_KEY)");
  const url = `${KIE_BASE_URL}/api/v1/veo/get-1080p-video?taskId=${encodeURIComponent(jobId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, "X-Client": "lighting-ui" },
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 200) {
    const msg =
      json?.msg ||
      json?.error ||
      json?.message ||
      `1080p fetch failed (${res.status})`;
    throw new Error(msg);
  }
  let video_urls: string[] | undefined;
  try {
    const rawRu =
      json?.data?.resultUrls ?? json?.data?.resultUrl ?? json?.data?.videoUrls;
    if (typeof rawRu === "string") {
      const trimmed = rawRu.trim();
      if (trimmed.startsWith("[")) {
        try {
          video_urls = JSON.parse(trimmed);
        } catch {
          video_urls = [rawRu];
        }
      } else {
        video_urls = [rawRu];
      }
    } else if (Array.isArray(rawRu)) {
      video_urls = rawRu;
    } else if (rawRu && typeof rawRu === "object") {
      const maybe = (rawRu as any).urls || (rawRu as any).data;
      if (Array.isArray(maybe)) video_urls = maybe;
    }
  } catch (_e) {
    // ignore
  }
  if (import.meta.env.DEV) {
    console.debug("getVeo3Video1080p parsed", {
      jobId,
      video_urls_count: video_urls?.length,
    });
  }
  return { video_urls, raw: json };
}
