import React from "react";
import { Wand2, Upload, Clipboard, Check, Maximize2, X } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
// Removed legacy EmptyState block in favor of inline guidance and recent jobs card
import { Button } from "../components/ui/Button";
import { BrandSelect } from "../components/brands/BrandSelect";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { createImageEditJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/Card";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "../components/ui/Modal";

export function EditImageWithAI() {
  useDocumentTitle("Edit Image with AI — Lighting");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<
    string | number | null
  >(null);
  // Support up to 10 base images
  const [images, setImages] = React.useState<{ file: File; url: string }[]>([]);
  // Structured edit prompt fields
  const [subject, setSubject] = React.useState("");
  const [action, setAction] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [composition, setComposition] = React.useState("");
  const [refinement, setRefinement] = React.useState("");
  const [mode, setMode] = React.useState<"simple" | "pro">("simple");
  const [simplePrompt, setSimplePrompt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [highlightedJob, setHighlightedJob] = React.useState<number | null>(
    null,
  );
  const [previewAsset, setPreviewAsset] = React.useState<any | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null); // local uploaded image preview
  const { push } = useToast();

  const assembledPrompt = React.useMemo(() => {
    if (mode === "simple") return simplePrompt.trim();
    const parts: string[] = [];
    if (subject) parts.push(`Subject: ${subject.trim()}`);
    if (action) parts.push(`Action: ${action.trim()}`);
    if (style) parts.push(`Style: ${style.trim()}`);
    if (context) parts.push(`Context: ${context.trim()}`);
    if (composition) parts.push(`Composition: ${composition.trim()}`);
    if (refinement) parts.push(`Refinement: ${refinement.trim()}`);
    return parts.join("\n");
  }, [
    mode,
    simplePrompt,
    subject,
    action,
    style,
    context,
    composition,
    refinement,
  ]);

  function copyPrompt() {
    if (!assembledPrompt) return;
    navigator.clipboard.writeText(assembledPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const newFiles: { file: File; url: string }[] = [];
    const remainingSlots = 10 - images.length;
    for (let i = 0; i < fileList.length && i < remainingSlots; i++) {
      const f = fileList[i];
      newFiles.push({ file: f, url: URL.createObjectURL(f) });
    }
    if (newFiles.length) {
      setImages((prev) => [...prev, ...newFiles]);
    }
    // reset input value so same file(s) can be re-selected if removed
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  }

  React.useEffect(() => {
    return () => {
      // cleanup object URLs on unmount
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompanyId) {
      push({ message: "Select a company first", variant: "error" });
      return;
    }
    if (!images.length) {
      push({ message: "Upload images first", variant: "error" });
      return;
    }
    if (mode === "simple") {
      if (!simplePrompt.trim()) {
        push({ message: "Enter a prompt", variant: "error" });
        return;
      }
    } else if (!subject.trim() || !action.trim()) {
      push({ message: "Upload images and fill * fields", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const { job } = await createImageEditJob(
        mode === "simple"
          ? {
              company_id: Number(selectedCompanyId),
              prompt_subject: simplePrompt.trim(),
              prompt_action: null,
              prompt_style: null,
              prompt_context: null,
              prompt_composition: null,
              prompt_refinement: null,
              files: images.map((i) => i.file),
            }
          : {
              company_id: Number(selectedCompanyId),
              prompt_subject: subject.trim(),
              prompt_action: action.trim(),
              prompt_style: style || null,
              prompt_context: context || null,
              prompt_composition: composition || null,
              prompt_refinement: refinement || null,
              files: images.map((i) => i.file),
            },
      );
      push({
        title: "Image edit queued",
        message: `Job #${job.id}`,
        variant: "success",
      });
      setHighlightedJob(job.id);
    } catch (err: any) {
      push({
        message: err?.message || "Failed to queue image edit",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <PageContainer>
      <PageHeader
        title="Edit image with AI"
        description="Enhance or transform images with precise natural language edits."
        icon={<Wand2 className="h-5 w-5" />}
        actions={null}
      />
      <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl">
        {/* Step 1 */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600/10 ring-1 ring-brand-600/20 text-brand-700">
                1
              </span>
              Select brand & upload inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-80">
                <BrandSelect
                  value={selectedCompanyId}
                  onChange={(id) => setSelectedCompanyId(id)}
                  label="Edit for brand"
                  placeholder="Choose a brand"
                />
              </div>
              <div className="flex-1 space-y-4">
                <p className="text-xs text-gray-600">
                  Upload up to 10 reference images (they define edit context).
                  Click a thumbnail to preview.
                </p>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white/60">
                  <div className="space-y-4">
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                            onClick={() => setPreviewImage(img.url)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPreviewImage(img.url);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`Preview image ${idx + 1}`}
                          >
                            <img
                              src={img.url}
                              alt={`Selected ${idx + 1}`}
                              className="w-full h-24 object-cover transition-transform group-hover:scale-[1.04]"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(idx);
                              }}
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white text-gray-700 rounded-md px-2 py-0.5 text-[10px] font-medium shadow-sm border border-gray-300 motion-safe:transition"
                              aria-label={`Remove image ${idx + 1}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {images.length < 10 && (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          {images.length === 0
                            ? "Drag & drop or click to upload"
                            : "Add more images"}
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          className="cursor-pointer py-2 px-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-600 file:text-white file:font-medium file:cursor-pointer"
                          aria-label="Upload images to edit"
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
                      {images.length}/10 selected
                    </p>
                  </div>
                </div>
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
              Craft edit prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-xs text-gray-500">
                {mode === "pro"
                  ? "Structured fields for granular control."
                  : "Single free-form prompt."}{" "}
                Ctrl/Cmd+Enter submits.
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
                  placeholder="Free-form edit prompt including subject + transformation details"
                  description="Stored as subject only. Switch to Pro for structured control."
                  rows={8}
                  name="simplePrompt"
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
                  placeholder="This 28-year-old woman with curly red hair wearing casual denim jacket; or: The dog in the foreground using this reference selfie"
                  description="Core entity: identity, pose, defining attributes."
                  name="subject"
                  rows={4}
                />
                <Textarea
                  label="Action *"
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Make her wear this black dress after removing current outfit; then blend her with this pet on a basketball court"
                  description="Primary transformation verbs & sequence."
                  name="action"
                  rows={4}
                />
                <Textarea
                  label="Style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="1960s beehive hairstyle & bold bullfighting costume; high-quality natural lighting; subtle film grain"
                  description="Aesthetic / reference era / textures / grading."
                  name="style"
                  rows={4}
                />
                <Textarea
                  label="Context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Set in a neon diner at night with reflective checker floor; portrait on a basketball court at golden hour"
                  description="Environment & background integration."
                  name="context"
                  rows={4}
                />
                <Textarea
                  label="Composition"
                  value={composition}
                  onChange={(e) => setComposition(e.target.value)}
                  placeholder="Vertical crop; blur background; shallow depth of field"
                  description="Framing & focus adjustments."
                  name="composition"
                  rows={3}
                />
                <Textarea
                  label="Refinement / Constraints"
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  placeholder="Keep face identical; avoid artifacts; maintain natural proportions"
                  description="Preservation + negative directives."
                  name="refinement"
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
                        "Fill required fields to build structured edit prompt."}
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
                      <li>Subject: Identity, pose, attributes.</li>
                      <li>Action: Verb-first transformations.</li>
                      <li>Style: Era / texture / grading.</li>
                      <li>Context: Environment & interactions.</li>
                      <li>Composition: Framing & focus tweaks.</li>
                      <li>Refinement: Keep / avoid directives.</li>
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
                  !images.length ||
                  (mode === "simple"
                    ? !simplePrompt.trim()
                    : !subject.trim() || !action.trim())
                }
                loading={submitting}
                className="bg-brand-600 hover:bg-brand-700"
              >
                <Wand2 className="h-4 w-4" /> Generate edits
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !images.length &&
                  (mode === "simple" ? !simplePrompt : !assembledPrompt)
                }
                onClick={() => {
                  images.forEach((img) => URL.revokeObjectURL(img.url));
                  setImages([]);
                  setSimplePrompt("");
                  setSubject("");
                  setAction("");
                  setStyle("");
                  setContext("");
                  setComposition("");
                  setRefinement("");
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

      {/* Preview uploaded local image */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        size="lg"
      >
        <ModalHeader className="bg-gradient-to-r from-brand-600 to-brand-700 text-white">
          <ModalTitle className="text-white">Input image preview</ModalTitle>
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </ModalHeader>
        <ModalBody className="p-0 bg-black flex items-center justify-center">
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[70vh] w-auto object-contain"
            />
          )}
        </ModalBody>
        <ModalFooter className="bg-gray-50">
          <Button variant="outline" onClick={() => setPreviewImage(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Preview generated job asset */}
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
              alt="Job asset"
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
            {(previewAsset as any)?.kind === "input" ? "Input" : "Output"} asset
            • ID {previewAsset?.id}
          </div>
          <Button variant="outline" onClick={() => setPreviewAsset(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  );
}

export default EditImageWithAI;
