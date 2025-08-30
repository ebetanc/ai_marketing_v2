// Supabase Edge Function scaffold for processing media jobs.
// Name: media-worker
// Deploy (after adjusting for your project):
//   supabase functions deploy media-worker --no-verify-jwt
// (Consider adding auth verification + secret shared key if invoking publicly.)

// This is a lightweight placeholder that simulates completing queued jobs.
// In production you would integrate with an AI image/video generation provider,
// read any input images from the 'media-inputs' bucket, generate outputs,
// store them (perhaps in a 'media-outputs' bucket), and insert rows in media_assets.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Lazy import to avoid cost if env misconfigured
async function getClient(env: Env) {
  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2.54.0"
  );
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

serve(async (req) => {
  const env = Deno.env.toObject() as unknown as Env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase env vars", { status: 500 });
  }
  const supabase = await getClient(env);

  try {
    // Fetch a single queued job (FIFO by created_at)
    const { data: job, error } = await supabase
      .from("media_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (error) {
      if (error.code === "PGRST116") {
        // no rows
        return new Response(JSON.stringify({ message: "No queued jobs" }), {
          status: 200,
        });
      }
      throw error;
    }

    // Mark processing
    await supabase
      .from("media_jobs")
      .update({ status: "processing", started_at: new Date().toISOString() })
      .eq("id", job.id);

    // Simulate generation delay
    await new Promise((r) => setTimeout(r, 1000));

    // Simulate creation of 1..N assets and upload a tiny placeholder file to media-outputs bucket
    const outputCount = job.type === "image" ? job.num_images || 1 : 1;
    const assets = [] as any[];
    for (let i = 0; i < outputCount; i++) {
      const fileName = `${job.id}/${String(i).padStart(2, "0")}.${job.type === "image" ? "jpg" : "mp4"}`;
      // Create trivial binary content (not a real image/video) for placeholder; downstream client should tolerate
      const content = new Uint8Array([0x47, 0x49, 0x54]); // 'GIT' magic marker
      const { error: upErr } = await supabase.storage
        .from("media-outputs")
        .upload(fileName, content, {
          cacheControl: "3600",
          upsert: true,
          contentType: job.type === "image" ? "image/jpeg" : "video/mp4",
        });
      // If upload fails, continue but record error in metadata
      const { data: pub } = await supabase.storage
        .from("media-outputs")
        .getPublicUrl(fileName);
      assets.push({
        job_id: job.id,
        asset_index: i,
        url: pub?.publicUrl || `storage://media-outputs/${fileName}`,
        mime_type: job.type === "image" ? "image/jpeg" : "video/mp4",
        width: job.type === "image" ? 1024 : null,
        height: job.type === "image" ? 1024 : null,
        duration_seconds:
          job.type === "video" ? job.duration_seconds || 8 : null,
        kind: "output",
        metadata: { simulated: true, upload_error: upErr?.message || null },
      });
    }
    if (assets.length) await supabase.from("media_assets").insert(assets);

    // Mark completed
    await supabase
      .from("media_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({ processed: job.id, assets: assets.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
