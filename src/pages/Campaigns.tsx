import React, { useCallback, useEffect, useState } from "react";
import { Megaphone, ImagePlus, Loader2, Video, Upload, X } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { supabase, uploadFileToSupabaseStorage } from "../lib/supabase";
import { MEDIA_BUCKET, campaignAssetPath } from "../lib/mediaBuckets";
import {
  postToN8n,
  postToN8nWithRetry,
  N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH,
} from "../lib/n8n";
import {
  PRODUCT_CAMPAIGN_IDENTIFIER,
  validateAndNormalizeProductCampaignPayload,
} from "../lib/n8nProductCampaignContract";

interface CampaignAsset {
  id: string;
  file: File;
  localUrl: string;
  publicUrl: string | null;
  uploading: boolean;
  error?: string | null;
}

type GenerationTab = "images" | "video";

export function Campaigns() {
  useDocumentTitle("Product Campaign — Lighting");
  const { push, remove } = useToast();
  const [tab, setTab] = useState<GenerationTab>("images");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [model, setModel] = useState("gpt-4o-image");
  const [imageInstructions, setImageInstructions] = useState("");
  const [videoInstructions, setVideoInstructions] = useState("");
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  interface CampaignActivityEntry {
    id: string;
    type: "images" | "video";
    ts: string;
    requestId?: string;
    assetCount: number;
    status: "queued" | "error" | "ok";
    scriptChars?: number;
    message?: string;
  }
  const [activity, setActivity] = useState<CampaignActivityEntry[]>([]);
  const [jobs, setJobs] = useState<any[]>([]); // media_jobs rows
  const [jobPolling, setJobPolling] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [jobAssets, setJobAssets] = useState<Record<number, any[]>>({});
  const [ownedCompanyIds, setOwnedCompanyIds] = useState<number[]>([]);
  const [campaignId, setCampaignId] = useState<string>(() => {
    // Temporary campaign identifier (will map to persistent id when backend supports it)
    return (
      localStorage.getItem("productCampaign:campaignId") ||
      (() => {
        const id = crypto.randomUUID();
        try {
          localStorage.setItem("productCampaign:campaignId", id);
        } catch {}
        return id;
      })()
    );
  });

  const POLL_INTERVAL_MS = 8000;
  const MAX_JOB_ROWS = 40;

  // Local storage keys
  const LS_KEY = "productCampaign:draft:v1";
  const LS_ACTIVITY_KEY = "productCampaign:activity:v1";

  // Hydrate draft & activity from localStorage (migrating older activity shape if present)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setObjective(parsed.objective || "");
        setDescription(parsed.description || "");
        setAspectRatio(parsed.aspectRatio || "16:9");
        setModel(parsed.model || "gpt-4o-image");
        setImageInstructions(parsed.imageInstructions || "");
        setVideoInstructions(parsed.videoInstructions || "");
      }
      const actRaw = localStorage.getItem(LS_ACTIVITY_KEY);
      if (actRaw) {
        const parsedAct = JSON.parse(actRaw);
        if (Array.isArray(parsedAct)) {
          setActivity(
            parsedAct.map((p: any) => ({
              id: p.id || crypto.randomUUID(),
              type: p.type === "video" ? "video" : "images",
              ts: p.ts || new Date().toISOString(),
              requestId: p.requestId,
              assetCount: typeof p.assetCount === "number" ? p.assetCount : 0,
              status:
                p.status === "error"
                  ? "error"
                  : p.status === "ok"
                    ? "ok"
                    : "queued",
              scriptChars:
                typeof p.scriptChars === "number" ? p.scriptChars : undefined,
              message: p.message,
            })),
          );
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored campaign draft", e);
    }
  }, []);

  // Persist draft (debounced via simple timeout)
  useEffect(() => {
    const handle = setTimeout(() => {
      const payload = {
        objective,
        description,
        aspectRatio,
        model,
        imageInstructions,
        videoInstructions,
      };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      } catch {}
    }, 400);
    return () => clearTimeout(handle);
  }, [
    objective,
    description,
    aspectRatio,
    model,
    imageInstructions,
    videoInstructions,
  ]);

  // Persist activity when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_ACTIVITY_KEY,
        JSON.stringify(activity.slice(0, 50)),
      );
    } catch {}
  }, [activity]);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      assets.forEach((a) => a.localUrl && URL.revokeObjectURL(a.localUrl));
    };
  }, [assets]);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newAssets: CampaignAsset[] = [];
      Array.from(fileList).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          push({
            message: `Skipping non-image file: ${file.name}`,
            variant: "warning",
          });
          return;
        }
        const id = crypto.randomUUID();
        newAssets.push({
          id,
          file,
          localUrl: URL.createObjectURL(file),
          publicUrl: null,
          uploading: true,
          error: null,
        });
      });
      if (!newAssets.length) return;
      setAssets((prev) => [...prev, ...newAssets]);
      // Begin uploads
      newAssets.forEach(async (asset) => {
        try {
          const publicUrl = await uploadFileToSupabaseStorage(
            asset.file,
            MEDIA_BUCKET,
            campaignAssetPath(asset.id, asset.file.name),
          );
          setAssets((prev) =>
            prev.map((a) =>
              a.id === asset.id ? { ...a, publicUrl, uploading: false } : a,
            ),
          );
        } catch (e: any) {
          setAssets((prev) =>
            prev.map((a) =>
              a.id === asset.id
                ? {
                    ...a,
                    uploading: false,
                    error: e.message || "Upload failed",
                  }
                : a,
            ),
          );
          push({
            message: `Failed to upload ${asset.file.name}`,
            variant: "error",
          });
        }
      });
    },
    [push],
  );

  const onFilePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if ((e.target as HTMLElement).id === "campaign-dropzone")
      setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeAsset = (id: string) => {
    setAssets((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.localUrl) URL.revokeObjectURL(target.localUrl);
      return prev.filter((a) => a.id !== id);
    });
  };

  const buildBaseCampaignObject = () => ({
    objective: objective.trim() || undefined,
    description: description.trim() || undefined,
    aspectRatio: aspectRatio.trim() || undefined,
    model: model.trim() || undefined,
    // campaignId moved into meta.campaign_id
  });

  const runWebhook = async (operation: "generateImages" | "generateVideo") => {
    setSubmitting(true);
    let toastId: string | null = null;
    const baseMsg =
      operation === "generateImages"
        ? "Generating image prompts"
        : "Generating video prompt";
    toastId = push({
      message: baseMsg + " (attempt 1)…",
      variant: "info",
      duration: 60000,
    });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      const uploadedUrls = assets
        .filter((a) => a.publicUrl)
        .map((a) => a.publicUrl!) as string[];
      const payload = {
        identifier: PRODUCT_CAMPAIGN_IDENTIFIER,
        operation,
        user_id: userId,
        meta: {
          user_id: userId,
          source: "app",
          ts: new Date().toISOString(),
          contract: "product-campaign-v1",
          campaign_id: campaignId,
        },
        campaign: buildBaseCampaignObject(),
        user_request:
          operation === "generateImages"
            ? imageInstructions.trim()
            : videoInstructions.trim(),
        upload_assets: uploadedUrls,
      } as const;
      const { ok, errors, warnings, normalized } =
        validateAndNormalizeProductCampaignPayload(payload as any);
      if (warnings.length)
        console.warn("[product-campaign-contract]", warnings);
      if (!ok) {
        push({ message: errors.join("; "), variant: "error" });
        return;
      }
      const res = await postToN8nWithRetry(
        PRODUCT_CAMPAIGN_IDENTIFIER,
        normalized!,
        {
          attempts: 4,
          path: N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH,
          onAttempt: ({
            attempt,
            attempts,
            lastStatus,
            lastError,
          }: {
            attempt: number;
            attempts: number;
            lastStatus?: number;
            lastError?: any;
          }) => {
            const suffix = lastStatus
              ? ` (retry after ${lastStatus})`
              : lastError
                ? " (retry after error)"
                : "";
            if (attempt > 1 && toastId) remove(toastId);
            toastId = push({
              message: `${baseMsg} (attempt ${attempt}/${attempts})${suffix}`,
              variant: attempt === attempts ? "warning" : "info",
              duration: 60000,
            });
          },
        } as any,
      );
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      push({
        message:
          operation === "generateImages"
            ? "Image generation queued"
            : "Video prompt generation queued",
        variant: "success",
      });
      const instructionText = (
        operation === "generateImages" ? imageInstructions : videoInstructions
      ).trim();
      setActivity((prev) => [
        {
          id: crypto.randomUUID(),
          type: operation === "generateImages" ? "images" : "video",
          ts: new Date().toISOString(),
          requestId: (res as any).requestId,
          assetCount: uploadedUrls.length,
          status: "queued",
          scriptChars: instructionText.length || undefined,
          message: "Queued",
        },
        ...prev,
      ]);
    } catch (e: any) {
      const detail = e?.body?.message || e?.body?.error || e?.message;
      push({
        message: (detail || "Webhook failed").toString().slice(0, 140),
        variant: "error",
      });
      try {
        const instructionText = (
          operation === "generateImages" ? imageInstructions : videoInstructions
        ).trim();
        setActivity((prev) => [
          {
            id: crypto.randomUUID(),
            type: operation === "generateImages" ? "images" : "video",
            ts: new Date().toISOString(),
            requestId: undefined,
            assetCount: assets.filter((a) => a.publicUrl).length,
            status: "error",
            scriptChars: instructionText.length || undefined,
            message: (detail || "Webhook failed").toString().slice(0, 180),
          },
          ...prev,
        ]);
      } catch {
        /* ignore */
      }
    } finally {
      if (toastId) remove(toastId);
      setSubmitting(false);
    }
  };

  const imagesDisabled = !imageInstructions.trim();
  const videoDisabled = !videoInstructions.trim();

  // Update queued activity entries when jobs complete/fail (heuristic match by type + time proximity)
  useEffect(() => {
    if (!jobs.length) return;
    setActivity((prev): CampaignActivityEntry[] => {
      let changed = false;
      const updated = prev.map((act) => {
        if (act.status !== "queued") return act;
        const match = jobs.find((j: any) => {
          const jobTypeNorm =
            j.type === "image" || j.type === "images" ? "images" : j.type;
          if (jobTypeNorm !== act.type) return false;
          const jobTs = new Date(j.created_at).getTime();
          const actTs = new Date(act.ts).getTime();
          if (jobTs + 5000 < actTs) return false; // job clearly older
          return j.status === "completed" || j.status === "failed";
        });
        if (match) {
          changed = true;
          return {
            ...act,
            status: match.status === "completed" ? "ok" : "error",
            message:
              match.status === "failed"
                ? match.error_message || "Job failed"
                : act.message === "Queued"
                  ? "Completed"
                  : act.message,
          } as CampaignActivityEntry;
        }
        return act;
      });
      return changed ? updated : prev;
    });
  }, [jobs]);
  useEffect(() => {
    if (!jobs.length) return;
    setActivity((prev): CampaignActivityEntry[] => {
      let changed = false;
      const updated = prev.map((act) => {
        if (act.status !== "queued") return act;
        // Prefer direct request_id correlation if job has it
        const matchByRequest = act.requestId
          ? jobs.find(
              (j: any) =>
                (j.request_id || j.requestId) === act.requestId &&
                (j.status === "completed" || j.status === "failed"),
            )
          : null;
        const candidate =
          matchByRequest ||
          jobs.find((j: any) => {
            if (matchByRequest) return false; // already matched
            const jobTypeNorm =
              j.type === "image" || j.type === "images" ? "images" : j.type;
            if (jobTypeNorm !== act.type) return false;
            if (!(j.status === "completed" || j.status === "failed"))
              return false;
            // Heuristic time proximity if no requestId
            try {
              const jobTs = new Date(j.created_at).getTime();
              const actTs = new Date(act.ts).getTime();
              if (jobTs + 5000 < actTs) return false;
            } catch {}
            return true;
          });
        if (candidate) {
          changed = true;
          return {
            ...act,
            status: candidate.status === "completed" ? "ok" : "error",
            message:
              candidate.status === "failed"
                ? candidate.error_message || "Job failed"
                : act.message === "Queued"
                  ? "Completed"
                  : act.message,
          } as CampaignActivityEntry;
        }
        return act;
      });
      return changed ? updated : prev;
    });
  }, [jobs]);

  // Poll media_jobs (owned by user) for latest results to surface completions
  const pollJobs = useCallback(async () => {
    if (jobPolling) return; // guard against overlap
    setJobPolling(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setJobs([]);
        return;
      }
      // Fetch companies owned by user to limit job query (avoids RLS per-row loop)
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .limit(50);
      const companyIds = (companies || []).map((c: any) => c.id);
      if (!companyIds.length) return;
      const { data: jobRows, error } = await supabase
        .from("media_jobs")
        .select(
          "id, created_at, type, status, aspect_ratio, num_images, duration_seconds, completed_at, error_message",
        )
        .in("company_id", companyIds)
        .order("created_at", { ascending: false })
        .limit(MAX_JOB_ROWS);
      if (!error && Array.isArray(jobRows)) setJobs(jobRows);
    } finally {
      setJobPolling(false);
    }
  }, [jobPolling]);

  // Initial fetch (fallback) + realtime subscription replacing polling
  useEffect(() => {
    pollJobs();
    // Realtime channel for media_jobs and media_assets
    const channel = supabase
      .channel("product-campaign-jobs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "media_jobs" },
        (payload: { new: any }) => {
          if (
            ownedCompanyIds.length &&
            !ownedCompanyIds.includes(payload.new.company_id)
          )
            return;
          setJobs((prev) => {
            const exists = prev.find((j) => j.id === payload.new.id);
            const list = exists
              ? prev.map((j) =>
                  j.id === payload.new.id ? { ...j, ...payload.new } : j,
                )
              : [payload.new as any, ...prev];
            return list
              .sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )
              .slice(0, MAX_JOB_ROWS);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "media_jobs" },
        (payload: { new: any }) => {
          if (
            ownedCompanyIds.length &&
            !ownedCompanyIds.includes(payload.new.company_id)
          )
            return;
          setJobs((prev) =>
            prev.map((j) =>
              j.id === payload.new.id ? { ...j, ...payload.new } : j,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "media_assets" },
        (payload: { new: any }) => {
          const row = payload.new as any;
          if (
            ownedCompanyIds.length &&
            !ownedCompanyIds.includes(row.company_id ?? -1)
          )
            return;
          setJobAssets((prev) => {
            const list = prev[row.job_id] || [];
            return {
              ...prev,
              [row.job_id]: [...list, row].sort(
                (a, b) => a.asset_index - b.asset_index,
              ),
            };
          });
        },
      )
      .subscribe();
    (async () => {
      const { data: comps } = await supabase
        .from("companies")
        .select("id")
        .limit(50);
      if (Array.isArray(comps)) setOwnedCompanyIds(comps.map((c: any) => c.id));
    })();
    return () => {
      supabase.removeChannel(channel);
    };
    // We only care if count changes; length token safe to avoid resubscribing for identical content
  }, [pollJobs, ownedCompanyIds]);

  const toggleExpandJob = async (jobId: number) => {
    setExpandedJob((cur) => (cur === jobId ? null : jobId));
    if (!jobAssets[jobId]) {
      const { data: assetsRows } = await supabase
        .from("media_assets")
        .select("id, job_id, asset_index, url, width, height, duration_seconds")
        .eq("job_id", jobId)
        .order("asset_index", { ascending: true });
      if (assetsRows) {
        setJobAssets((prev) => ({ ...prev, [jobId]: assetsRows as any[] }));
      }
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Product Campaign"
        description="Generate product marketing image & video concepts from a unified brief."
        icon={<Megaphone className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant={tab === "images" ? "primary" : "outline"}
              onClick={() => setTab("images")}
            >
              <ImagePlus className="h-4 w-4" /> Images
            </Button>
            <Button
              variant={tab === "video" ? "primary" : "outline"}
              onClick={() => setTab("video")}
            >
              <Video className="h-4 w-4" /> Video
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 max-w-6xl">
        {/* Step 1: Campaign Brief */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Campaign Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Campaign Objective"
                placeholder="Increase launch awareness…"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
              <Input
                label="Aspect Ratio"
                placeholder="16:9"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              />
              <Input
                label="Model"
                placeholder="gpt-4o-image"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <Input
                label="Internal Description (optional)"
                placeholder="Internal notes or context"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {tab === "images" && (
              <div>
                <Textarea
                  label="Image Generation Instructions"
                  placeholder="Describe the creative direction, style, mood…"
                  value={imageInstructions}
                  onChange={(e) => setImageInstructions(e.target.value)}
                  rows={6}
                />
                <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
                  <span>{imageInstructions.length.toLocaleString()} chars</span>
                  {imageInstructions.length > 1500 && (
                    <span className="text-amber-600">
                      Long instructions may increase processing time.
                    </span>
                  )}
                </p>
              </div>
            )}
            {tab === "video" && (
              <div>
                <Textarea
                  label="Video Generation Instructions"
                  placeholder="Describe motion, narrative beats, style, camera movement…"
                  value={videoInstructions}
                  onChange={(e) => setVideoInstructions(e.target.value)}
                  rows={6}
                />
                <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
                  <span>{videoInstructions.length.toLocaleString()} chars</span>
                  {videoInstructions.length > 1500 && (
                    <span className="text-amber-600">
                      Long instructions may increase processing time.
                    </span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Reference Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-600" /> Step 2 — Reference
              Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="campaign-dropzone"
              onDragEnter={onDragEnter}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-gray-400"}`}
            >
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">PNG, JPG, JPEG, WebP</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFilePicker}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload reference images"
                />
              </div>
              {isDragging && (
                <div className="absolute inset-0 rounded-lg bg-brand-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-medium text-brand-700">
                    Release to upload
                  </span>
                </div>
              )}
            </div>
            {assets.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded ({assets.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {assets.map((a) => (
                    <div
                      key={a.id}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={a.publicUrl || a.localUrl}
                        alt={a.file.name}
                        className={`w-full h-24 object-cover ${a.uploading ? "opacity-50" : ""}`}
                      />
                      {a.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      )}
                      {a.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-600/70 text-white text-[10px] p-1 text-center">
                          {a.error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAsset(a.id)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${a.file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              {tab === "images" && (
                <Button
                  onClick={() => runWebhook("generateImages")}
                  disabled={imagesDisabled || submitting}
                  loading={submitting}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  <ImagePlus className="h-4 w-4" /> Step 3 — Generate Images
                </Button>
              )}
              {tab === "video" && (
                <Button
                  onClick={() => runWebhook("generateVideo")}
                  disabled={videoDisabled || submitting}
                  loading={submitting}
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  <Video className="h-4 w-4" /> Step 3 — Generate Video Prompt
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Step 4: Generation Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Step 4 — Generation Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-sm text-gray-500 py-4">
                No jobs yet. Generate images or a video prompt to see live
                status here.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Created</th>
                      <th className="py-2 pr-4 font-medium">Completed</th>
                      <th className="py-2 pr-4 font-medium">Params</th>
                      <th className="py-2 pr-4 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((j) => (
                      <React.Fragment key={j.id}>
                        <tr
                          className="border-b last:border-none cursor-pointer"
                          onClick={() => toggleExpandJob(j.id)}
                        >
                          <td className="py-2 pr-4 capitalize">{j.type}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                j.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : j.status === "failed"
                                    ? "bg-red-100 text-red-700"
                                    : j.status === "processing"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {j.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                            {new Date(j.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                            {j.completed_at
                              ? new Date(j.completed_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )
                              : "—"}
                          </td>
                          <td className="py-2 pr-4 text-xs text-gray-600">
                            {(j.type === "image" || j.type === "images") &&
                              j.num_images && (
                                <span>
                                  {j.num_images} img
                                  {j.num_images > 1 ? "s" : ""}
                                </span>
                              )}
                            {j.type === "video" && j.duration_seconds && (
                              <span>{j.duration_seconds}s</span>
                            )}
                            {j.aspect_ratio && (
                              <span className="ml-2">{j.aspect_ratio}</span>
                            )}
                          </td>
                          <td
                            className="py-2 pr-4 text-xs max-w-[160px] truncate"
                            title={j.error_message || undefined}
                          >
                            {j.error_message || ""}
                          </td>
                        </tr>
                        {expandedJob === j.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="p-4">
                              <div className="space-y-3">
                                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Assets
                                </div>
                                {jobAssets[j.id]?.length ? (
                                  <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                                    {jobAssets[j.id].map((a) => (
                                      <div
                                        key={a.id}
                                        className="group relative border border-gray-200 rounded-md overflow-hidden bg-white"
                                      >
                                        <img
                                          src={a.url}
                                          alt={`Asset ${a.asset_index}`}
                                          className="w-full h-28 object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white px-1 py-0.5 flex justify-between">
                                          <span>#{a.asset_index}</span>
                                          {a.width && a.height && (
                                            <span>
                                              {a.width}×{a.height}
                                            </span>
                                          )}
                                          {a.duration_seconds && (
                                            <span>{a.duration_seconds}s</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">
                                    {j.status === "completed"
                                      ? "No assets stored"
                                      : "Waiting for assets..."}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 5: Recent Activity */}
        {activity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5 — Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-gray-500">
                    <tr className="border-b">
                      <th className="py-2 pr-3 font-medium">Time</th>
                      <th className="py-2 pr-3 font-medium">Operation</th>
                      <th className="py-2 pr-3 font-medium">Instr Chars</th>
                      <th className="py-2 pr-3 font-medium">Assets</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Req ID</th>
                      <th className="py-2 pr-3 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.slice(0, 50).map((a) => (
                      <tr key={a.id} className="border-b last:border-none">
                        <td className="py-1 pr-3 whitespace-nowrap">
                          {new Date(a.ts).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-1 pr-3 capitalize">{a.type}</td>
                        <td className="py-1 pr-3 text-center">
                          {a.scriptChars ?? "-"}
                        </td>
                        <td className="py-1 pr-3 text-center">
                          {a.assetCount}
                        </td>
                        <td className="py-1 pr-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${a.status === "queued" ? "bg-amber-100 text-amber-700" : a.status === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td
                          className="py-1 pr-3 max-w-[120px] truncate"
                          title={a.requestId}
                        >
                          {a.requestId || ""}
                        </td>
                        <td
                          className="py-1 pr-3 max-w-[220px] truncate"
                          title={a.message}
                        >
                          {a.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
