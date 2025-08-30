import React from "react";
import { ImagePlus, Sparkles, Clipboard, Check, Wand2 } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { CompanySelect } from "../components/companies/CompanySelect";
import { useToast } from "../components/ui/Toast";
import { createImageJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";

export function CreateAIImage() {
  useDocumentTitle("Create AI Image — AI Marketing");
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
  const [submitting, setSubmitting] = React.useState(false);
  const [numImages, setNumImages] = React.useState(4);
  const [copied, setCopied] = React.useState(false);
  const { push } = useToast();

  const assembledPrompt = React.useMemo(() => {
    const parts: string[] = [];
    if (subject) parts.push(`Subject: ${subject.trim()}`);
    if (action) parts.push(`Action: ${action.trim()}`);
    if (style) parts.push(`Style: ${style.trim()}`);
    if (context) parts.push(`Context: ${context.trim()}`);
    if (composition) parts.push(`Composition: ${composition.trim()}`);
    if (refinement) parts.push(`Refinement: ${refinement.trim()}`);
    return parts.join("\n");
  }, [subject, action, style, context, composition, refinement]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !action.trim()) return;
    if (!selectedCompanyId) {
      push({ message: "Select a company first", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const job = await createImageJob({
        company_id: Number(selectedCompanyId),
        prompt_subject: subject.trim(),
        prompt_action: action.trim() || null,
        prompt_style: style || null,
        prompt_context: context || null,
        prompt_composition: composition || null,
        prompt_refinement: refinement || null,
        num_images: numImages,
      });
      push({
        title: "Image generation queued",
        message: `Job #${job.id}`,
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
        if (subject.trim() && action.trim() && !submitting) {
          const form = document.getElementById("create-image-form");
          form?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subject, action, submitting]);

  const templates = [
    {
      label: "Product on white",
      fill: () => {
        setSubject(
          "Matte black stainless travel tumbler with subtle engraved logo front facing",
        );
        setAction(
          "Place centered on seamless pure white cyclorama; add soft diffused shadow directly beneath; remove any dust or imperfections",
        );
        setStyle(
          "Clean e‑commerce minimal, high-key lighting, crisp sharp detail, subtle rim light",
        );
        setContext("");
        setComposition(
          "Centered, slight top-down 10°, generous white negative space around",
        );
        setRefinement(
          "True brand color accuracy; no reflections; no extra props; keep proportions realistic",
        );
      },
    },
    {
      label: "Pro headshot",
      fill: () => {
        setSubject(
          "30-year-old Latina marketing manager, shoulder-length wavy dark brown hair, smart navy blazer over soft cream blouse, confident approachable expression",
        );
        setAction(
          "Refine grooming, enhance natural skin texture, subtle catchlight in eyes, gently smooth flyaway hairs",
        );
        setStyle(
          "Cinematic corporate realism, soft Rembrandt lighting, natural warm tones",
        );
        setContext("Neutral textured medium-gray studio backdrop");
        setComposition(
          "Tight crop shoulders up, shallow depth, gentle vignette, eyes on top third",
        );
        setRefinement(
          "Keep authentic features; no over-retouching; maintain natural skin tone",
        );
      },
    },
    {
      label: "Lifestyle brand",
      fill: () => {
        setSubject(
          "Young couple mid-20s laughing while walking golden retriever on coastal boardwalk",
        );
        setAction(
          "Enhance golden hour glow; soften background crowd; add subtle motion blur to dog leash",
        );
        setStyle(
          "Warm editorial lifestyle, filmic highlight rolloff, subtle grain",
        );
        setContext(
          "Sunset pastel sky, gentle ocean haze, boardwalk shops blurred",
        );
        setComposition(
          "Wide horizontal crop, leading lines receding, subjects left third",
        );
        setRefinement(
          "Natural skin tones; no lens distortion; keep authentic clothing",
        );
      },
    },
  ];

  function applyTemplate(t: (typeof templates)[number]) {
    const hasValues = [
      subject,
      action,
      style,
      context,
      composition,
      refinement,
    ].some((v) => v.trim());
    if (hasValues) {
      const ok = window.confirm("Replace current prompt fields with template?");
      if (!ok) return;
    }
    t.fill();
  }

  function copyPrompt() {
    if (!assembledPrompt) return;
    navigator.clipboard.writeText(assembledPrompt).then(() => {
      setCopied(true);
      push({ message: "Prompt copied", variant: "success" });
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create AI Image"
        description="Generate on-brand images using structured AI prompts."
        icon={<ImagePlus className="h-5 w-5" />}
        actions={null}
      />
      <div className="max-w-sm">
        <CompanySelect
          value={selectedCompanyId}
          onChange={(id) => setSelectedCompanyId(id)}
          label="Generate for company"
          placeholder="Choose a company"
        />
      </div>
      <form
        id="create-image-form"
        onSubmit={handleSubmit}
        className="space-y-10 max-w-5xl"
      >
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-40">
            <label
              htmlFor="numImages"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Images
            </label>
            <select
              id="numImages"
              value={numImages}
              onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Variants (max 8)</p>
          </div>
          <div className="flex-1 min-w-[240px]">
            <p className="text-xs text-gray-500">
              Use templates or craft a structured prompt. Ctrl/Cmd+Enter to
              submit.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  type="button"
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="text-xs rounded-full border border-gray-300 bg-white px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 motion-safe:transition"
                >
                  <Wand2 className="inline h-3 w-3 mr-1" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Textarea
            label="Subject *"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="This 28-year-old woman with curly red hair wearing casual denim jacket; or: The dog in the foreground using this reference selfie"
            description="Core entity: identity, pose, defining attributes. Anchors edit & prevents unintended changes to other regions."
            name="subject"
            rows={4}
          />
          <Textarea
            label="Action *"
            required
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Make her wear this black dress after removing current outfit; then blend her with this pet on a basketball court"
            description="Primary transformation: verbs + sequence (add, remove, replace, blend). For iterative steps describe order."
            name="action"
            rows={4}
          />
          <Textarea
            label="Style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="1960s beehive hairstyle & bold bullfighting costume; high-quality natural lighting; subtle film grain"
            description="Aesthetic or reference era, textures, color grading, realism cues. Influences transfer & cohesion."
            name="style"
            rows={4}
          />
          <Textarea
            label="Context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Set in a neon diner at night with reflective checker floor; or: Portrait of us on a basketball court at golden hour"
            description="Background & environment; integrate multiple uploads; maintain spatial coherence."
            name="context"
            rows={4}
          />
          <Textarea
            label="Composition"
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
            placeholder="Crop to vertical smartphone aspect; blur background softly; remove stain from t‑shirt; shallow depth of field"
            description="Framing, focus, layout adjustments; pair with action for targeted refinement."
            name="composition"
            rows={3}
          />
          <Textarea
            label="Refinement / Constraints"
            value={refinement}
            onChange={(e) => setRefinement(e.target.value)}
            placeholder="Keep face identical; no artifacts; avoid changing eye color; maintain natural proportions"
            description="Qualifiers, negatives, and preservation instructions to ensure consistency."
            name="refinement"
            rows={3}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2 items-start">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Assembled prompt preview
            </h3>
            <div className="relative">
              <pre
                className="whitespace-pre-wrap rounded-xl border-2 border-gray-200 bg-white p-4 pr-12 text-xs text-gray-800 min-h-[160px]"
                aria-label="Prompt preview"
              >
                {assembledPrompt ||
                  "Fill required fields to build structured edit prompt."}
              </pre>
              <button
                type="button"
                onClick={copyPrompt}
                disabled={!assembledPrompt}
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
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
          <div className="space-y-3">
            <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-medium mb-1">Guidance</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Subject: Identity, pose, attributes.</li>
                <li>Action: Verb-first transformations.</li>
                <li>Style: Era / texture / grading.</li>
                <li>Context: Environment & interactions.</li>
                <li>Composition: Framing & focus tweaks.</li>
                <li>Refinement: Keep / avoid directives.</li>
              </ul>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                type="submit"
                disabled={!subject.trim() || !action.trim() || submitting}
                loading={submitting}
              >
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={
                  !subject &&
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
          </div>
        </div>
      </form>
      <MediaJobsList
        companyId={selectedCompanyId ? Number(selectedCompanyId) : null}
        highlightJobId={highlightedJob}
      />
    </div>
  );
}

export default CreateAIImage;
