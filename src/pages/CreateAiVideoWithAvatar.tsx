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
import { N8N_VIDEO_AVATAR_WEBHOOK_PATH, postToN8n } from "../lib/n8n";
import {
  validateAndNormalizeVideoAvatarPayload,
  VIDEO_AVATAR_IDENTIFIER,
} from "../lib/n8nAvatarContract";
import { supabase } from "../lib/supabase";
import { uploadFileToSupabaseStorage } from "../lib/supabase";

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

export function CreateVideoAvatar() {
  useDocumentTitle("Create AI Videos with Avatar — Lighting");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [videoScript, setVideoScript] = useState("");
  const { push } = useToast();
  const [generating, setGenerating] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreviewItem[]>([]);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

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
          "media",
          `avatar-input/${tempId}-${imageToUpload.name}`,
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

  const handleGenerateVideo = async () => {
    if (!videoScript.trim()) {
      push({ message: "Enter a script first", variant: "warning" });
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
      const res = await postToN8n(VIDEO_AVATAR_IDENTIFIER, normalized!, {
        path: N8N_VIDEO_AVATAR_WEBHOOK_PATH,
      });
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      push({ message: "Video generation webhook sent", variant: "success" });
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
      setTimeout(() => {
        setVideoPreviews((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: "ready" } : v)),
        );
      }, 1500);
    } catch (err: any) {
      push({
        message: err?.message || "Failed to queue video",
        variant: "error",
      });
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
      const res = await postToN8n(
        VIDEO_AVATAR_IDENTIFIER,
        normalized || attachPayload,
        {
          path: N8N_VIDEO_AVATAR_WEBHOOK_PATH,
        },
      );
      if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      push({
        message: `${uploaded.length} image(s) attached`,
        variant: "success",
      });
      setAttachedImages(uploaded as string[]);
    } catch (err: any) {
      push({
        message: err?.message || "Failed to attach images",
        variant: "error",
      });
    } finally {
      setAttaching(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Create Video with AI Avatar"
        description="Turn existing video links into reusable AI avatars."
        icon={<Video className="h-5 w-5" />}
        actions={null}
      />

      <div className="max-w-4xl space-y-8">
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
      </div>
    </PageContainer>
  );
}
