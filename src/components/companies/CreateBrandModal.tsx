import { ArrowLeft, ArrowRight, Globe, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { z } from "zod";
import { useAsyncCallback } from "../../hooks/useAsync";
import { postToN8n } from "../../lib/n8n";
import { supabase, type TablesInsert } from "../../lib/supabase";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { IconButton } from "../ui/IconButton";
import { Input } from "../ui/Input";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "../ui/Modal";
import { Textarea } from "../ui/Textarea";
import { useToast } from "../ui/Toast";

interface CreateBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  refetchCompanies: () => void;
}

interface BrandFormData {
  name: string;
  website: string;
  additionalInfo: string;
  targetAudience: string;
  brandTone: string;
  keyOffer: string;
  imageGuidelines: string;
}

export function CreateBrandModal({
  isOpen,
  onClose,
  onSubmit,
  refetchCompanies,
}: CreateBrandModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<{
    name?: string;
    targetAudience?: string;
    brandTone?: string;
    keyOffer?: string;
    website?: string;
  }>({});

  // Zod schema for basic validation. Website is optional but must be a URL if provided.
  const BrandSchema = z.object({
    name: z.string().trim().min(1, "Company name is required"),
    website: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    additionalInfo: z.string().optional(),
    targetAudience: z.string().trim().min(1, "Target audience is required"),
    brandTone: z.string().trim().min(1, "Brand tone is required"),
    keyOffer: z.string().trim().min(1, "Key offer is required"),
    imageGuidelines: z.string().optional(),
  });
  // Helpers
  const normalizeWebsite = (raw?: string) => {
    const w = (raw || "").trim();
    if (!w) return "";
    return /^https?:\/\//i.test(w) ? w : `https://${w}`;
  };
  const getUserId = async () =>
    (await supabase.auth.getSession()).data.session?.user.id || null;
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const { call: runAutofill, loading: autofillLoading } = useAsyncCallback(
    async () => {
      if (!formData.website) {
        push({
          title: "Missing URL",
          message: "Enter a website URL.",
          variant: "warning",
        });
        return;
      }

      // Normalize website to include protocol to help downstream crawlers
      const normalizedWebsite = normalizeWebsite(formData.website);

      console.log("=== AUTOFILL WEBHOOK REQUEST ===");
      console.log("Sending autofill request for website:", normalizedWebsite);

      let response: Response;
      try {
        response = await postToN8n("autofill", {
          // Operation identifier (current contract)
          operation: "company_autofill",
          // Primary inputs (legacy contract fields still referenced in some n8n nodes)
          website: normalizedWebsite,
          brandName: formData.name,
          additionalInfo: formData.additionalInfo,
          // New unified brand object (newer contract expects body.brand.* for cross-operation reuse)
          brand: {
            name: formData.name,
            website: normalizedWebsite,
            additionalInfo: formData.additionalInfo,
            // Provide any existing (possibly empty) values so downstream chains can choose to skip missing ones
            targetAudience: formData.targetAudience || undefined,
            brandTone: formData.brandTone || undefined,
            keyOffer: formData.keyOffer || undefined,
            imageGuidelines: formData.imageGuidelines || undefined,
          },
          // Meta for observability/debugging
          meta: {
            user_id:
              (await supabase.auth.getSession()).data.session?.user.id || null,
            source: "app",
            ts: new Date().toISOString(),
            contract: "dual-v1+brand-object", // trace which shape we sent
          },
        });
      } catch (err) {
        console.error("Autofill network error:", err);
        push({
          title: "Autofill failed",
          message: "Network error contacting analyzer.",
          variant: "error",
        });
        return;
      }

      console.log("Autofill webhook response status:", response.status);
      console.log(
        "Autofill webhook response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        // Try fallback from Supabase if server didn't return body but may have saved data
        console.warn("Autofill server returned non-OK. Trying DB fallback...");
        const filled = await tryDbFallback(normalizedWebsite);
        if (!filled)
          push({
            title: "Autofill failed",
            message: `Server error ${response.status}.`,
            variant: "error",
          });
        return;
      }

      const responseText = await response.text();
      console.log("Raw autofill webhook response:", responseText);

      if (!responseText) {
        console.warn("Empty server response. Trying DB fallback...");
        const filled = await tryDbFallback(normalizedWebsite);
        if (!filled)
          push({
            title: "Autofill failed",
            message: "Empty server response.",
            variant: "error",
          });
        return;
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed autofill webhook response:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Raw response text:", responseText);
        // Attempt salvage parsing (handle common invalid JSON like unquoted string values)
        const salvage = () => {
          try {
            // Only attempt if it looks like an object with our keys
            if (!/targetAudience|brandTone|keyOffer/.test(responseText))
              return null;
            const pick = (key: string) => {
              const re = new RegExp('"' + key + '"\\s*:\\s*([^\n,}]+)', "i");
              const m = responseText.match(re);
              if (!m) return undefined;
              let raw = m[1].trim();
              // Remove trailing comma if captured (regex avoids but be safe)
              raw = raw.replace(/,$/, "").trim();
              // If already quoted JSON-like string, strip outer quotes then re-escape
              if (
                (raw.startsWith('"') && raw.endsWith('"')) ||
                (raw.startsWith("'") && raw.endsWith("'"))
              ) {
                raw = raw.slice(1, -1);
              }
              // Collapse internal newlines
              raw = raw.replace(/\r?\n+/g, " ").trim();
              return raw;
            };
            const ta = pick("targetAudience");
            const bt = pick("brandTone") || pick("brand_tone");
            const ko = pick("keyOffer") || pick("key_offer");
            if (!ta && !bt && !ko) return null;
            return {
              output: { targetAudience: ta, brandTone: bt, keyOffer: ko },
            };
          } catch (e) {
            console.warn("Salvage parsing failed:", e);
            return null;
          }
        };
        const salvaged = salvage();
        if (salvaged) {
          console.log("Salvaged autofill payload from invalid JSON:", salvaged);
          data = salvaged;
        } else {
          console.warn("Trying DB fallback...");
          const filled = await tryDbFallback(normalizedWebsite);
          if (!filled)
            push({
              title: "Autofill failed",
              message: "Invalid server response.",
              variant: "error",
            });
          return;
        }
      }

      // Support multiple shapes and key styles (camelCase, snake_case, nested under output/data)
      const payload = data?.output ?? data?.data ?? data;
      const getVal = (obj: any, keys: string[]) => {
        for (const k of keys) {
          if (
            obj &&
            typeof obj[k] !== "undefined" &&
            obj[k] !== null &&
            String(obj[k]).trim() !== ""
          )
            return obj[k];
        }
        return undefined;
      };

      console.log("=== UPDATING FORM DATA ===");
      const ta = getVal(payload, ["targetAudience", "target_audience"]);
      const bt = getVal(payload, ["brandTone", "brand_tone"]);
      const ko = getVal(payload, ["keyOffer", "key_offer"]);

      const stripQuotes = (s: unknown) => {
        const str = String(s ?? "").trim();
        if (!str) return "";
        const firstCode = str.charCodeAt(0);
        const lastCode = str.charCodeAt(str.length - 1);
        const isDouble = firstCode === 34 && lastCode === 34;
        const isSingle = firstCode === 39 && lastCode === 39;
        if (isDouble || isSingle) return str.slice(1, -1);
        return str;
      };

      const updates: Partial<BrandFormData> = {};
      if (typeof ta !== "undefined") updates.targetAudience = stripQuotes(ta);
      if (typeof bt !== "undefined") updates.brandTone = stripQuotes(bt);
      if (typeof ko !== "undefined") updates.keyOffer = stripQuotes(ko);

      if (Object.keys(updates).length === 0) {
        console.warn("Autofill returned no usable fields:", payload);
        const filled = await tryDbFallback(normalizedWebsite);
        if (!filled)
          push({
            title: "No suggestions",
            message: "No details found for this site.",
            variant: "warning",
          });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      console.log("Form data updated successfully");
      push({
        title: "Analyzed",
        message: "Updated from website.",
        variant: "success",
      });
    },
  );

  // Poll Supabase for company created by n8n and use it to fill brand fields (no n8n changes required)
  const tryDbFallback = async (normalizedWebsite: string) => {
    try {
      const userId = await getUserId();
      if (!userId) return false;
      // Try up to 3 times in case n8n is still writing
      for (let attempt = 0; attempt < 3; attempt++) {
        let query = supabase
          .from("companies")
          .select(
            "id, brand_name, website, target_audience, brand_tone, key_offer",
          )
          .eq("owner_id", userId)
          .eq("brand_name", formData.name)
          .order("created_at", { ascending: false })
          .limit(1);

        if (normalizedWebsite) {
          query = query.eq("website", normalizedWebsite);
        } else {
          // Look for null website if user didn't provide one
          query = (query as any).is("website", null);
        }

        const { data, error } = await query;
        if (error) {
          console.warn("DB fallback query error:", error);
          return false;
        }

        const row = data?.[0];
        const ta = row?.target_audience?.toString().trim();
        const bt = row?.brand_tone?.toString().trim();
        const ko = row?.key_offer?.toString().trim();

        if (row && (ta || bt || ko)) {
          setFormData((prev) => ({
            ...prev,
            targetAudience: ta || prev.targetAudience,
            brandTone: bt || prev.brandTone,
            keyOffer: ko || prev.keyOffer,
          }));
          push({
            title: "Analyzed",
            message: "Updated from database.",
            variant: "success",
          });
          return true;
        }

        // Wait a bit and retry
        await sleep(800);
      }
      return false;
    } catch (e) {
      console.warn("DB fallback error:", e);
      return false;
    }
  };
  const { call: runSubmit, loading: submitLoading } = useAsyncCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (
        !formData.name ||
        !formData.targetAudience ||
        !formData.brandTone ||
        !formData.keyOffer
      ) {
        push({
          title: "Missing fields",
          message: "Complete all required fields.",
          variant: "warning",
        });
        return;
      }

      // Ensure website conforms to DB URL check (must start with http/https)
      const normalizedWebsite = normalizeWebsite(formData.website);

      const brandData: TablesInsert<"companies"> = {
        brand_name: formData.name,
        website: normalizedWebsite || null,
        additional_information: formData.additionalInfo,
        target_audience: formData.targetAudience,
        brand_tone: formData.brandTone,
        key_offer: formData.keyOffer,
      };

      console.log("Creating company in Supabase:", brandData);

      // If n8n already created a company during Autofill, update it instead of inserting a duplicate
      const userId = await getUserId();
      let existingId: number | null = null;
      if (userId) {
        try {
          let q = supabase
            .from("companies")
            .select("id")
            .eq("owner_id", userId)
            .eq("brand_name", formData.name)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (normalizedWebsite) {
            q = q.eq("website", normalizedWebsite) as any;
          } else {
            q = (q as any).is("website", null);
          }

          const { data: ex, error: exErr } = await q;
          if (!exErr && ex?.id) existingId = ex.id;
        } catch (err) {
          console.warn("Existing company check failed:", err);
        }
      }

      const action: "insert" | "update" = existingId ? "update" : "insert";
      let dbError: any = null;
      if (action === "update" && existingId) {
        const { error } = await supabase
          .from("companies")
          .update(brandData)
          .eq("id", existingId)
          .select();
        dbError = error;
      } else {
        const { error } = await supabase
          .from("companies")
          .insert([brandData])
          .select();
        dbError = error;
      }

      if (dbError) {
        console.error("Supabase error:", dbError);
        push({
          title: action === "update" ? "Update failed" : "Create failed",
          message: `${dbError.message}`,
          variant: "error",
        });
        return;
      }

      console.log(`Company ${action}d successfully`);
      push({
        title: action === "update" ? "Updated" : "Created",
        message: action === "update" ? "Company updated." : "Company added.",
        variant: "success",
      });

      // Reset form and close modal
      resetForm();
      refetchCompanies(); // Refresh the companies list
      onSubmit();
    },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<BrandFormData>({
    name: "",
    website: "",
    additionalInfo: "",
    targetAudience: "",
    brandTone: "",
    keyOffer: "",
    imageGuidelines: "",
  });
  const { push } = useToast();

  const handleAutofill = () => {
    void runAutofill();
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Step 1 only requires a name to proceed; defer strict URL validation to final submit
      const nameOk = formData.name.trim().length > 0;
      const e: typeof errors = {};
      if (!nameOk) {
        e.name = "Company name is required";
      }
      setErrors(e);
      if (!nameOk) return;
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    // Validate full payload
    const result = BrandSchema.safeParse(formData);
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors;
      const eState: typeof errors = {
        name: issues.name?.[0],
        website: issues.website?.[0],
        targetAudience: issues.targetAudience?.[0],
        brandTone: issues.brandTone?.[0],
        keyOffer: issues.keyOffer?.[0],
      };
      setErrors(eState);
      e.preventDefault();
      push({
        title: "Fix errors",
        message: "Complete the required fields before submitting.",
        variant: "warning",
      });
      return;
    }
    void runSubmit(e);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      website: "",
      additionalInfo: "",
      targetAudience: "",
      brandTone: "",
      keyOffer: "",
      imageGuidelines: "",
    });
    setCurrentStep(1);
  };

  const handleClose = () => {
    const isDirty = Object.values(formData).some(
      (v) => String(v || "").trim().length > 0,
    );
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    resetForm();
    onClose();
  };

  // Keep component mounted; Modal handles visibility and exit animations

  const titleId = "create-brand-title";
  const missingMap: Record<string, string> = {
    name: "Company name",
    targetAudience: "Target audience",
    brandTone: "Brand tone",
    keyOffer: "Key offer",
  };
  const missingFields = Object.entries({
    name: !formData.name.trim(),
    targetAudience: !formData.targetAudience.trim(),
    brandTone: !formData.brandTone.trim(),
    keyOffer: !formData.keyOffer.trim(),
  })
    .filter(([, v]) => v)
    .map(([k]) => missingMap[k]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} labelledById={titleId}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <ModalHeader>
          <div className="flex items-center space-x-4">
            <IconButton
              onClick={() =>
                currentStep === 2 ? handlePrevious() : handleClose()
              }
              aria-label="Back"
              variant="ghost"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </IconButton>
            <div>
              <ModalTitle id={titleId} className="text-base">
                {currentStep === 1
                  ? "Create company – Basics"
                  : "Create company – Brand details"}
              </ModalTitle>
              <div className="text-base text-gray-500">Back</div>
            </div>
          </div>
          <IconButton
            onClick={handleClose}
            aria-label="Close dialog"
            variant="ghost"
          >
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </ModalHeader>

        <ModalBody>
          {currentStep === 1 ? (
            <div className="space-y-6">
              <p className="text-base font-medium text-gray-500">Step 1 of 2</p>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Basics
                </h2>
              </div>

              <div className="space-y-6">
                <Input
                  label="Company name"
                  placeholder="Brand name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  error={errors.name}
                  required
                  data-autofocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                />

                <Input
                  label="Website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                />

                <Textarea
                  label="Additional info (optional)"
                  placeholder="Add context about the brand…"
                  value={formData.additionalInfo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      additionalInfo: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              <div className="flex flex-col items-end">
                <Button
                  onClick={handleNext}
                  size="lg"
                  disabled={!formData.name.trim()}
                  aria-describedby={
                    !formData.name.trim() ? "step1-next-help" : undefined
                  }
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                {!formData.name.trim() && (
                  <p
                    id="step1-next-help"
                    className="text-base text-gray-500 mt-2"
                  >
                    Enter a company name to continue.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-base font-medium text-gray-500">Step 2 of 2</p>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Brand details
                  </h2>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="text-base">Let AI help</span>
                    <span className="text-base text-gray-500 ml-2">
                      We can analyze your site to suggest details
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAutofill}
                  loading={autofillLoading}
                  disabled={!formData.website}
                  className="flex items-center"
                >
                  <Sparkles className="h-4 w-4" />
                  Autofill
                </Button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                /* Removed keydown form handler to satisfy a11y rule: rely on required fields + submit validation */
              >
                <Textarea
                  label="Target audience"
                  placeholder="Describe your target audience…"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      targetAudience: e.target.value,
                    }))
                  }
                  rows={3}
                  error={errors.targetAudience}
                  required
                />

                <Textarea
                  label="Brand tone"
                  placeholder="Describe your brand tone…"
                  value={formData.brandTone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brandTone: e.target.value,
                    }))
                  }
                  rows={3}
                  error={errors.brandTone}
                  required
                />

                <Textarea
                  label="Key offer"
                  placeholder="What's your main value proposition?"
                  value={formData.keyOffer}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      keyOffer: e.target.value,
                    }))
                  }
                  rows={3}
                  error={errors.keyOffer}
                  required
                />

                <Textarea
                  label="Image guidelines (optional)"
                  placeholder="Any guidelines for generated images…"
                  value={formData.imageGuidelines}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageGuidelines: e.target.value,
                    }))
                  }
                  rows={3}
                />

                <div className="flex justify-between items-start pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevious}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <Button
                    type="submit"
                    loading={submitLoading}
                    size="lg"
                    disabled={
                      !formData.name.trim() ||
                      !formData.targetAudience.trim() ||
                      !formData.brandTone.trim() ||
                      !formData.keyOffer.trim()
                    }
                    aria-describedby={
                      missingFields.length > 0 ? "final-submit-help" : undefined
                    }
                  >
                    Add company
                  </Button>
                </div>
                {missingFields.length > 0 && (
                  <p
                    id="final-submit-help"
                    className="text-base text-gray-600 text-right mt-2"
                  >
                    Complete required fields: {missingFields.join(", ")}.
                  </p>
                )}
              </form>
            </div>
          )}
        </ModalBody>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          resetForm();
          onClose();
        }}
        title="Discard changes?"
        message="Unsaved changes will be lost."
        confirmText="Discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </Modal>
  );
}
