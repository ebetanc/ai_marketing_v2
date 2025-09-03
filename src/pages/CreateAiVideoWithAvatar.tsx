import { Loader2, Play, Plus, Upload, Video, X } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/Toast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { N8N_VIDEO_AVATAR_WEBHOOK_PATH, postToN8nWithRetry } from "../lib/n8n";
import {
  validateAndNormalizeVideoAvatarPayload,
  VIDEO_AVATAR_IDENTIFIER,
} from "../lib/n8nAvatarContract";
import { supabase } from "../lib/supabase";
import { uploadFileToSupabaseStorage } from "../lib/supabase";
import { MEDIA_BUCKET, avatarInputPath } from "../lib/mediaBuckets";

interface UploadedImage {
  id: string;
  file: File;
  localUrl: string;
  supabaseUrl: string | null;
  loading: boolean;
  error: string | null;
}

interface VideoPreviewItem {
  id: string;
  script: string;
  status: "processing" | "ready" | "error";
  createdAt: string;
  thumbnailUrl: string | null;
  error?: string;
}

interface AvatarActivityEntry {
  id: string;
  ts: string;
  op: "attach_images" | "generateVideo";
  scriptChars?: number;
  imagesAttached?: number;
  requestId?: string;
  status: "queued" | "error" | "ok";
  message?: string;
}

export function CreateVideoAvatar() {
  useDocumentTitle("Create AI Videos with Avatar — Lighting");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [videoScript, setVideoScript] = useState(() => {
    try {
      return localStorage.getItem("avatar:script") || "";
    } catch {
      return "";
    }
  });
  const { push, remove } = useToast();
  const [generating, setGenerating] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreviewItem[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [activity, setActivity] = useState<AvatarActivityEntry[]>(() => {
    try {
      const raw = localStorage.getItem("avatar:activity");
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  // Realtime media job + asset tracking (video jobs only)
  const [jobs, setJobs] = useState<any[]>([]);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [jobAssets, setJobAssets] = useState<Record<number, any[]>>({});
  const MAX_JOB_ROWS = 30;

  useEffect(() => {
    try {
      localStorage.setItem(
        "avatar:activity",
        JSON.stringify(activity.slice(0, 50)),
      );
    } catch {}
  }, [activity]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const uploadImage = useCallback(
    async (imageToUpload: File, tempId: string) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === tempId ? { ...img, loading: true, error: null } : img,
        ),
      );
      try {
        const publicUrl = await uploadFileToSupabaseStorage(
          imageToUpload,
          MEDIA_BUCKET,
          avatarInputPath(tempId, imageToUpload.name),
        );
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? { ...img, supabaseUrl: publicUrl, loading: false }
              : img,
          ),
        );
        push({
          message: `Image "${imageToUpload.name}" uploaded!`,
          variant: "success",
        });
      } catch (err: any) {
        console.error("Upload error:", err);
        setImages((prev) =>
          prev.map((img) =>
            img.id === tempId
              ? {
                  ...img,
                  loading: false,
                  error: err.message || "Upload failed",
                }
              : img,
          ),
        );
        push({
          message: `Failed to upload "${imageToUpload.name}": ${err.message || "Unknown error"}`,
          variant: "error",
        });
      }
    },
    [push],
  );

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newImages: UploadedImage[] = [];
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) {
          push({
            message: `Skipping non-image file: ${file.name}`,
            variant: "warning",
          });
          continue;
        }
        const tempId = crypto.randomUUID();
        newImages.push({
          id: tempId,
          file,
          localUrl: URL.createObjectURL(file),
          supabaseUrl: null,
          loading: false,
          error: null,
        });
        uploadImage(file, tempId);
      }
      setImages((prev) => [...prev, ...newImages]);
    },
    [push, uploadImage],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if ((e.target as HTMLElement).closest("#image-dropzone")) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    } else {
      push({
        title: "No files found",
        message: "Please drop image files.",
        variant: "warning",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const removeImage = (idToRemove: string) => {
    setImages((prev) => {
      const copy = [...prev];
      const indexToRemove = prev.findIndex((img) => img.id === idToRemove);

      if (indexToRemove === -1) return prev;

      const [removed] = copy.splice(indexToRemove, 1);
      if (removed?.localUrl) URL.revokeObjectURL(removed.localUrl);
      return copy;
    });
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.localUrl) URL.revokeObjectURL(img.localUrl);
      });
    };
  }, [images]);

  // Persist script (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem("avatar:script", videoScript);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [videoScript]);

  const moveImage = (id: string, direction: -1 | 1) => {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [img] = copy.splice(idx, 1);
      copy.splice(target, 0, img);
      return copy;
    });
  };

  const clearAllImages = () => {
    images.forEach((i) => i.localUrl && URL.revokeObjectURL(i.localUrl));
    setImages([]);
    push({ message: "All images cleared", variant: "info" });
  };

  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) {
      push({ message: "Enter a script first", variant: "warning" });
      return;
    }
    if (images.length < 3) {
      push({
        message: "Upload at least 3 images for best avatar quality",
        variant: "warning",
      });
      return;
    }
    setGenerating(true);
    try {
      // Fetch current user id (nullable if not authenticated)
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      const draftPayload = {
        identifier: VIDEO_AVATAR_IDENTIFIER,
        operation: "generateVideo" as const,
        script: videoScript.trim(),
        image_count: images.length,
        user_id: userId,
        meta: {
          user_id: userId,
          source: "app",
          ts: new Date().toISOString(),
          contract: "avatar-v1",
        },
      };
      const { ok, errors, warnings, normalized } =
        validateAndNormalizeVideoAvatarPayload(draftPayload);
      if (warnings.length) console.warn("[avatar-contract]", warnings);
      if (!ok) {
        push({ message: errors.join("; "), variant: "error" });
        setGenerating(false);
        return;
      }
      let attemptToast: string | null = null;
      const baseMsg = "Queueing video generation";
      const res = await postToN8nWithRetry(
        VIDEO_AVATAR_IDENTIFIER,
        normalized!,
        {
          path: N8N_VIDEO_AVATAR_WEBHOOK_PATH,
          attempts: 4,
          onAttempt: ({ attempt, attempts, lastStatus, lastError }) => {
            const suffix = lastStatus
              ? ` (retry after ${lastStatus})`
              : lastError
                ? " (retry after error)"
                : "";
            if (attemptToast) remove(attemptToast);
            attemptToast = push({
              message: `${baseMsg} (attempt ${attempt}/${attempts})${suffix}`,
              variant: attempt === attempts ? "warning" : "info",
              duration: 45000,
            });
          },
        },
      );
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      const requestId = (res as any).requestId as string | undefined;
      push({ message: "Video generation queued", variant: "success" });
      const id = crypto.randomUUID();
      const firstImage =
        images.find((i) => i.supabaseUrl)?.supabaseUrl ||
        images[0]?.localUrl ||
        null;
      setVideoPreviews((prev) => [
        {
          id,
          script: videoScript.trim(),
          status: "processing",
          createdAt: new Date().toISOString(),
          thumbnailUrl: firstImage,
        },
        ...prev,
      ]);
      setActivity((prev) => [
        {
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          op: "generateVideo",
          scriptChars: videoScript.trim().length,
          imagesAttached: attachedImages.length,
          requestId,
          status: "queued",
          message: "Queued",
        },
        ...prev,
      ]);
      setTimeout(() => {
        setVideoPreviews((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: "ready" } : v)),
        );
      }, 1500);
    } catch (err: any) {
      const detail = err?.body?.message || err?.body?.error || err?.message;
      push({
        message: (detail || "Failed to queue video").toString().slice(0, 140),
        variant: "error",
      });
      setActivity((prev) => [
        {
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          op: "generateVideo",
          scriptChars: videoScript.trim().length,
          imagesAttached: attachedImages.length,
          status: "error",
          message: (detail || "Failed to queue video").toString().slice(0, 140),
        },
        ...prev,
      ]);
    } finally {
      setGenerating(false);
    }
  };

  const handleAttachImages = async () => {
    if (!images.length) {
      push({ message: "Upload images first", variant: "warning" });
      return;
    }
    setAttaching(true);
    try {
      const uploaded = images
        .filter((i) => i.supabaseUrl)
        .map((i) => i.supabaseUrl!)
        .filter(Boolean);
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      const attachPayload = {
        identifier: VIDEO_AVATAR_IDENTIFIER,
        operation: "attach_images" as const,
        script_present: !!videoScript.trim(),
        images: uploaded,
        pendingUploads: images.filter((i) => i.loading).length,
        user_id: userId,
        meta: {
          user_id: userId,
          source: "app",
          ts: new Date().toISOString(),
          contract: "avatar-v1",
        },
      };
      const { ok, errors, warnings, normalized } =
        validateAndNormalizeVideoAvatarPayload(attachPayload as any);
      if (warnings.length) {
        console.warn(
          `[avatar-contract] Warnings for attach_images:\n - ${warnings.join(
            "\n - ",
          )}`,
        );
      }
      if (!ok) {
        push({ message: errors.join("; "), variant: "error" });
        setAttaching(false);
        return;
      }
      let attemptToast: string | null = null;
      const baseMsg = "Attaching images";
      const res = await postToN8nWithRetry(
        VIDEO_AVATAR_IDENTIFIER,
        normalized || attachPayload,
        {
          path: N8N_VIDEO_AVATAR_WEBHOOK_PATH,
          attempts: 4,
          onAttempt: ({ attempt, attempts, lastStatus, lastError }) => {
            const suffix = lastStatus
              ? ` (retry after ${lastStatus})`
              : lastError
                ? " (retry after error)"
                : "";
            if (attemptToast) remove(attemptToast);
            attemptToast = push({
              message: `${baseMsg} (attempt ${attempt}/${attempts})${suffix}`,
              variant: attempt === attempts ? "warning" : "info",
              duration: 45000,
            });
          },
        },
      );
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      const requestId = (res as any).requestId as string | undefined;
      push({
        message: `${uploaded.length} image(s) attached`,
        variant: "success",
      });
      setAttachedImages(uploaded as string[]);
      setActivity((prev) => [
        {
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          op: "attach_images",
          imagesAttached: uploaded.length,
          scriptChars: videoScript.trim().length || undefined,
          requestId,
          status: "queued",
          message: "Queued",
        },
        ...prev,
      ]);
    } catch (err: any) {
      const detail = err?.body?.message || err?.body?.error || err?.message;
      push({
        message: (detail || "Failed to attach images").toString().slice(0, 140),
        variant: "error",
      });
      setActivity((prev) => [
        {
          id: crypto.randomUUID(),
          ts: new Date().toISOString(),
          op: "attach_images",
          imagesAttached: images.filter((i) => i.supabaseUrl).length,
          scriptChars: videoScript.trim().length || undefined,
          status: "error",
          message: (detail || "Failed to attach images")
            .toString()
            .slice(0, 140),
        },
        ...prev,
      ]);
    } finally {
      setAttaching(false);
    }
  };

  // Realtime subscription for video jobs and assets
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;
      // Initial fetch: user's companies -> jobs (video only)
      const { data: companies } = await supabase
        .from("companies")
        .select("id")
        .limit(50);
      const companyIds = (companies || []).map((c: any) => c.id);
      if (companyIds.length) {
        const { data: initial } = await supabase
          .from("media_jobs")
          .select(
            "id, created_at, type, status, aspect_ratio, num_images, duration_seconds, completed_at, error_message",
          )
          .in("company_id", companyIds)
          .eq("type", "video")
          .order("created_at", { ascending: false })
          .limit(MAX_JOB_ROWS);
        if (initial) setJobs(initial);
      }
    })();
    const channel = supabase
      .channel("avatar-video-jobs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "media_jobs" },
        (payload: { new: any }) => {
          if (payload.new.type !== "video") return;
          setJobs((prev) => {
            const list = [payload.new as any, ...prev];
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
          if (payload.new.type !== "video") return;
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
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleExpandJob = async (jobId: number) => {
    setExpandedJob((cur) => (cur === jobId ? null : jobId));
    if (!jobAssets[jobId]) {
      const { data: assetsRows } = await supabase
        .from("media_assets")
        .select("id, job_id, asset_index, url, width, height, duration_seconds")
        .eq("job_id", jobId)
        .order("asset_index", { ascending: true });
      if (assetsRows)
        setJobAssets((prev) => ({ ...prev, [jobId]: assetsRows as any[] }));
    }
  };

  // Promote queued activity entries to ok/error using request_id if available, fallback to first completed/failed video job
  useEffect(() => {
    if (!jobs.length) return;
    setActivity((prev) => {
      let changed = false;
      const updated = prev.map((act) => {
        if (act.status !== "queued") return act;
        if (act.op !== "generateVideo") return act; // only video jobs correlate
        const matchByRequest = act.requestId
          ? jobs.find(
              (j: any) =>
                (j.request_id || j.requestId) === act.requestId &&
                (j.status === "completed" || j.status === "failed"),
            )
          : null;
        const match =
          matchByRequest ||
          jobs.find(
            (j: any) =>
              j.type === "video" &&
              (j.status === "completed" || j.status === "failed"),
          );
        if (!match) return act;
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
        } as typeof act;
      });
      return changed ? updated : prev;
    });
  }, [jobs]);

  return (
    <PageContainer>
      <PageHeader
        title="Create Video with AI Avatar"
        description="Turn existing video links into reusable AI avatars."
        icon={<Video className="h-5 w-5" />}
        actions={null}
      />

      <div className="max-w-6xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-brand-600" />
              Video Script
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              label="Video Script"
              placeholder="Enter the script for your video avatar..."
              value={videoScript}
              onChange={(e) => setVideoScript(e.target.value)}
              rows={8}
              description="Write the dialogue or narration for your video avatar."
            />
            <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-2">
              <span>{videoScript.length.toLocaleString()} chars</span>
              {videoScript.length > 1500 && (
                <span className="text-amber-600">
                  Long scripts may take longer to process.
                </span>
              )}
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleGenerateVideo}
                disabled={!videoScript.trim() || generating}
                loading={generating}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Play className="h-4 w-4" /> Generate Video
              </Button>
            </div>
          </CardContent>
        </Card>
        {jobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Video Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600 border-b">
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Created</th>
                      <th className="py-2 pr-4 font-medium">Completed</th>
                      <th className="py-2 pr-4 font-medium">Duration</th>
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
                          <td className="py-2 pr-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${j.status === "completed" ? "bg-emerald-100 text-emerald-700" : j.status === "failed" ? "bg-red-100 text-red-700" : j.status === "processing" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
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
                            {j.duration_seconds
                              ? `${j.duration_seconds}s`
                              : "—"}
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
                            <td colSpan={5} className="p-4">
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-600" />
              Upload Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="image-dropzone"
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop images here or click to upload
                  </p>
                  <p className="text-sm text-gray-600">
                    Support for PNG, JPG, JPEG, WebP files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload images"
                />
              </div>
              {isDragging && (
                <div className="absolute inset-0 rounded-lg bg-brand-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-medium text-brand-700">
                    Release to upload images
                  </span>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded Images ({images.length})
                </h3>
                <p className="text-[11px] text-gray-500 mb-3 flex flex-wrap gap-2">
                  <span>Recommended: 6–12 varied facial images.</span>
                  {images.length > 15 && (
                    <span className="text-amber-600">
                      Large sets can slow processing.
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                    >
                      <img
                        src={img.supabaseUrl || img.localUrl}
                        alt={`Upload ${img.file.name}`}
                        className={`w-full h-24 object-cover ${img.loading ? "opacity-50" : ""}`}
                      />
                      {img.loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/70 text-white text-xs p-1 text-center">
                          Error: {img.error}
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveImage(img.id, -1)}
                          className="bg-white/70 hover:bg-white text-[10px] px-1 rounded shadow disabled:opacity-30"
                          disabled={images[0].id === img.id}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(img.id, 1)}
                          className="bg-white/70 hover:bg-white text-[10px] px-1 rounded shadow disabled:opacity-30"
                          disabled={images[images.length - 1].id === img.id}
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove image ${img.file.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <div className="text-[11px] text-gray-500">
                {images.length === 0 &&
                  "Upload clear, front-facing images with varied expressions."}
                {images.length > 0 &&
                  `${images.length} image${images.length === 1 ? "" : "s"} ready`}
              </div>
              <div className="flex gap-2">
                {images.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearAllImages}
                    disabled={attaching || generating}
                  >
                    <X className="h-4 w-4" /> Clear All
                  </Button>
                )}
                <Button
                  onClick={handleAttachImages}
                  disabled={
                    !images.length || attaching || images.some((i) => i.loading)
                  }
                  loading={attaching}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" /> Add Images to Video
                </Button>
              </div>
            </div>
            {attachedImages.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-brand-600/10 text-brand-700 text-xs font-semibold">
                    ★
                  </span>
                  Attached Image Set ({attachedImages.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {attachedImages.map((url) => (
                    <div
                      key={url}
                      className="relative rounded-lg overflow-hidden border border-gray-200 bg-white group"
                    >
                      <img
                        src={url}
                        alt="Attached"
                        className="w-full h-20 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {videoPreviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-brand-600" />
                Generated Videos ({videoPreviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                {videoPreviews.map((v) => (
                  <div
                    key={v.id}
                    className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-900 text-white group"
                  >
                    <div className="aspect-video w-full bg-black/40 flex items-center justify-center relative">
                      {v.thumbnailUrl ? (
                        <img
                          src={v.thumbnailUrl}
                          alt="Thumbnail"
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                        />
                      ) : (
                        <div className="text-xs text-gray-400">
                          No thumbnail
                        </div>
                      )}
                      <button
                        type="button"
                        className="relative z-10 inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium text-white border border-white/20 hover:bg-white/20"
                        disabled={v.status !== "ready"}
                      >
                        {v.status === "processing" ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />{" "}
                            Processing
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Play
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-medium line-clamp-2 text-gray-100/90">
                        {v.script}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>
                          {v.status === "ready" ? "Ready" : "Processing..."}
                        </span>
                        <time dateTime={v.createdAt}>
                          {new Date(v.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {activity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-gray-500">
                    <tr className="border-b">
                      <th className="py-2 pr-3 font-medium">Time</th>
                      <th className="py-2 pr-3 font-medium">Operation</th>
                      <th className="py-2 pr-3 font-medium">Script Chars</th>
                      <th className="py-2 pr-3 font-medium">Images</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Req ID</th>
                      <th className="py-2 pr-3 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((a) => (
                      <tr key={a.id} className="border-b last:border-none">
                        <td className="py-1 pr-3 whitespace-nowrap">
                          {new Date(a.ts).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-1 pr-3 capitalize">{a.op}</td>
                        <td className="py-1 pr-3 text-center">
                          {a.scriptChars ?? "-"}
                        </td>
                        <td className="py-1 pr-3 text-center">
                          {a.imagesAttached ?? "-"}
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
