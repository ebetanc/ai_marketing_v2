import React from "react";
import { ImagePlus, Sparkles, Upload } from "lucide-react";
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
  const [numImages, setNumImages] = React.useState<number>(4);
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
              duration_seconds: 8,
            });
            push({
              title: "Video generation queued",
              message: `Job #${job.id}`,
              variant: "success",
            });
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
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Number of images"
            type="number"
            min={1}
            max={10}
            required
            value={numImages}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) {
                setNumImages(Math.min(10, Math.max(1, v)));
              } else {
                setNumImages(1);
              }
            }}
            placeholder="4"
            description="How many variants (max 10)."
            name="numImages"
          />
          <div className="space-y-1 md:col-span-2">
            <label
              htmlFor="aspectRatio"
              className="block text-sm font-medium text-gray-700"
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
            <p className="text-xs text-gray-500">
              Output orientation (square / wide / vertical).
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
            <h3 className="text-sm font-semibold text-gray-700">
              Assembled prompt preview
            </h3>
            <pre
              className="whitespace-pre-wrap rounded-xl border-2 border-gray-200 bg-white p-4 text-xs text-gray-800 min-h-[180px]"
              aria-label="Prompt preview"
            >
              {assembledPrompt ||
                "Fill fields to build your structured prompt."}
            </pre>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-4">
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
                <p className="text-sm text-gray-600">Describe your concept</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Reference</h4>
                <p className="text-sm text-gray-600">Upload brand images</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <ImagePlus className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Results</h4>
                <p className="text-sm text-gray-600">High quality outputs</p>
              </div>
            </div>
          </div>
        }
        variant="purple"
      />
      <MediaJobsList
        companyId={selectedCompanyId ? Number(selectedCompanyId) : null}
        className="mt-10"
      />
    </div>
  );
}

export default CreateAiVideo;
