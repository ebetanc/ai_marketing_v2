import React from "react";
import {
  ImagePlus,
  Sparkles,
  Upload,
  Clipboard,
  Check,
  Maximize2,
  X,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
// Removed legacy EmptyState in favor of contextual guidance & recent jobs card
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { BrandSelect } from "../components/brands/BrandSelect";
import { useToast } from "../components/ui/Toast";
import { createVideoJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
} from "../components/ui/Modal";

export function CreateAiVideo() {
  useDocumentTitle("Create AI Video — Lighting");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<
    string | number | null
  >(null);
  // Video settings
  const [duration, setDuration] = React.useState<number>(8);
  const [aspectRatio, setAspectRatio] = React.useState<string>("square");
  // Structured prompt builder state (could be lifted later if needed)
  const [subject, setSubject] = React.useState("");
  const [context, setContext] = React.useState("");
  const [action, setAction] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [camera, setCamera] = React.useState("");
  const [composition, setComposition] = React.useState("");
  const [ambiance, setAmbiance] = React.useState("");
  const [audio, setAudio] = React.useState("");
  const [mode, setMode] = React.useState<"simple" | "pro">("simple");
  const [simplePrompt, setSimplePrompt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [highlightedJob, setHighlightedJob] = React.useState<number | null>(
    null,
  );
  const [previewAsset, setPreviewAsset] = React.useState<any | null>(null);
  const { push } = useToast();

  const assembledPrompt = React.useMemo(() => {
    if (mode === "simple") return simplePrompt.trim();
    const parts: string[] = [];
    if (subject) parts.push(`Subject: ${subject.trim()}`);
    if (context) parts.push(`Context: ${context.trim()}`);
    if (action) parts.push(`Action: ${action.trim()}`);
    if (style) parts.push(`Style: ${style.trim()}`);
    if (camera) parts.push(`Camera: ${camera.trim()}`);
    if (composition) parts.push(`Composition: ${composition.trim()}`);
    if (ambiance) parts.push(`Ambiance: ${ambiance.trim()}`);
    if (audio) parts.push(`Audio: ${audio.trim()}`);
    return parts.join("\n");
  }, [
    mode,
    simplePrompt,
    subject,
    context,
    action,
    style,
    camera,
    composition,
    ambiance,
    audio,
  ]);
  // Keyboard shortcut submit
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const valid =
          mode === "simple"
            ? simplePrompt.trim()
            : subject.trim() && context.trim() && action.trim() && style.trim();
        if (valid && !submitting) {
          const form = document.getElementById("create-video-form");
          form?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, simplePrompt, subject, context, action, style, submitting]);

  // (Templates removed to simplify UI)

  function copyPrompt() {
    if (!assembledPrompt) return;
    navigator.clipboard.writeText(assembledPrompt).then(() => {
      setCopied(true);
      push({ message: "Prompt copied", variant: "success" });
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create AI Video"
        description="Generate short AI video clips from rich structured prompts."
        icon={<ImagePlus className="h-5 w-5" />}
        actions={null}
      />
      <form
        id="create-video-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedCompanyId) {
            push({ message: "Select a company first", variant: "error" });
            return;
          }
          if (mode === "simple") {
            if (!simplePrompt.trim()) {
              push({ message: "Enter a prompt", variant: "error" });
              return;
            }
          } else {
            if (
              !subject.trim() ||
              !context.trim() ||
              !action.trim() ||
              !style.trim()
            ) {
              push({ message: "Fill required * fields", variant: "error" });
              return;
            }
          }
          setSubmitting(true);
          try {
            const job = await createVideoJob(
              mode === "simple"
                ? {
                    company_id: Number(selectedCompanyId),
                    prompt_subject: simplePrompt.trim(),
                    prompt_context: "",
                    prompt_action: "",
                    prompt_style: "",
                    prompt_camera: null,
                    prompt_composition: null,
                    prompt_ambiance: null,
                    prompt_audio: null,
                    aspect_ratio: aspectRatio as any,
                    duration_seconds: duration,
                  }
                : {
                    company_id: Number(selectedCompanyId),
                    prompt_subject: subject.trim(),
                    prompt_context: context.trim(),
                    prompt_action: action.trim(),
                    prompt_style: style.trim(),
                    prompt_camera: camera || null,
                    prompt_composition: composition || null,
                    prompt_ambiance: ambiance || null,
                    prompt_audio: audio || null,
                    aspect_ratio: aspectRatio as any,
                    duration_seconds: duration,
                  },
            );
            push({
              message: `Video generation queued (Job #${job.id})`,
              variant: "success",
            });
            setHighlightedJob(job.id);
          } catch (err: any) {
            push({
              message: err.message || "Failed to queue video",
              variant: "error",
            });
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-8 max-w-6xl"
        aria-label="AI video generation structured prompt builder"
      >
        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                1
              </span>
              Select brand & settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5 items-end">
              <div className="md:col-span-2 lg:col-span-2">
                <BrandSelect
                  value={selectedCompanyId}
                  onChange={(id) => setSelectedCompanyId(id)}
                  label="Generate for brand"
                  placeholder="Choose a brand"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="duration"
                  className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide"
                >
                  Duration (s)
                </label>
                <input
                  id="duration"
                  type="number"
                  min={4}
                  max={20}
                  value={duration}
                  onChange={(e) =>
                    setDuration(
                      Math.min(
                        20,
                        Math.max(4, parseInt(e.target.value || "8", 10)),
                      ),
                    )
                  }
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 focus:outline-none"
                />
                <p className="text-[10px] text-gray-500">4–20 seconds</p>
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="aspectRatio"
                  className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide"
                >
                  Aspect ratio
                </label>
                <select
                  id="aspectRatio"
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 focus:outline-none"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  name="aspectRatio"
                >
                  <option value="square">Square (1:1)</option>
                  <option value="16:9">Widescreen (16:9)</option>
                  <option value="9:16">Vertical (9:16)</option>
                </select>
                <p className="text-[10px] text-gray-500">Orientation</p>
              </div>
              <div className="flex flex-col justify-end">
                <p className="text-[10px] text-gray-400">
                  Ctrl/Cmd+Enter submits
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Step 2 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                2
              </span>
              Craft prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-xs text-gray-500">
                {mode === "pro"
                  ? "Structured fields for granular control."
                  : "Single free-form concept."}
              </p>
              <div
                role="tablist"
                aria-label="Prompt mode"
                className="inline-flex rounded-full bg-gray-100 p-1 text-xs font-medium"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "simple"}
                  onClick={() => setMode("simple")}
                  className={`px-3 py-1 rounded-full transition ${mode === "simple" ? "bg-brand-600 text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "pro"}
                  onClick={() => setMode("pro")}
                  className={`px-3 py-1 rounded-full transition ${mode === "pro" ? "bg-brand-600 text-white shadow" : "text-gray-600 hover:text-gray-900"}`}
                >
                  Pro
                </button>
              </div>
            </div>
            {mode === "simple" ? (
              <div className="relative">
                <Textarea
                  label="Prompt *"
                  required
                  value={simplePrompt}
                  onChange={(e) => setSimplePrompt(e.target.value)}
                  placeholder="Free-form video concept (subject, setting, motion, style)."
                  description="Stored condensed. Switch to Pro for granular control."
                  rows={8}
                  name="simpleVideoPrompt"
                />
                <div className="absolute right-2 -top-8 flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {simplePrompt.length} chars
                  </span>
                  <button
                    type="button"
                    onClick={copyPrompt}
                    disabled={!simplePrompt.trim()}
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
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                <Textarea
                  label="Subject *"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="A 35-year-old Asian-American woman..."
                  description="Primary focus specifics."
                  name="subject"
                  rows={4}
                />
                <Textarea
                  label="Context *"
                  required
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Sunlit open-plan tech startup hub..."
                  description="Environment & setting details."
                  name="context"
                  rows={4}
                />
                <Textarea
                  label="Action *"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="She raises tablet..."
                  description="Sequence & motion verbs."
                  name="action"
                  rows={4}
                />
                <Textarea
                  label="Style *"
                  required
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="Cinematic corporate realism..."
                  description="Aesthetic & grading."
                  name="style"
                  rows={4}
                />
                <Textarea
                  label="Camera"
                  value={camera}
                  onChange={(e) => setCamera(e.target.value)}
                  placeholder="Slow dolly-in..."
                  description="Shot / movement / lens."
                  name="camera"
                  rows={3}
                />
                <Textarea
                  label="Composition"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  placeholder="Rule of thirds..."
                  description="Framing & depth cues."
                  name="composition"
                  rows={3}
                />
                <Textarea
                  label="Ambiance"
                  value={ambiance}
                  onChange={(e) => setAmbiance(e.target.value)}
                  placeholder="Gentle warm key light..."
                  description="Lighting & atmosphere."
                  name="ambiance"
                  rows={3}
                />
                <Textarea
                  label="Audio"
                  value={audio}
                  onChange={(e) => setAudio(e.target.value)}
                  placeholder="Distant soft office murmur..."
                  description="Dialogue & SFX (optional)."
                  name="audio"
                  rows={3}
                />
              </div>
            )}
            {mode === "pro" && (
              <div className="grid gap-6 md:grid-cols-2 items-start">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Assembled prompt
                  </h3>
                  <div className="relative">
                    <pre
                      className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 pr-14 text-xs text-gray-800 min-h-[160px]"
                      aria-label="Prompt preview"
                    >
                      {assembledPrompt ||
                        "Fill fields to build your structured prompt."}
                    </pre>
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {assembledPrompt.length} chars
                      </span>
                      <button
                        type="button"
                        onClick={copyPrompt}
                        disabled={!assembledPrompt}
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
                </div>
                <div className="space-y-3">
                  <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="font-medium mb-1 text-gray-700">Guidance</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Subject: Concrete specifics.</li>
                      <li>Context: Rich environment & sensory detail.</li>
                      <li>Action: Sequential verbs + micro-expressions.</li>
                      <li>Style: Aesthetic + grading references.</li>
                      <li>Camera: Movement & lens feel.</li>
                      <li>Composition: Framing & depth cues.</li>
                      <li>Ambiance: Lighting & atmosphere.</li>
                      <li>Audio: Dialogue & ambient SFX.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <Button
                type="submit"
                disabled={
                  submitting ||
                  (mode === "simple"
                    ? !simplePrompt.trim()
                    : !subject.trim() ||
                      !context.trim() ||
                      !action.trim() ||
                      !style.trim())
                }
                loading={submitting}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Sparkles className="h-4 w-4" />{" "}
                {submitting ? "Queuing..." : "Generate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  mode === "simple"
                    ? !simplePrompt
                    : !subject &&
                      !context &&
                      !action &&
                      !style &&
                      !camera &&
                      !composition &&
                      !ambiance &&
                      !audio
                }
                onClick={() => {
                  setSimplePrompt("");
                  setSubject("");
                  setContext("");
                  setAction("");
                  setStyle("");
                  setCamera("");
                  setComposition("");
                  setAmbiance("");
                  setAudio("");
                }}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      {/* Step 3 */}
      <Card className="mt-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
              3
            </span>
            Recent jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MediaJobsList
            companyId={selectedCompanyId ? Number(selectedCompanyId) : null}
            highlightJobId={highlightedJob}
            onAssetClick={(asset) => setPreviewAsset(asset)}
          />
        </CardContent>
      </Card>

      {/* Asset preview modal */}
      <Modal
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        size="lg"
      >
        <ModalHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <ModalTitle className="text-white flex items-center gap-2">
            <Maximize2 className="h-4 w-4" /> Asset preview
          </ModalTitle>
          <button
            type="button"
            onClick={() => setPreviewAsset(null)}
            className="rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </ModalHeader>
        <ModalBody className="p-0 bg-black flex items-center justify-center">
          {previewAsset && previewAsset.mime_type?.startsWith("image/") && (
            <img
              src={previewAsset.url}
              alt="Video frame asset"
              className="max-h-[70vh] w-auto object-contain"
            />
          )}
          {previewAsset && previewAsset.mime_type?.startsWith("video/") && (
            <video
              src={previewAsset.url}
              className="max-h-[70vh] w-auto"
              controls
            >
              <track kind="captions" src="" label="(No captions yet)" />
            </video>
          )}
        </ModalBody>
        <ModalFooter className="bg-gray-50 justify-between">
          <div className="text-[11px] text-gray-500">
            Asset ID {previewAsset?.id}
          </div>
          <Button variant="outline" onClick={() => setPreviewAsset(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}

export default CreateAiVideo;
