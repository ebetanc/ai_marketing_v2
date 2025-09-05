import React from "react";
import { Video, Upload, Film, RefreshCw } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { n8nCall, VIDEO_AVATAR_IDENTIFIER } from "../lib/n8n";
import {
  uploadFileToSupabaseStorage,
  isSupabaseConfigured,
} from "../lib/supabase";

// UI + contract aligned with avatar-v1 workflow (identifier: videoAvatar)
export function CreateVideoAvatar() {
  useDocumentTitle("AI Video with Avatar — Lighting");
  const [script, setScript] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{
    done: number;
    total: number;
  }>({ done: 0, total: 0 });
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleAttachImages(files: FileList | null) {
    if (!files || !files.length) return;
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured (missing env). Cannot upload images. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setUploading(true);
    setError(null);
    const incoming = Array.from(files);
    setUploadProgress({ done: 0, total: incoming.length });
    try {
      const uploaded: string[] = [];
      // Parallel uploads with limited concurrency (to avoid rate spikes)
      const concurrency = 3;
      let index = 0;
      async function worker() {
        while (index < incoming.length) {
          const current = incoming[index++];
          const path = `avatar/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}-${current.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          try {
            const publicUrl = await uploadFileToSupabaseStorage(
              current,
              "media",
              path,
            );
            uploaded.push(publicUrl);
          } catch (e: any) {
            console.error("Upload failed", current.name, e);
            setError(
              (prev) =>
                prev || `Failed uploading one or more images: ${e?.message}`,
            );
          } finally {
            setUploadProgress((p) => ({ done: p.done + 1, total: p.total }));
          }
        }
      }
      const workers = Array.from({
        length: Math.min(concurrency, incoming.length),
      }).map(() => worker());
      await Promise.all(workers);
      if (uploaded.length) {
        setImages((prev) => [...prev, ...uploaded]);
        // Notify n8n that images are attached (remote public URLs now)
        await n8nCall(
          VIDEO_AVATAR_IDENTIFIER,
          {
            operation: "attach_images",
            images: uploaded,
            script_present: Boolean(script.trim()),
            pendingUploads: 0,
          },
          { path: undefined },
        );
      }
    } catch (e: any) {
      setError(e?.message || "Failed attaching images");
    } finally {
      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  }

  async function handleGenerate() {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const resp = await n8nCall(VIDEO_AVATAR_IDENTIFIER, {
        operation: "generateVideo",
        script: script.trim(),
        images: images.length > 0 ? images : undefined,
        image_count: images.length || undefined,
      });
      
      setResult(resp.data || resp.rawText || { ok: resp.ok });
      if (!resp.ok) setError("n8n returned an error (see console)");
    } catch (e: any) {
      console.error("Video generation error:", e);
      setError(e?.message || "Network request failed. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="AI Video with Avatar"
        description="Generate an avatar video from a script and optional reference images."
        icon={<Video className="h-5 w-5" />}
      />
      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <Textarea
            label="Script"
            placeholder="Paste or write your video script here..."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            description="Minimum few sentences. This will be sent to n8n (operation generateVideo)."
            className="min-h-[200px]"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
              >
                <Upload className="h-4 w-4" /> Add Images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleAttachImages(e.target.files)}
              />
              {images.length > 0 && (
                <span className="text-sm text-gray-600">
                  {images.length} image{images.length > 1 ? "s" : ""} attached
                </span>
              )}
              {uploading && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Uploading{" "}
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              )}
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((u, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={u}
                      alt="preview"
                      className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              loading={sending}
              disabled={!script.trim() || sending}
            >
              <Film className="h-4 w-4" /> Generate Video
            </Button>
            <Button
              variant="secondary"
              disabled={sending || uploading}
              onClick={() => {
                setScript("");
                setImages([]);
                setResult(null);
                setError(null);
              }}
            >
              Reset
            </Button>
          </div>
          {error && (
            <div className="text-sm text-red-600 font-medium">{error}</div>
          )}
          {result && (
            <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-xl overflow-auto max-h-72">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Workflow Contract
            </h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
              <li>identifier: videoAvatar</li>
              <li>operation: generateVideo | attach_images</li>
              <li>script (generateVideo)</li>
              <li>images[] (attach_images)</li>
              <li>meta.contract: avatar-v1</li>
            </ul>
            <p className="text-xs text-gray-500">
              This UI calls n8n webhooks via unified helper ensuring request_id
              & contract are attached automatically.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default CreateVideoAvatar;
