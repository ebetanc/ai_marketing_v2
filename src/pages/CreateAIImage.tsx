import React from "react";
import { ImagePlus, Sparkles, Clipboard, Check } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "../components/ui/Card";
import { BrandSelect } from "../components/brands/BrandSelect";
import { useToast } from "../components/ui/Toast";
import { createImageJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";

export function CreateAIImage() {
  useDocumentTitle("Create AI Image — Lighting");
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<
    string | number | null
  >(null);
  // Structured prompt fields (mirrors EditImageWithAI without uploads)
  const [subject, setSubject] = React.useState("");
  const [action, setAction] = React.useState("");
  const [style, setStyle] = React.useState("");
  const [context, setContext] = React.useState("");
  const [composition, setComposition] = React.useState("");
  const [refinement, setRefinement] = React.useState("");
  // Prompt mode: 'simple' single box or 'pro' structured fields
  const [mode, setMode] = React.useState<"simple" | "pro">("simple");
  const [simplePrompt, setSimplePrompt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [numImages, setNumImages] = React.useState(4);
  const [copied, setCopied] = React.useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "simple") {
      if (!simplePrompt.trim()) return;
    } else {
      if (!subject.trim() || !action.trim()) return;
    }
    if (!selectedCompanyId) {
      push({ message: "Select a company first", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const job = await createImageJob(
        mode === "simple"
          ? {
              company_id: Number(selectedCompanyId),
              prompt_subject: simplePrompt.trim(),
              prompt_action: null,
              prompt_style: null,
              prompt_context: null,
              prompt_composition: null,
              prompt_refinement: null,
              num_images: numImages,
            }
          : {
              company_id: Number(selectedCompanyId),
              prompt_subject: subject.trim(),
              prompt_action: action.trim() || null,
              prompt_style: style || null,
              prompt_context: context || null,
              prompt_composition: composition || null,
              prompt_refinement: refinement || null,
              num_images: numImages,
            },
      );
      push({
        message: `Image generation queued (Job #${job.id})`,
        variant: "success",
      });
      handleReset();
      setHighlightedJob(job.id);
    } catch (err: any) {
      push({
        message: err?.message || "Failed to queue image generation",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setSimplePrompt("");
    setSubject("");
    setAction("");
    setStyle("");
    setContext("");
    setComposition("");
    setRefinement("");
    setNumImages(4);
  }

  // Highlight new job in list
  const [highlightedJob, setHighlightedJob] = React.useState<number | null>(
    null,
  );

  // Keyboard shortcut (Ctrl/Cmd+Enter) to submit when valid
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const valid =
          mode === "simple"
            ? simplePrompt.trim()
            : subject.trim() && action.trim();
        if (valid && !submitting) {
          const form = document.getElementById("create-image-form");
          form?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, simplePrompt, subject, action, submitting]);

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
        title="Create AI Image"
        description="Generate on-brand images using structured AI prompts."
        icon={<ImagePlus className="h-5 w-5" />}
        actions={null}
      />
      <form
        id="create-image-form"
        onSubmit={handleSubmit}
        className="space-y-8 max-w-6xl"
      >
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
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-80">
                <BrandSelect
                  value={selectedCompanyId}
                  onChange={(id) => setSelectedCompanyId(id)}
                  label="Generate for brand"
                  placeholder="Choose a brand"
                />
              </div>
              <div className="flex flex-1 flex-wrap gap-6 items-end">
                <div className="w-32">
                  <label
                    htmlFor="numImages"
                    className="block text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide"
                  >
                    Images
                  </label>
                  <select
                    id="numImages"
                    value={numImages}
                    onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/40 focus:outline-none bg-white"
                  >
                    {[1, 2, 3, 4, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Variants (max 8)
                  </p>
                </div>
                <div className="flex-1 min-w-[220px] space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                      {mode === "pro"
                        ? "Structured fields for finer control."
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {mode === "simple" ? (
              <div className="grid gap-6">
                <div className="relative">
                  <Textarea
                    label="Prompt *"
                    required
                    value={simplePrompt}
                    onChange={(e) => setSimplePrompt(e.target.value)}
                    placeholder="Ultra-detailed description of the image you want—subject, scene, lighting, mood, style, camera, quality modifiers, constraints"
                    description="Free-form prompt (stored as subject). Switch to Pro for structured control."
                    name="simplePrompt"
                    rows={8}
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
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {/* existing structured fields */}
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
                        "Fill required fields to build structured prompt."}
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
          </CardContent>
        </Card>

        <div className="flex gap-3 flex-wrap">
          <Button
            type="submit"
            disabled={
              submitting ||
              (mode === "simple"
                ? !simplePrompt.trim()
                : !subject.trim() || !action.trim())
            }
            loading={submitting}
            className="bg-brand-600 hover:bg-brand-700"
          >
            <Sparkles className="h-4 w-4" /> Generate
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              mode === "simple"
                ? !simplePrompt
                : !subject &&
                  !action &&
                  !style &&
                  !context &&
                  !composition &&
                  !refinement
            }
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </form>
      {/* Polished form above; removed legacy block below */}
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
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

export default CreateAIImage;
