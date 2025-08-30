import { supabase, Tables } from "./supabase";

export type MediaJob = Tables<"media_jobs">;
export type MediaAsset = Tables<"media_assets">;

export interface CreateImageJobInput {
  company_id: number;
  prompt_subject: string;
  prompt_action?: string | null;
  prompt_style?: string | null;
  prompt_context?: string | null;
  prompt_composition?: string | null;
  prompt_refinement?: string | null;
  num_images: number;
  aspect_ratio?: "square" | "16:9" | "9:16";
}

export interface CreateVideoJobInput {
  company_id: number;
  prompt_subject: string;
  prompt_context: string;
  prompt_action: string;
  prompt_style: string;
  prompt_camera?: string | null;
  prompt_composition?: string | null;
  prompt_ambiance?: string | null;
  prompt_audio?: string | null;
  aspect_ratio?: "square" | "16:9" | "9:16";
  duration_seconds?: number; // target
}

function assemblePrompt(parts: Record<string, string | undefined | null>) {
  return Object.entries(parts)
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) =>
        `${k.replace(/^prompt_/, "").replace(/_/g, " ")}: ${v!.trim()}`,
    )
    .join("\n");
}

export async function createImageJob(input: CreateImageJobInput) {
  const assembled_prompt = assemblePrompt({
    prompt_subject: input.prompt_subject,
    prompt_action: input.prompt_action ?? undefined,
    prompt_style: input.prompt_style ?? undefined,
    prompt_context: input.prompt_context ?? undefined,
    prompt_composition: input.prompt_composition ?? undefined,
    prompt_refinement: input.prompt_refinement ?? undefined,
  });
  const { data, error } = await supabase
    .from("media_jobs")
    .insert({
      type: "image",
      company_id: input.company_id,
      prompt_subject: input.prompt_subject,
      prompt_action: input.prompt_action,
      prompt_style: input.prompt_style,
      prompt_context: input.prompt_context,
      prompt_composition: input.prompt_composition,
      prompt_refinement: input.prompt_refinement,
      num_images: input.num_images,
      aspect_ratio: input.aspect_ratio,
      assembled_prompt,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MediaJob;
}

export async function createVideoJob(input: CreateVideoJobInput) {
  const assembled_prompt = assemblePrompt({
    prompt_subject: input.prompt_subject,
    prompt_context: input.prompt_context,
    prompt_action: input.prompt_action,
    prompt_style: input.prompt_style,
    prompt_camera: input.prompt_camera ?? undefined,
    prompt_composition: input.prompt_composition ?? undefined,
    prompt_ambiance: input.prompt_ambiance ?? undefined,
    prompt_audio: input.prompt_audio ?? undefined,
  });
  const { data, error } = await supabase
    .from("media_jobs")
    .insert({
      type: "video",
      company_id: input.company_id,
      prompt_subject: input.prompt_subject,
      prompt_context: input.prompt_context,
      prompt_action: input.prompt_action,
      prompt_style: input.prompt_style,
      prompt_camera: input.prompt_camera,
      prompt_composition: input.prompt_composition,
      prompt_ambiance: input.prompt_ambiance,
      prompt_audio: input.prompt_audio,
      duration_seconds: input.duration_seconds,
      aspect_ratio: input.aspect_ratio,
      assembled_prompt,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as MediaJob;
}

export async function listJobs(companyId: number, limit = 25) {
  const { data, error } = await supabase
    .from("media_jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as MediaJob[];
}

export async function listAssets(jobId: number) {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("job_id", jobId)
    .order("asset_index", { ascending: true });
  if (error) throw new Error(error.message);
  return data as MediaAsset[];
}

export function pollJobCompletion(
  jobId: number,
  intervalMs = 2000,
  timeoutMs = 60000,
) {
  let active = true;
  const controller = new AbortController();
  const promise = new Promise<MediaJob>((resolve, reject) => {
    const started = Date.now();
    async function tick() {
      if (!active) return;
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Timed out waiting for job"));
        return;
      }
      const { data, error } = await supabase
        .from("media_jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      if (error) {
        reject(new Error(error.message));
        return;
      }
      if (data.status === "completed" || data.status === "failed") {
        resolve(data as MediaJob);
        return;
      }
      setTimeout(tick, intervalMs);
    }
    tick();
  });
  return {
    promise,
    cancel: () => {
      active = false;
      controller.abort();
    },
  };
}
