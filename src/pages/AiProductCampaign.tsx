import React from "react";
import { Image, Film, PackageOpen, Loader2 } from "lucide-react";
import { PageContainer } from "../components/layout/PageContainer";
import { PageHeader } from "../components/layout/PageHeader";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Textarea } from "../components/ui/Textarea";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { n8nCall, PRODUCT_CAMPAIGN_IDENTIFIER } from "../lib/n8n";
import { N8N_PRODUCT_CAMPAIGN_WEBHOOK_PATH } from "../lib/n8n";
import {
  uploadFileToSupabaseStorage,
  isSupabaseConfigured,
} from "../lib/supabase";

// Contract fields (identifier productCampaign; meta.contract auto -> product-campaign-v1)
interface CampaignFields {
  objective: string;
  description: string;
  aspectRatio: string;
  model: string;
}

export function AiProductCampaign() {
  useDocumentTitle("AI Product Campaign — Lighting");
  const [campaign, setCampaign] = React.useState<CampaignFields>({
    objective: "Increase brand awareness",
    description: "Summer launch of eco-friendly lighting fixtures",
    aspectRatio: "16:9",
    model: "sdxl-turbo",
  });
  const [userRequest, setUserRequest] = React.useState("");
  const [assets, setAssets] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{
    done: number;
    total: number;
  }>({ done: 0, total: 0 });
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function update<K extends keyof CampaignFields>(k: K, v: string) {
    setCampaign((c) => ({ ...c, [k]: v }));
  }

  async function handleAssets(files: FileList | null) {
    if (!files?.length) return;
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured (missing env). Cannot upload assets. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setUploading(true);
    setError(null);
    const incoming = Array.from(files);
    setUploadProgress({ done: 0, total: incoming.length });
    try {
      const uploaded: string[] = [];
      const concurrency = 3;
      let index = 0;
      async function worker() {
        while (index < incoming.length) {
          const current = incoming[index++];
          const path = `product-campaign/${Date.now()}-${Math.random()
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
                prev || `Failed uploading one or more assets: ${e?.message}`,
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
      if (uploaded.length) setAssets((a) => [...a, ...uploaded]);
    } catch (e: any) {
      setError(e?.message || "Failed attaching assets");
    } finally {
      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  }

  async function send(operation: "generateImages" | "generateVideo") {
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const simplePayload = {
        identifier: "productCampaign",
        operation: operation,
        user_request: userRequest.trim(),
      };

      console.log("Sending simple payload:", simplePayload);

      const response = await fetch("http://localhost:5678/webhook/content-workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(simplePayload),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);
      
      setResult(
        responseText ? JSON.parse(responseText) : { status: response.status }
      );
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (e: any) {
      console.error("Simple request failed:", e);
      setError(e?.message || "Request failed. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="AI Product Campaign"
        description="Generate campaign creative assets (images or video) from a single brief."
        icon={<PackageOpen className="h-5 w-5" />}
      />
      <div className="mt-8 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-3 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Objective"
              value={campaign.objective}
              onChange={(e) => update("objective", e.target.value)}
            />
            <Input
              label="Aspect Ratio"
              value={campaign.aspectRatio}
              onChange={(e) => update("aspectRatio", e.target.value)}
            />
            <Input
              label="Model"
              value={campaign.model}
              onChange={(e) => update("model", e.target.value)}
            />
            <Textarea
              label="Description"
              value={campaign.description}
              onChange={(e) => update("description", e.target.value)}
              className="md:col-span-2 min-h-[120px]"
            />
          </div>
          <Textarea
            label="User Prompt"
            placeholder="Describe the desired look, branding elements, mood, etc."
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            description="Sent as user_request in contract."
            className="min-h-[160px]"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || sending}
              >
                <Image className="h-4 w-4" /> Add Reference Images
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleAssets(e.target.files)}
              />
              {assets.length > 0 && (
                <span className="text-sm text-gray-600">
                  {assets.length} asset{assets.length > 1 ? "s" : ""} attached
                </span>
              )}
              {uploading && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading{" "}
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              )}
            </div>
            {assets.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {assets.map((u, i) => (
                  <img
                    key={i}
                    src={u}
                    alt="asset"
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => send("generateImages")}
              disabled={!userRequest.trim() || sending}
              loading={sending}
            >
              <Image className="h-4 w-4" /> Generate Images
            </Button>
            <Button
              variant="secondary"
              onClick={() => send("generateVideo")}
              disabled={!userRequest.trim() || sending}
              loading={sending}
            >
              <Film className="h-4 w-4" /> Generate Video
            </Button>
            <Button
              variant="ghost"
              disabled={sending || uploading}
              onClick={() => {
                setCampaign({
                  objective: "",
                  description: "",
                  aspectRatio: "16:9",
                  model: "sdxl-turbo",
                });
                setUserRequest("");
                setAssets([]);
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
              <li>identifier: productCampaign</li>
              <li>process: generateImages | generateVideo</li>
              <li>user_request, campaign, upload_assets</li>
              <li>meta.contract: product-campaign-v1</li>
            </ul>
            <p className="text-xs text-gray-500">
              This UI calls n8n webhooks via unified helper ensuring request_id & contract are attached automatically.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default AiProductCampaign;
