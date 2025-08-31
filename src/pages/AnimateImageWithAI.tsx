import {
  Check,
  Clipboard,
  Download,
  ExternalLink,
  History,
  Maximize2,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import React from "react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "../components/ui/Modal";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/Toast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  generateVeo3Video,
  getVeo3Job,
  getVeo3Video1080p,
  pollKieJob,
} from "../lib/kie";

/**
 * Animate Image with AI
 * Placeholder page – extend with animation job creation similar to EditImageWithAI when backend ready.
 */
export function AnimateImageWithAI() {
  useDocumentTitle("Animate Image with AI — Lighting");
  // Veo3-only variant (prompt → video)
  const [prompt, setPrompt] = React.useState("");
  const [aspect, setAspect] = React.useState<"16:9" | "9:16">("16:9");
  const [model, setModel] = React.useState<"veo3" | "veo3_fast">("veo3_fast");
  const [jobStatus, setJobStatus] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = React.useState<string | null>(null);
  const [allUrls, setAllUrls] = React.useState<string[] | null>(null);
  const [fetchingHD, setFetchingHD] = React.useState(false);
  const [jobId, setJobId] = React.useState<string | null>(null);
  const [refImageUrl, setRefImageUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);
  const [videoLoading, setVideoLoading] = React.useState(false);
  // Consider a result present as soon as we have a URL, regardless of status wording
  const hasResult = React.useMemo(() => !!resultUrl, [resultUrl]);
  const statusLabel = React.useMemo(() => {
    if (!jobStatus) return "Generate video";
    if (jobStatus === "completed") return "Completed";
    return jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1);
  }, [jobStatus]);
  const abortRef = React.useRef<AbortController | null>(null);
  // Always show preview on completion (removed gating flag)
  const resultHeadingRef = React.useRef<HTMLHeadingElement | null>(null);
  const statusLiveRef = React.useRef<HTMLDivElement | null>(null);
  interface HistoryItem {
    id: string; // job id
    created: number;
    prompt: string;
    model: string;
    aspect: string;
    watermark?: string;
    refImageUrl?: string;
    videoUrl: string;
    allUrls?: string[];
  }
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const { push } = useToast();

  // (Removed image upload – Veo3 prompt only)

  function reset() {
    setPrompt("");
    setResultUrl(null);
    setAspect("16:9");
    setModel("veo3_fast");
    setAllUrls(null);
    setJobId(null);
    setRefImageUrl("");
    setJobStatus(null);
    setPreviewVideo(null);
    abortRef.current?.abort();
  }

  function addToHistory(params: {
    jobId: string;
    videoUrl: string;
    allUrls?: string[];
  }) {
    setHistory((prev) => {
      if (prev.some((h) => h.id === params.jobId)) {
        // update existing (e.g., adding allUrls after HD fetch)
        return prev.map((h) =>
          h.id === params.jobId
            ? {
                ...h,
                videoUrl: params.videoUrl,
                allUrls: params.allUrls ?? h.allUrls,
              }
            : h,
        );
      }
      const item: HistoryItem = {
        id: params.jobId,
        created: Date.now(),
        prompt: prompt.trim(),
        model,
        aspect,
        // watermark removed
        refImageUrl: refImageUrl || undefined,
        videoUrl: params.videoUrl,
        allUrls: params.allUrls,
      };
      return [item, ...prev].slice(0, 20); // cap at 20 for memory
    });
  }

  function copyPrompt() {
    if (!prompt.trim()) return;
    navigator.clipboard.writeText(prompt.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function downloadVideo(url: string, filename?: string) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const name = filename || `veo3_${jobId || Date.now()}.mp4`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
      push({ message: "Download started", variant: "success" });
    } catch (e: any) {
      // Fallback: open in new tab if fetch blocked (CORS)
      try {
        window.open(url, "_blank");
        push({ message: "Opened in new tab (CORS)", variant: "info" });
      } catch {
        push({ message: e?.message || "Download failed", variant: "error" });
      }
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      push({ message: "Enter a motion prompt", variant: "error" });
      return;
    }
    setSubmitting(true);
    setResultUrl(null);
    setVideoLoading(false);
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      {
        setJobStatus("queued");
        const job = await generateVeo3Video({
          prompt: prompt.trim(),
          aspectRatio: aspect,
          model,
          // fallback removed
          imageUrls: refImageUrl.trim() ? [refImageUrl.trim()] : undefined,
          signal: controller.signal,
        });
        setJobId(job.job_id || null);
        if (job.video_url) {
          setResultUrl(job.video_url);
          setPreviewVideo(job.video_url);
          setVideoLoading(true);
          setJobStatus("completed");
          if (job.job_id)
            addToHistory({
              jobId: job.job_id,
              videoUrl: job.video_url,
              allUrls: job.video_urls,
            });
          push({
            title: "Veo3 complete",
            message: "Video ready",
            variant: "success",
          });
        } else if (job.job_id) {
          try {
            const final = await pollKieJob({
              getStatus: async () => {
                try {
                  return await getVeo3Job(job.job_id!);
                } catch (_e) {
                  return { status: "failed" } as any;
                }
              },
              intervalMs: 3000,
              timeoutMs: 600000,
              signal: controller.signal,
            });
            setJobStatus(final.status || null);
            if (final.video_url) {
              setResultUrl(final.video_url);
              setPreviewVideo(final.video_url);
              setVideoLoading(true);
              if (final.video_urls?.length) setAllUrls(final.video_urls);
              if (job.job_id)
                addToHistory({
                  jobId: job.job_id,
                  videoUrl: final.video_url,
                  allUrls: final.video_urls,
                });
              if (final.status === "completed") {
                push({
                  title: "Veo3 complete",
                  message: "Video ready",
                  variant: "success",
                });
              } else if (final.status === "failed") {
                push({ message: "Veo3 job failed", variant: "error" });
              } else {
                push({ message: `Job ${final.status}`, variant: "info" });
              }
            } else if (final.status === "failed") {
              push({ message: "Veo3 job failed", variant: "error" });
            }
          } catch (e: any) {
            if (e?.message === "Polling aborted") {
              setJobStatus("cancelled");
              push({ message: "Generation cancelled", variant: "info" });
            } else {
              setJobStatus("failed");
              push({
                message: e?.message || "Polling failed",
                variant: "error",
              });
            }
          }
        } else {
          setJobStatus(job.status || null);
          push({ message: job.status || "Queued", variant: "info" });
        }
      }
    } catch (err: any) {
      push({ message: err?.message || "Animation failed", variant: "error" });
    } finally {
      setSubmitting(false);
      abortRef.current = null;
    }
  }

  // Ensure preview opens if result becomes available through some future pathway
  React.useEffect(() => {
    if (resultUrl && jobStatus === "completed" && !previewVideo) {
      setPreviewVideo(resultUrl);
    }
  }, [resultUrl, jobStatus, previewVideo]);

  // Reset videoLoading when previewVideo changes
  React.useEffect(() => {
    if (previewVideo) {
      setVideoLoading(true);
    }
  }, [previewVideo]);

  return (
    <PageContainer>
      <PageHeader
        title="Animate Image with AI"
        description="Generate a short cinematic AI video from a rich motion prompt (Veo3)."
        icon={<Wand2 className="h-5 w-5" />}
        actions={null}
      />
      {history.length > 1 && (
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                Recent
              </span>
              Recent generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>Latest session results</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHistory((h) =>
                      [...h].sort((a, b) => b.created - a.created),
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50"
                >
                  <History className="h-3 w-3" /> Sort
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {history
                .filter((h) => h.id !== jobId)
                .slice(0, 8)
                .map((h) => (
                  <div
                    key={h.id}
                    className="group border rounded-md bg-white/60 backdrop-blur-sm p-2 flex flex-col gap-2"
                  >
                    <div className="relative aspect-video w-full rounded-sm overflow-hidden bg-black">
                      <video
                        src={h.videoUrl}
                        className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 cursor-pointer"
                        onClick={() => {
                          setPreviewVideo(h.videoUrl);
                        }}
                        muted
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-h-[46px]">
                      <span
                        className="text-[10px] font-medium text-gray-800 line-clamp-2"
                        title={h.prompt}
                      >
                        {h.prompt}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-gray-400">
                        {h.model} • {h.aspect} •{" "}
                        {new Date(h.created).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setPrompt(h.prompt);
                          setModel(h.model as any);
                          setAspect(h.aspect as any);
                          if (h.refImageUrl) setRefImageUrl(h.refImageUrl);
                          push({ message: "Loaded", variant: "success" });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" /> Reuse
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(h.videoUrl);
                          push({ message: "URL copied", variant: "success" });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] hover:bg-gray-50"
                      >
                        <Clipboard className="h-3 w-3" /> Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(h.videoUrl, "_blank")}
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] hover:bg-gray-50"
                      >
                        <ExternalLink className="h-3 w-3" /> Open
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadVideo(h.videoUrl, `veo3_${h.id}.mp4`)
                        }
                        className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] hover:bg-gray-50"
                      >
                        <Download className="h-3 w-3" /> Save
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
      <form
        onSubmit={handleGenerate}
        className="max-w-5xl space-y-10"
        aria-busy={submitting ? "true" : "false"}
        aria-describedby="job-status-live"
      >
        {/* Live region for async job status updates */}
        <div
          id="job-status-live"
          ref={statusLiveRef}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {jobStatus ? `Status: ${jobStatus}` : ""}
        </div>
        {/* Unified Compose Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                1
              </span>
              Compose
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Left: Prompt */}
              <div className="lg:col-span-2 relative">
                <Textarea
                  label="Prompt *"
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Subtle natural blinking, gentle hair sway, soft handheld camera drift, cinematic lighting"
                  rows={9}
                  name="prompt"
                  aria-describedby="prompt-help"
                  description="Describe scene, subjects, motion, camera moves, lighting & mood. Avoid identity changes."
                />
                <p id="prompt-help" className="sr-only">
                  Describe scene, subjects, motion, camera moves, lighting and
                  mood. Avoid identity changes.
                </p>
                <div className="absolute right-2 -top-8 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {prompt.length} chars
                  </span>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    disabled={!prompt.trim()}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    aria-label="Copy prompt"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-3 w-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* Right: Tips */}
              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-gray-700">Tips</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Keep motions subtle for realism.</li>
                    <li>Mention camera style (pan, drift, static).</li>
                    <li>Avoid identity changes.</li>
                    <li>
                      Add lighting adjectives (soft key light, warm sunlight).
                    </li>
                    <li>Include pacing: slow drift, gentle pan, static.</li>
                  </ul>
                </div>
                <div className="text-[11px] text-gray-500">
                  Model: {model} • Aspect: {aspect}
                </div>
              </div>
            </div>
            {/* Inline controls */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-6 md:col-span-2">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Model */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium text-gray-600">
                      Model
                    </span>
                    <div className="inline-flex rounded-md shadow-sm isolate border overflow-hidden">
                      {(
                        [
                          { id: "veo3_fast", label: "Fast", desc: "Quicker" },
                          {
                            id: "veo3",
                            label: "Quality",
                            desc: "Higher fidelity",
                          },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModel(m.id)}
                          className={
                            `relative px-4 py-2 text-[11px] font-medium flex flex-col items-start gap-0.5 min-w-[110px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition ` +
                            (model === m.id
                              ? "bg-brand-600 text-white"
                              : "bg-white hover:bg-gray-50 text-gray-700")
                          }
                          aria-pressed={model === m.id}
                        >
                          <span>{m.label}</span>
                          <span
                            className={`text-[10px] leading-tight ${model === m.id ? "text-white/80" : "text-gray-400"}`}
                          >
                            {m.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Aspect */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium text-gray-600">
                      Aspect ratio
                    </span>
                    <div className="flex gap-3">
                      {(["16:9", "9:16"] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAspect(a)}
                          className={
                            `group relative rounded-md border p-2 flex flex-col items-center gap-1 min-w-[84px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ` +
                            (aspect === a
                              ? "border-brand-600 bg-brand-50"
                              : "border-gray-200 bg-white hover:border-gray-300")
                          }
                          aria-pressed={aspect === a}
                        >
                          <span className="text-[10px] font-medium text-gray-600 group-[aria-pressed=true]:text-brand-700">
                            {a}
                          </span>
                          <span
                            className={
                              `block rounded-sm bg-gray-200 overflow-hidden ` +
                              (a === "16:9" ? "w-16 h-9" : "w-9 h-16") +
                              " " +
                              (aspect === a
                                ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-brand-50 bg-brand-200/60"
                                : "group-hover:bg-gray-300")
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Reference image */}
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="veo3-ref-image"
                    className="text-[11px] font-medium text-gray-600 flex items-center gap-2"
                  >
                    Reference image URL{" "}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <div className="flex gap-3 items-start">
                    <Input
                      id="veo3-ref-image"
                      placeholder="https://... (single image)"
                      value={refImageUrl}
                      onChange={(e) => setRefImageUrl(e.target.value)}
                    />
                    {refImageUrl.trim() && (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border bg-gray-100 flex items-center justify-center">
                        <img
                          src={refImageUrl}
                          alt="Reference preview"
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
                        />
                        {!/\.(png|jpg|jpeg|webp|gif|avif)$/i.test(
                          refImageUrl,
                        ) && (
                          <span className="text-[9px] text-gray-400 px-1 text-center leading-tight">
                            Preview
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 flex-wrap">
                  {!hasResult && (
                    <Button
                      type="submit"
                      disabled={submitting || !prompt.trim()}
                      loading={submitting}
                      className="bg-brand-600 hover:bg-brand-700"
                    >
                      {jobStatus === "completed" ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 animate-pulse" />
                      )}{" "}
                      {statusLabel}
                    </Button>
                  )}
                  {hasResult && (
                    <>
                      <Button
                        type="button"
                        className="bg-brand-600 hover:bg-brand-700"
                        onClick={() => setPreviewVideo(resultUrl!)}
                      >
                        <Maximize2 className="h-4 w-4" /> Preview
                      </Button>
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={submitting}
                      >
                        Regenerate
                      </Button>
                    </>
                  )}
                  {submitting &&
                    jobStatus &&
                    jobStatus !== "completed" &&
                    jobStatus !== "failed" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          abortRef.current?.abort();
                          setJobStatus("cancelled");
                          setSubmitting(false);
                        }}
                      >
                        <Square className="h-4 w-4" /> Cancel
                      </Button>
                    )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={reset}
                    disabled={submitting && !prompt}
                  >
                    Reset
                  </Button>
                  {jobStatus === "completed" && aspect === "16:9" && jobId && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={fetchingHD}
                      onClick={async () => {
                        try {
                          setFetchingHD(true);
                          const hd = await getVeo3Video1080p(jobId);
                          if (hd.video_urls?.length) {
                            setAllUrls(hd.video_urls);
                            addToHistory({
                              jobId,
                              videoUrl: resultUrl!,
                              allUrls: hd.video_urls,
                            });
                            push({
                              message: "1080p URLs fetched",
                              variant: "success",
                            });
                          } else {
                            push({
                              message:
                                "No 1080p URLs yet. Try again in a minute.",
                              variant: "info",
                            });
                          }
                        } catch (e: any) {
                          push({
                            message: e?.message || "1080p fetch failed",
                            variant: "error",
                          });
                        } finally {
                          setFetchingHD(false);
                        }
                      }}
                    >
                      {fetchingHD ? "Fetching 1080p..." : "Get 1080p"}
                    </Button>
                  )}
                </div>
                {jobStatus &&
                  jobStatus !== "completed" &&
                  jobStatus !== "failed" && (
                    <span className="text-[11px] text-gray-500">
                      Polling for result… (can take a few minutes)
                    </span>
                  )}
                {jobId && (
                  <div className="rounded-md bg-white border px-2 py-1 text-[10px] text-gray-500 flex gap-2 items-center self-start">
                    <span className="font-medium">Job:</span>
                    <span className="truncate max-w-[160px]" title={jobId}>
                      {jobId}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(jobId);
                        push({ message: "Job ID copied", variant: "success" });
                      }}
                      className="text-brand-600 hover:underline"
                    >
                      copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {resultUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                  2
                </span>
                <span ref={resultHeadingRef} tabIndex={-1}>
                  Veo3 Result
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full max-w-xl bg-black rounded-lg flex items-center justify-center overflow-hidden relative">
                <div className="w-full h-full relative">
                  <video
                    src={resultUrl}
                    className="w-full h-full object-contain"
                    controls
                    onClick={() => setPreviewVideo(resultUrl!)}
                    aria-label="Generated video result"
                    poster={refImageUrl || undefined}
                    onLoadedData={() => setVideoLoading(false)}
                  >
                    <track kind="captions" src="" label="(No captions)" />
                  </video>
                  {videoLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white text-[11px]">
                      <div className="h-6 w-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Preparing preview…</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.open(resultUrl, "_blank")}
                    className="rounded-md bg-white/10 backdrop-blur text-white px-2 py-1 text-[11px] hover:bg-white/20"
                    aria-label="Open video in new tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resultUrl);
                      setCopiedUrl(resultUrl);
                      setTimeout(() => setCopiedUrl(null), 1500);
                    }}
                    className="rounded-md bg-white/10 backdrop-blur text-white px-2 py-1 text-[11px] hover:bg-white/20"
                    aria-label="Copy video URL"
                  >
                    {copiedUrl === resultUrl ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Clipboard className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadVideo(resultUrl, `veo3_${jobId || "result"}.mp4`)
                    }
                    className="rounded-md bg-white/10 backdrop-blur text-white px-2 py-1 text-[11px] hover:bg-white/20"
                    aria-label="Download video"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-600 space-y-2">
                <div className="font-medium text-gray-700">Primary URL</div>
                <div className="flex items-center gap-2">
                  <span className="truncate max-w-[520px]" title={resultUrl}>
                    {resultUrl}
                  </span>
                </div>
                {allUrls && allUrls.length > 1 && (
                  <div className="space-y-1">
                    <div className="font-medium text-gray-700">
                      Alternate variants
                    </div>
                    {allUrls.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <span className="truncate max-w-[480px]" title={u}>
                          Alt {i + 1}: {u}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(u);
                            setCopiedUrl(u);
                            setTimeout(() => setCopiedUrl(null), 1500);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition rounded-md border bg-white px-1.5 py-0.5 text-[10px] flex items-center gap-1"
                        >
                          {copiedUrl === u ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Clipboard className="h-3 w-3" />
                          )}
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadVideo(
                              u,
                              `veo3_${jobId || "alt"}_${i + 1}.mp4`,
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 transition rounded-md border bg-white px-1.5 py-0.5 text-[10px] flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Save
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-gray-400">
                  1080p may take extra time after initial completion. Use Get
                  1080p button again if not available yet.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      {/* Preview video */}
      <Modal
        isOpen={!!previewVideo}
        onClose={() => setPreviewVideo(null)}
        size="lg"
      >
        <ModalHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <ModalTitle className="text-white flex items-center gap-2">
            <Maximize2 className="h-4 w-4" /> Animation preview
          </ModalTitle>
          <button
            type="button"
            onClick={() => setPreviewVideo(null)}
            className="rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </ModalHeader>
        <ModalBody className="p-0 bg-black flex items-center justify-center">
          {previewVideo && (
            <div className="relative w-full flex items-center justify-center">
              <video
                src={previewVideo}
                className="max-h-[70vh] w-auto"
                controls
                poster={refImageUrl || undefined}
                onLoadedData={() => setVideoLoading(false)}
              >
                <track kind="captions" src="" label="(No captions)" />
              </video>
              {videoLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white text-[11px]">
                  <div className="h-7 w-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Loading video…</span>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="bg-gray-50 justify-between">
          <div className="text-[11px] text-gray-500">Generated animation</div>
          <Button variant="outline" onClick={() => setPreviewVideo(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}

export default AnimateImageWithAI;
