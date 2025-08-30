import React from "react";
import {
  Wand2,
  Image as ImageIcon,
  Layers,
  Upload,
  Clipboard,
  Check,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { CompanySelect } from "../components/companies/CompanySelect";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { createImageEditJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";
import { Textarea } from "../components/ui/Textarea";

export function EditImageWithAI() {
  useDocumentTitle("Edit Image with AI — AI Marketing");
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
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [highlightedJob, setHighlightedJob] = React.useState<number | null>(
    null,
  );
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
    if (!images.length || !subject.trim() || !action.trim()) {
      push({ message: "Upload images and fill * fields", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const { job } = await createImageEditJob({
        company_id: Number(selectedCompanyId),
        prompt_subject: subject.trim(),
        prompt_action: action.trim(),
        prompt_style: style || null,
        prompt_context: context || null,
        prompt_composition: composition || null,
        prompt_refinement: refinement || null,
        files: images.map((i) => i.file),
      });
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
    <div className="space-y-6">
      <PageHeader
        title="Edit image with AI"
        description="Enhance or transform existing images using AI instructions."
        icon={<Wand2 className="h-5 w-5" />}
        actions={null}
      />
      <div className="max-w-sm">
        <CompanySelect
          value={selectedCompanyId}
          onChange={(id) => setSelectedCompanyId(id)}
          label="Edit for company"
          placeholder="Choose a company"
        />
      </div>
      <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl">
        <div className="grid gap-6 md:grid-cols-3 items-start">
          <div className="md:col-span-1 space-y-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1">
                Base images (up to 10)
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white relative">
                <div className="w-full space-y-4">
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                        >
                          <img
                            src={img.url}
                            alt={`Selected ${idx + 1}`}
                            className="w-full h-32 object-contain mix-blend-multiply"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-white/80 hover:bg-white text-gray-700 rounded-md px-2 py-0.5 text-xs font-medium shadow-sm border border-gray-300 motion-safe:transition"
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
                  <p className="text-xs text-gray-400">
                    PNG, JPG, or WEBP • {images.length}/10 selected
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-8">
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
                    disabled={
                      !images.length ||
                      !subject.trim() ||
                      !action.trim() ||
                      submitting
                    }
                    loading={submitting}
                  >
                    <Wand2 className="h-4 w-4" />
                    Generate edits
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!images.length && !assembledPrompt}
                    onClick={() => {
                      images.forEach((img) => URL.revokeObjectURL(img.url));
                      setImages([]);
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
              </div>
            </div>
          </div>
        </div>
      </form>
      <EmptyState
        icon={<Wand2 className="h-8 w-8 text-white" />}
        title="AI image editing"
        message={
          <div>
            <p className="mb-6">
              Soon you'll be able to edit, extend, and restyle images with
              simple natural language instructions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Upload</h4>
                <p className="text-sm text-gray-600">Provide a base image</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Instruct</h4>
                <p className="text-sm text-gray-600">Describe the changes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Layers className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Variants</h4>
                <p className="text-sm text-gray-600">Pick your favorite</p>
              </div>
            </div>
          </div>
        }
        variant="purple"
      />
      {/* Jobs list */}
      <MediaJobsList
        companyId={selectedCompanyId ? Number(selectedCompanyId) : null}
        highlightJobId={highlightedJob}
        className="mt-8"
      />
    </div>
  );
}

export default EditImageWithAI;
