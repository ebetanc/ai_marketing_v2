import React from "react";
import {
  ImagePlus,
  Sparkles,
  Upload,
  Clipboard,
  Check,
  Wand2,
} from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { CompanySelect } from "../components/companies/CompanySelect";
import { useToast } from "../components/ui/Toast";
import { createVideoJob } from "../lib/media";
import { MediaJobsList } from "../components/media/MediaJobsList";

export function CreateAiVideo() {
  useDocumentTitle("Create AI Video — AI Marketing");
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
  const [submitting, setSubmitting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [highlightedJob, setHighlightedJob] = React.useState<number | null>(
    null,
  );
  const { push } = useToast();

  const assembledPrompt = React.useMemo(() => {
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
  }, [subject, context, action, style, camera, composition, ambiance, audio]);
  // Keyboard shortcut submit
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (
          subject.trim() &&
          context.trim() &&
          action.trim() &&
          style.trim() &&
          !submitting
        ) {
          const form = document.getElementById("create-video-form");
          form?.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subject, context, action, style, submitting]);

  const templates = [
    {
      label: "Talking head intro",
      fill: () => {
        setSubject(
          "Mid-30s Black software founder, short natural hair, smart casual navy knit, authentic energetic confidence",
        );
        setContext(
          "Minimal studio corner, soft neutral backdrop with subtle gradient, practical warm key light left, soft cool fill right",
        );
        setAction(
          "Smiles, slight lean forward, raises hand in greeting, delivers 2-line intro with natural hand gesture, friendly head nod toward end",
        );
        setStyle(
          "Clean YouTube tech channel, crisp 4K, soft cinematic depth, gentle highlight rolloff",
        );
        setCamera(
          "Static locked medium shot, 50mm look, gentle micro eye-level",
        );
        setComposition(
          "Centered rule-of-thirds vertical alignment, subtle negative space around head",
        );
        setAmbiance(
          "Warm key + cool fill balance, subtle back rim light, faint air movement implied",
        );
        setAudio(
          "Character: 'Welcome back, today we build an AI workflow' (engaging, medium pace)",
        );
      },
    },
    {
      label: "Product hero pan",
      fill: () => {
        setSubject(
          "Sleek matte black wireless earbuds charging case open, both earbuds levitating just above slots",
        );
        setContext(
          "Dark moody studio, soft volumetric particles, glossy charcoal surface with faint reflections",
        );
        setAction(
          "Slow lateral parallax pan left-to-right while earbuds subtly rotate 15° showcasing contour",
        );
        setStyle(
          "Premium cinematic tech ad, high contrast, controlled specular highlights, subtle bloom",
        );
        setCamera(
          "Motorized slider pan, 70mm macro feel, ultra smooth stabilization",
        );
        setComposition(
          "Subject centered initially then easing into right third, layered depth with foreground haze",
        );
        setAmbiance(
          "Focused key spotlight with soft falloff, cool ambient rim light edge separation",
        );
        setAudio("Sub-bass pulse + soft high-frequency shimmer swell");
      },
    },
  ];

  function applyTemplate(t: (typeof templates)[number]) {
    const hasValues = [
      subject,
      context,
      action,
      style,
      camera,
      composition,
      ambiance,
      audio,
    ].some((v) => v.trim());
    if (hasValues) {
      if (!window.confirm("Replace current prompt fields with template?"))
        return;
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
        title="Create AI Video"
        description="Generate on-brand images using AI prompts."
        icon={<ImagePlus className="h-5 w-5" />}
        actions={
          <Button>
            <Sparkles className="h-4 w-4" />
            New generation
          </Button>
        }
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
        id="create-video-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!selectedCompanyId) {
            push({ message: "Select a company first", variant: "error" });
            return;
          }
          if (
            !subject.trim() ||
            !context.trim() ||
            !action.trim() ||
            !style.trim()
          ) {
            push({ message: "Fill required * fields", variant: "error" });
            return;
          }
          setSubmitting(true);
          try {
            const job = await createVideoJob({
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
            });
            push({
              title: "Video generation queued",
              message: `Job #${job.id}`,
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
        className="grid gap-6 max-w-5xl"
        aria-label="AI video generation structured prompt builder"
      >
        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-1">
            <label
              htmlFor="duration"
              className="block text-base font-medium text-gray-700"
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
              className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 focus:border-brand-500 focus:outline-none"
            />
            <p className="text-base text-gray-500">Target length (4–20s).</p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label
              htmlFor="aspectRatio"
              className="block text-base font-medium text-gray-700"
            >
              Aspect ratio
            </label>
            <select
              id="aspectRatio"
              className="block w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-gray-900 motion-safe:transition-colors focus:border-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              name="aspectRatio"
            >
              <option value="square">Square (1:1)</option>
              <option value="16:9">Widescreen (16:9)</option>
              <option value="9:16">Vertical (9:16)</option>
            </select>
            <p className="text-base text-gray-500">
              Output orientation (square / wide / vertical).
            </p>
          </div>
          <div className="md:col-span-2 flex flex-col justify-end">
            <p className="text-base text-gray-500 mb-1">Prompt templates</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="text-base rounded-full border border-gray-300 bg-white px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 motion-safe:transition"
                >
                  <Wand2 className="inline h-3 w-3 mr-1" />
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Ctrl/Cmd+Enter to submit
            </p>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <Textarea
            label="Subject *"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="A 35-year-old Asian-American woman with shoulder-length black hair, wire-rimmed glasses, charcoal blazer over cream blouse, relaxed confident posture, gentle genuine smile, subtle natural makeup, standing with weight on left leg, holding a thin tablet at waist height"
            description="Primary focus: 15+ specifics (age, ethnicity, build, clothing, posture, emotion, accessories). Avoid generic terms."
            name="subject"
            rows={4}
          />
          <Textarea
            label="Context *"
            required
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Sunlit open-plan tech startup hub; matte concrete floor, biophilic wall of moss, soft morning haze through floor-to-ceiling windows, warm rim light, subtle lens dust motes, minimal Nordic furniture, soft ambient reflections on glass partitions"
            description="Environment / setting, props, weather, time of day, sensory & material details. Blend evocative & concrete."
            name="context"
            rows={4}
          />
          <Textarea
            label="Action *"
            required
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="She raises tablet, taps to change slide, glances to colleagues, nods thoughtfully, then points with stylus, brief pause, soft inhale before concluding gesture"
            description="Dynamic sequence, verbs, micro-expressions, timing (aim 5–8s continuity)."
            name="action"
            rows={4}
          />
          <Textarea
            label="Style *"
            required
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="Cinematic corporate realism, warm golden-hour grading, subtle filmic halation, gentle bloom, Wes Anderson inspired symmetry with restrained pastel accents"
            description="Visual aesthetic, genre, references (directors / movements), color grading & effects."
            name="style"
            rows={4}
          />
          <Textarea
            label="Camera"
            value={camera}
            onChange={(e) => setCamera(e.target.value)}
            placeholder="Slow dolly-in from medium to close-up, slight parallax, 50mm lens look, stabilized"
            description="Shot type, angle, movement (dolly, pan, crane, handheld) & lens qualities."
            name="camera"
            rows={3}
          />
          <Textarea
            label="Composition"
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
            placeholder="Rule of thirds, subject left, negative space right with soft bokeh, shallow depth (f/2), layered foreground light flare"
            description="Framing, layout, depth cues, focus / lens effects (bokeh, rack focus)."
            name="composition"
            rows={3}
          />
          <Textarea
            label="Ambiance"
            value={ambiance}
            onChange={(e) => setAmbiance(e.target.value)}
            placeholder="Gentle warm key light, cool blue shadow fill, subtle dust particles, low hum of HVAC implied"
            description="Lighting, mood, atmosphere, particles, temperature."
            name="ambiance"
            rows={3}
          />
          <Textarea
            label="Audio"
            value={audio}
            onChange={(e) => setAudio(e.target.value)}
            placeholder="Distant soft office murmur, faint keyboard clicks; She says: 'This is the inflection point' (calm conviction, medium volume)"
            description="Dialogue, SFX, ambient bed. Format: Character: 'Line' (Tone: descriptor)."
            name="audio"
            rows={3}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-gray-700">
              Assembled prompt preview
            </h3>
            <div className="relative">
              <pre
                className="whitespace-pre-wrap rounded-xl border-2 border-gray-200 bg-white p-4 pr-12 text-base text-gray-800 min-h-[180px]"
                aria-label="Prompt preview"
              >
                {assembledPrompt ||
                  "Fill fields to build your structured prompt."}
              </pre>
              <button
                type="button"
                onClick={copyPrompt}
                disabled={!assembledPrompt}
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
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
            <div className="text-base text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="font-medium mb-1">Guidance</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Subject: 15+ concrete specifics.</li>
                <li>Context: Rich environment & sensory detail.</li>
                <li>Action: Sequential verbs + micro-expressions.</li>
                <li>Style: Aesthetic + references + grading.</li>
                <li>Camera: Shot, angle, movement, lens feel.</li>
                <li>Composition: Framing, depth, focus cues.</li>
                <li>Ambiance: Lighting & mood atmosphere.</li>
                <li>Audio: Dialogue & ambient SFX (optional).</li>
              </ul>
            </div>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={submitting}
              loading={submitting}
            >
              <Sparkles className="h-4 w-4" />{" "}
              {submitting ? "Queuing..." : "Generate"}
            </Button>
          </div>
        </div>
      </form>
      <EmptyState
        icon={<ImagePlus className="h-8 w-8 text-white" />}
        title="AI image generation"
        message={
          <div>
            <p className="mb-6">
              Soon you'll be able to generate consistent, on-brand images
              powered by AI and style presets.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-brand-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Prompt</h4>
                <p className="text-base text-gray-600">Describe your concept</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Reference</h4>
                <p className="text-base text-gray-600">Upload brand images</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ImagePlus className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Results</h4>
                <p className="text-base text-gray-600">High quality outputs</p>
              </div>
            </div>
          </div>
        }
        variant="purple"
      />
      <MediaJobsList
        companyId={selectedCompanyId ? Number(selectedCompanyId) : null}
        className="mt-10"
        highlightJobId={highlightedJob}
      />
    </div>
  );
}

export default CreateAiVideo;
