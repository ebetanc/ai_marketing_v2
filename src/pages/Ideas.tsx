import React, { useEffect, useMemo, useRef, useState } from "react";
import { n8nCall } from "../lib/n8n";
import {
  FileText,
  Lightbulb,
  RefreshCw,
  Target,
  X,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { IconButton } from "../components/ui/IconButton";
import { Modal } from "../components/ui/Modal";
import { ModalBrandHeader } from "../components/ui/ModalBrandHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { supabase, type Tables } from "../lib/supabase";
import { formatDate, truncateText } from "../lib/utils";
import IdeaSetListItem from "../components/ideas/IdeaSetListItem";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useAsyncCallback } from "../hooks/useAsync";
import { z } from "zod";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

// Helper: Extract topics from an idea row
const extractTopicsFromIdea = (
  idea: any,
): {
  number: number;
  topic: string;
  description: string;
  image_prompt: string;
}[] => {
  const topics: {
    number: number;
    topic: string;
    description: string;
    image_prompt: string;
  }[] = [];
  for (let i = 1; i <= 10; i++) {
    const topic = idea?.[`topic${i}`];
    const description =
      idea?.[`idea_description${i}`] ?? idea?.[`description${i}`];
    const image_prompt = idea?.[`image_prompt${i}`];
    if (topic && String(topic).trim()) {
      topics.push({
        number: i,
        topic: String(topic),
        description: String(description || ""),
        image_prompt: String(image_prompt || ""),
      });
    }
  }
  return topics;
};

export function Ideas() {
  useDocumentTitle("Ideas — Lighting");
  type CompanyRow = Tables<"companies">;
  type StrategyRow = Tables<"strategies">;
  type IdeaRow = Tables<"ideas">;
  type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow };
  type Topic = {
    number: number;
    topic: string;
    description: string;
    image_prompt: string;
  };

  const [ideas, setIdeas] = useState<IdeaJoined[]>([]);
  const [collapsedBrands, setCollapsedBrands] = useState<
    Record<string, boolean>
  >({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewIdeaModal, setViewIdeaModal] = useState<{
    isOpen: boolean;
    idea: IdeaJoined | null;
    topic: Topic | null;
    isEditing: boolean;
    hasGeneratedContent: boolean;
    checkingGenerated?: boolean;
  }>({
    isOpen: false,
    idea: null,
    topic: null,
    isEditing: false,
    hasGeneratedContent: false,
    checkingGenerated: false,
  });
  const [editForm, setEditForm] = useState({
    topic: "",
    description: "",
    image_prompt: "",
  });
  const [editErrors, setEditErrors] = useState<{
    topic?: string;
    description?: string;
    image_prompt?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  // per-topic generation state maps
  const [topicGenerating, setTopicGenerating] = useState<
    Record<string, boolean>
  >({});
  const [topicGenerated, setTopicGenerated] = useState<Record<string, boolean>>(
    {},
  );
  // no longer showing entire idea set modal; we expand inline
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    idea: IdeaJoined | null;
    loading: boolean;
  }>({
    isOpen: false,
    idea: null,
    loading: false,
  });
  const [deleteTopicDialog, setDeleteTopicDialog] = useState<{
    isOpen: boolean;
    loading: boolean;
  }>({ isOpen: false, loading: false });
  const { push, remove } = useToast();

  // initial load handled in the effect after fetchIdeas definition

  const fetchIdeas = useCallback(
    async (showToast = false) => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching ideas from Supabase...");

        let data: IdeaJoined[] | null = null;
        let error: unknown = null;
        try {
          const res = await supabase
            .from("ideas")
            .select(
              `
            *,
            strategy:strategies (*),
            company:companies (*)
          `,
            )
            .order("created_at", { ascending: false });
          data = res.data as unknown as IdeaJoined[] | null;
          error = res.error;
        } catch (e) {
          console.warn(
            "Relational select failed, falling back to basic select. Error:",
            e,
          );
        }
        if (!data || error) {
          const res2 = await supabase
            .from("ideas")
            .select("*")
            .order("created_at", { ascending: false });
          data = res2.data as unknown as IdeaRow[] | null as unknown as
            | IdeaJoined[]
            | null;
          error = res2.error;
        }

        console.log("=== SUPABASE IDEAS DEBUG ===");
        console.log("Raw Supabase response:", { data, error });
        console.log("Data array length:", data?.length);
        console.log("First idea object:", data?.[0]);
        console.log("All idea objects:", data);
        console.log(
          "Available columns in first idea:",
          data?.[0] ? Object.keys(data[0]) : "No data",
        );

        if (error) {
          console.error("Error fetching ideas from Supabase:", error);
          setError(
            error instanceof Error ? error.message : "Failed to fetch ideas",
          );
          setIdeas([]);
          if (showToast) {
            push({
              title: "Refresh failed",
              message: "Could not update ideas",
              variant: "error",
            });
          }
        } else {
          console.log(
            "Ideas fetched successfully:",
            data?.length || 0,
            "records",
          );
          console.log("Setting ideas state with:", data);
          setIdeas(data || []);
          if (showToast) {
            push({
              title: "Refreshed",
              message: "Ideas updated",
              variant: "success",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching ideas from Supabase:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch ideas");
        setIdeas([]);
        if (showToast) {
          push({
            title: "Refresh failed",
            message: "Could not update ideas",
            variant: "error",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [push],
  );

  // Ensure we only auto-fetch once per mount (guards against StrictMode double-effect and callback identity changes)
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    // Fire and forget; internal loading state handles UI
    void fetchIdeas(false);
  }, [fetchIdeas]);

  const handleEditToggle = () => {
    const entering = !viewIdeaModal.isEditing;
    setViewIdeaModal((prev) => ({ ...prev, isEditing: entering }));
    if (entering) {
      // Hydrate form with current topic values
      setEditForm({
        topic: viewIdeaModal.topic?.topic || "",
        description: viewIdeaModal.topic?.description || "",
        image_prompt: viewIdeaModal.topic?.image_prompt || "",
      });
    } else {
      // Leaving edit mode (cancel) restore values from topic
      setEditForm({
        topic: viewIdeaModal.topic?.topic || "",
        description: viewIdeaModal.topic?.description || "",
        image_prompt: viewIdeaModal.topic?.image_prompt || "",
      });
    }
  };

  const { call: saveChangesCall } = useAsyncCallback(async () => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return;
    const topicNumber = viewIdeaModal.topic.number;

    const baseColumnIndex = 8 + (topicNumber - 1) * 3; // 9 for topic 1, 12 for topic 2, etc.

    const columns = Object.keys(viewIdeaModal.idea).sort();

    const topicColumn = columns[baseColumnIndex] || `topic${topicNumber}`;
    const descriptionColumn =
      columns[baseColumnIndex + 1] || `description${topicNumber}`;
    const imagePromptColumn =
      columns[baseColumnIndex + 2] || `image_prompt${topicNumber}`;

    // Validate edit form
    const EditSchema = z.object({
      topic: z.string().trim().min(1, "Topic is required."),
      description: z.string().trim().optional(),
      image_prompt: z.string().trim().optional(),
    });
    const parsed = EditSchema.safeParse(editForm);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setEditErrors({
        topic: issues.topic?.[0],
        description: issues.description?.[0],
        image_prompt: issues.image_prompt?.[0],
      });
      push({
        title: "Fix errors",
        message: "Complete the required fields.",
        variant: "warning",
      });
      return;
    }

    const updateData = {
      [topicColumn]: parsed.data.topic,
      [descriptionColumn]: parsed.data.description || "",
      [imagePromptColumn]: parsed.data.image_prompt || "",
    };

    console.log("=== SAVE TOPIC OPERATION DEBUG ===");
    console.log("Idea ID:", viewIdeaModal.idea.id);
    console.log("Topic Number:", topicNumber);
    console.log("Column mappings:", {
      topicColumn,
      descriptionColumn,
      imagePromptColumn,
    });
    console.log("Update Data:", updateData);

    const { error } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", viewIdeaModal.idea.id);

    console.log("Supabase Update Response Error:", error);

    if (error) throw error;

    console.log("Topic updated successfully");

    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id === viewIdeaModal.idea!.id) {
          return { ...idea, ...updateData };
        }
        return idea;
      }),
    );

    const updatedTopic = {
      ...viewIdeaModal.topic,
      topic: editForm.topic,
      description: editForm.description,
      image_prompt: editForm.image_prompt,
    };

    setViewIdeaModal((prev) => ({
      ...prev,
      topic: updatedTopic,
      isEditing: false,
    }));

    await fetchIdeas();

    push({ title: "Saved", message: "Changes updated", variant: "success" });
  });

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const res = await saveChangesCall();
      if (res && "error" in res && res.error) {
        throw res.error;
      }
    } catch (error) {
      console.error("Error saving changes:", error);
      push({
        title: "Save failed",
        message: `${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // removed handleViewIdeaSet; inline expansion instead

  const openDeleteDialog = (idea: IdeaJoined) => {
    setDeleteDialog({ isOpen: true, idea, loading: false });
  };

  const { call: runDeleteIdea } = useAsyncCallback(async () => {
    if (!deleteDialog.idea) return;
    const id = deleteDialog.idea.id;
    const { error } = await supabase.from("ideas").delete().eq("id", id);
    if (error) throw error;
    // remove from local state
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    // close modals referencing this idea
    // removed idea set modal close
    setViewIdeaModal((prev) =>
      prev.idea?.id === id
        ? {
            isOpen: false,
            idea: null,
            topic: null,
            isEditing: false,
            hasGeneratedContent: false,
          }
        : prev,
    );
    push({ title: "Deleted", message: "Idea Set removed", variant: "success" });
    setDeleteDialog({ isOpen: false, idea: null, loading: false });
  });

  const confirmDeleteIdea = () => {
    void runDeleteIdea();
  };
  const cancelDeleteIdea = () =>
    setDeleteDialog({ isOpen: false, idea: null, loading: false });

  // Delete individual topic (soft delete by nulling its columns)
  const { call: runDeleteTopic } = useAsyncCallback(async () => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return;
    const topicNumber = viewIdeaModal.topic.number;
    const columns = Object.keys(viewIdeaModal.idea).sort();
    const baseColumnIndex = 8 + (topicNumber - 1) * 3;
    const topicColumn = columns[baseColumnIndex] || `topic${topicNumber}`;
    const descriptionColumn =
      columns[baseColumnIndex + 1] || `idea_description${topicNumber}`;
    const imagePromptColumn =
      columns[baseColumnIndex + 2] || `image_prompt${topicNumber}`;
    const updateData: Record<string, any> = {
      [topicColumn]: null,
      [descriptionColumn]: null,
      [imagePromptColumn]: null,
    };
    const { error } = await supabase
      .from("ideas")
      .update(updateData)
      .eq("id", viewIdeaModal.idea.id);
    if (error) throw error;
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === viewIdeaModal.idea!.id ? { ...i, ...updateData } : i,
      ),
    );
    // previously updated idea set modal topics; removed after inline expansion refactor
    setViewIdeaModal((prev) => ({
      ...prev,
      isOpen: false,
      topic: null,
      isEditing: false,
    }));
    push({
      title: "Deleted",
      message: "Idea removed from set",
      variant: "success",
    });
    setDeleteTopicDialog({ isOpen: false, loading: false });
  });
  const confirmDeleteTopic = () => {
    setDeleteTopicDialog((d) => ({ ...d, loading: true }));
    void runDeleteTopic();
  };
  const cancelDeleteTopic = () =>
    setDeleteTopicDialog({ isOpen: false, loading: false });

  // removed handleCloseIdeaSetModal

  const handleFormChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setEditErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCloseViewModal = () => {
    setViewIdeaModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleViewTopic = (idea: IdeaJoined, topic: Topic) => {
    setViewIdeaModal({
      isOpen: true,
      idea,
      topic,
      isEditing: false,
      hasGeneratedContent: false,
      checkingGenerated: true,
    });
    // Hydrate edit form immediately so entering edit shows existing values
    setEditForm({
      topic: topic.topic || "",
      description: topic.description || "",
      image_prompt: topic.image_prompt || "",
    });
    // Check for previously generated content for this idea/topic
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("content")
          .select("id, content_body, idea_id")
          .eq("idea_id", idea.id);
        if (error) throw error;
        const topicLower = (topic.topic || "").toLowerCase();
        const match = (data || []).some((row: any) =>
          (row as any).content_body?.toLowerCase().includes(topicLower),
        );
        setViewIdeaModal((prev) =>
          prev.idea?.id === idea.id && prev.topic?.number === topic.number
            ? { ...prev, hasGeneratedContent: match, checkingGenerated: false }
            : prev,
        );
      } catch (e) {
        console.warn("Failed to check generated content:", e);
        setViewIdeaModal((prev) =>
          prev.idea?.id === idea.id && prev.topic?.number === topic.number
            ? { ...prev, checkingGenerated: false }
            : prev,
        );
      }
    })();
  };

  // Refactored: allow passing idea/topic directly (inline button) without relying on modal state timing.
  const { call: generateContentCall } = useAsyncCallback(
    async (ideaOverride?: IdeaJoined, topicOverride?: Topic) => {
      // Determine active context
      const activeIdea = ideaOverride ?? viewIdeaModal.idea;
      const activeTopic = topicOverride ?? viewIdeaModal.topic;
      if (!activeIdea || !activeTopic) return;

      // Prevent duplicate generation: check if content already exists for this idea/topic
      try {
        const topicLowerCheck = (activeTopic.topic || "").toLowerCase();
        const { data: existingContent, error: existingErr } = await supabase
          .from("content")
          .select("content_body, idea_id")
          .eq("idea_id", activeIdea.id);
        if (!existingErr && Array.isArray(existingContent)) {
          const duplicate = existingContent.some((row: any) =>
            (row?.content_body || "").toLowerCase().includes(topicLowerCheck),
          );
          if (duplicate) {
            throw new Error("Content already generated for this topic.");
          }
        }
      } catch (dupCheckErr) {
        throw dupCheckErr;
      }

      console.log("=== FETCHING COMPANY DETAILS ===");
      console.log("Idea company_id:", activeIdea.company_id);

      let companyData: CompanyRow | null = null;
      let companyError: unknown = null;
      if (activeIdea.company_id) {
        const res = await supabase
          .from("companies")
          .select("*")
          .eq("id", activeIdea.company_id)
          .single();
        companyData = res.data as CompanyRow | null;
        companyError = res.error;
      }

      if (companyError) {
        console.error("Error fetching company details:", companyError);
        console.log("Continuing without company details...");
      }

      console.log("Company data fetched:", companyData);

      console.log("=== FETCHING STRATEGY AND ANGLE DETAILS ===");
      console.log("Strategy ID:", activeIdea.strategy_id);
      console.log("Angle Number:", activeIdea.angle_number);

      let strategyData: StrategyRow | null = null;
      let angleDetails: {
        number: number;
        header: string;
        description: string;
        objective: string;
        tonality: string;
      } | null = null;

      if (activeIdea.strategy_id && activeIdea.angle_number) {
        const { data: strategy, error: strategyError } = await supabase
          .from("strategies")
          .select("*")
          .eq("id", activeIdea.strategy_id)
          .single();

        if (strategyError) {
          console.error("Error fetching strategy details:", strategyError);
          console.log("Continuing without strategy details...");
        } else {
          strategyData = strategy as StrategyRow;

          const angleNumber = activeIdea.angle_number;
          angleDetails = {
            number: angleNumber,
            header: (strategy as any)[`angle${angleNumber}_header`] || "",
            description:
              (strategy as any)[`angle${angleNumber}_description`] || "",
            objective: (strategy as any)[`angle${angleNumber}_objective`] || "",
            tonality: (strategy as any)[`angle${angleNumber}_tonality`] || "",
          };

          console.log("Strategy data fetched:", strategyData);
          console.log("Angle details extracted:", angleDetails);
        }
      }

      // n8n contract safeguard: ensure angleDetails object always exists for template fields
      if (!angleDetails) {
        angleDetails = {
          number: activeIdea.angle_number ?? 0,
          header: "Unknown Strategy",
          description: "",
          objective: "",
          tonality: "",
        };
        console.log("Applied fallback angleDetails", angleDetails);
      }

      const topicData = {
        topicNumber: activeTopic.number,
        topic: activeTopic.topic,
        description: activeTopic.description,
        image_prompt: activeTopic.image_prompt,
        idea: {
          id: activeIdea.id,
          brand:
            companyData?.brand_name ||
            activeIdea.company?.brand_name ||
            "Unknown Brand",
          strategy_id: activeIdea.strategy_id,
          angle_number: activeIdea.angle_number,
          created_at: activeIdea.created_at,
        },
      };

      // Derive normalized-first fields from companyData for consistent payloads
      const brandName: string =
        companyData?.brand_name ||
        activeIdea.company?.brand_name ||
        "Unknown Brand";
      const website: string = companyData?.website || "";
      const tone: string = companyData?.brand_tone || "";
      const style: string = companyData?.key_offer || "";
      const targetAudienceStr: string = companyData?.target_audience || "";
      const additionalInfo: string = companyData?.additional_information || "";

      const { data: genSession } = await supabase.auth.getSession();
      const userId = genSession.session?.user.id || null;

      // Normalize platforms from strategy or use a sensible default. n8n Switch expects
      // string items at fixed indices (platforms[0]..platforms[7]).
      const normalizePlatforms = (
        platforms: string | null | undefined,
      ): string[] => {
        if (!platforms) return [];
        try {
          const parsed = JSON.parse(platforms);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          /* not JSON */
        }
        return String(platforms)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      };

      const normalizedPlatforms = normalizePlatforms(
        strategyData?.platforms || null,
      ).map((p) => p.toLowerCase());
      // Fixed platform order to reserve indexes consistently
      const PLATFORM_ORDER = [
        "twitter",
        "linkedin",
        "newsletter",
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "blog",
      ];
      const platformsSlotted: string[] = PLATFORM_ORDER.map(() => "");
      normalizedPlatforms.forEach((p) => {
        const idx = PLATFORM_ORDER.indexOf(p);
        if (idx !== -1) platformsSlotted[idx] = p;
      });

      const companyDetailsPayload = {
        id: companyData?.id ?? activeIdea.company_id,
        name: brandName,
        website,
        brandTone: tone,
        keyOffer: style,
        targetAudience: targetAudienceStr,
        additionalInfo,
      };

      const webhookPayload = {
        identifier: "generateContent",
        operation: "generate_content_from_idea",
        meta: {
          user_id: userId,
          source: "app",
          ts: new Date().toISOString(),
        },
        user_id: userId,
        // Core identifiers for downstream CRUD
        company_id: activeIdea.company_id,
        strategy_id: activeIdea.strategy_id,
        idea_id: activeIdea.id,
        topic_number: activeTopic.number,
        topic: topicData,
        // Fixed-length string array for n8n Switch node compatibility
        platforms: platformsSlotted,
        // Fields expected by various n8n nodes (brand, data.brandData, etc.)
        brand: {
          id: companyData?.id ?? activeIdea.company_id,
          name: brandName,
          additionalInfo,
          targetAudience: targetAudienceStr,
          brandTone: tone,
          keyOffer: style,
          website,
        },
        brandDetails: {
          id: companyData?.id ?? activeIdea.company_id,
          name: brandName,
        },
        data: {
          brandData: {
            id: companyData?.id ?? activeIdea.company_id,
            name: brandName,
            keyOffer: style,
          },
        },
        // Always provide an object for companyDetails so n8n prompt templates resolve keys
        companyDetails: companyDetailsPayload,
        // SPECIFIC ANGLE DETAILS THAT GENERATED THIS IDEA
        angleDetails: angleDetails,
        // FULL STRATEGY CONTEXT
        strategyContext: strategyData
          ? {
              id: strategyData.id,
              brand: brandName,
              name: brandName,
              description: "No strategy description available",
              platforms: strategyData.platforms,
              created_at: strategyData.created_at,
              totalAngles: (() => {
                let count = 0;
                for (let i = 1; i <= 10; i++) {
                  if ((strategyData as any)[`angle${i}_header`]) count++;
                }
                return count;
              })(),
            }
          : null,
        // REQUIRED FIELDS FOR AI AGENT CONTEXT
        aiContext: {
          strategyName: brandName,
          strategyDescription: "No strategy description available",
          tonality: angleDetails?.tonality || "No tonality specified",
          objective: angleDetails?.objective || "No objective specified",
          keyOffer: style || "No key offer specified",
          brandTone: tone || "No brand tone specified",
          targetAudience: targetAudienceStr || "No target audience specified",
          platforms: platformsSlotted,
          contentType: "idea_to_content_generation",
        },
        context: {
          requestType: "generate_content_from_idea",
          timestamp: new Date().toISOString(),
          hasCompanyDetails: !!companyData,
          hasAngleDetails: !!angleDetails,
          hasStrategyContext: !!strategyData,
          ideaSetId: activeIdea.id,
          topicNumber: activeTopic.number,
        },
      };

      console.log("=== ENHANCED GENERATE CONTENT WEBHOOK ===");
      console.log("Sending payload:", webhookPayload);
      console.log("Company details included:", !!companyData);
      console.log("Angle details included:", !!angleDetails);
      console.log("Strategy context included:", !!strategyData);

      // WEBHOOK SENDING DISABLED FOR ANALYSIS
      // const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(webhookPayload)
      // })

      // console.log('Webhook response status:', response.status)

      // if (!response.ok) {
      //   throw new Error(`Webhook failed with status: ${response.status}`)
      // }

      // const responseText = await response.text()
      // console.log('Raw webhook response:', responseText)

      // let result
      // try {
      //   result = JSON.parse(responseText)
      // } catch (parseError) {
      //   console.error('Failed to parse JSON response:', parseError)
      //   console.error('Raw response text:', responseText)
      //   // If JSON parsing fails, treat as success if status is ok
      //   result = { message: 'Content generation started' }
      // }

      // console.log('Webhook response:', result)

      console.log("=== FINAL WEBHOOK PAYLOAD FOR ANALYSIS ===");
      console.log(JSON.stringify(webhookPayload, null, 2));

      console.log("=== MAKING WEBHOOK REQUEST ===");
      let result;
      try {
        const { company_id, strategy_id, idea_id, topic, platforms, ...rest } =
          webhookPayload as any;
        result = await n8nCall(
          "generateContent",
          {
            company_id,
            strategy_id,
            idea_id,
            topic,
            platforms,
            ...rest,
          },
          { platforms },
        );
      } catch (e) {
        throw e;
      }
      console.log("Webhook response status:", result.status);
      if (!result.ok) {
        throw new Error(`Webhook failed with status: ${result.status}`);
      }
      if (result.data) {
        console.log("Webhook JSON response:", result.data);
      } else {
        console.log("Webhook raw response:", result.rawText);
      }
    },
  );

  // Unified generation logic for both modal button and inline topic buttons
  const runTopicGeneration = useCallback(
    async (
      idea: IdeaJoined,
      topic: Topic,
      options: { viaModal?: boolean } = {},
    ) => {
      const { viaModal } = options;
      const key = `${idea.id}-${topic.number}`;
      if (!idea || !topic) return;
      if (topicGenerated[key]) return; // already done
      // Prevent duplicate inline invocations
      if (!viaModal && topicGenerating[key]) return;

      // Extra server-side duplicate guard (in case page reloaded or not yet flagged)
      try {
        const topicLowerCheck = (topic.topic || "").toLowerCase();
        const { data: existingContent, error: existingErr } = await supabase
          .from("content")
          .select("content_body, idea_id")
          .eq("idea_id", idea.id);
        if (!existingErr && Array.isArray(existingContent)) {
          const duplicate = existingContent.some((row: any) =>
            (row?.content_body || "").toLowerCase().includes(topicLowerCheck),
          );
          if (duplicate) {
            push({
              title: "Already generated",
              message: `Content already exists for Topic ${topic.number}`,
              variant: "info",
            });
            setTopicGenerated((m) => ({ ...m, [key]: true }));
            return;
          }
        }
      } catch (e) {
        // Non-fatal; proceed (webhook may still succeed) but log for diagnostics
        console.warn("Duplicate generation pre-check failed", e);
      }

      // Unified toast pattern (match Idea Set generation): single persistent loading toast
      const loadingToast = push({
        message: `Generating content (Topic #${topic.number})…`,
        variant: "info",
        duration: 60000, // long duration, we manually dismiss when done
      });
      const dismissLoading = () => remove(loadingToast);

      const prevState = viewIdeaModal;
      // For inline we temporarily assign modal state so generateContentCall uses the data path
      if (!viaModal) {
        setTopicGenerating((m) => ({ ...m, [key]: true }));
        setViewIdeaModal({
          isOpen: false,
          idea,
          topic,
          isEditing: false,
          hasGeneratedContent: false,
          checkingGenerated: false,
        });
      } else {
        setGeneratingContent(true);
        // Ensure modal state has latest topic (it should already)
        setViewIdeaModal((prev) => ({
          ...prev,
          idea,
          topic,
        }));
      }

      let success = false;
      try {
        const res = await generateContentCall(idea, topic);
        if (res && (res as any).error) throw (res as any).error;
        success = true;
        // Keep same loading toast during processing/polling
      } catch (e) {
        console.error("Content generation failed", e);
        dismissLoading();
        push({
          message: e instanceof Error ? e.message : "Content generation failed",
          variant: "error",
        });
      } finally {
        if (!success) {
          // loading toast already dismissed on failure
          if (!viaModal) {
            setTopicGenerating((m) => ({ ...m, [key]: false }));
            setViewIdeaModal((curr) =>
              curr.idea?.id === idea.id && curr.topic?.number === topic.number
                ? prevState
                : curr,
            );
          } else {
            setGeneratingContent(false);
          }
          return; // abort polling
        }

        // Success: begin polling until content row appears
        let attempts = 0;
        const maxAttempts = 20; // ~60s if interval 3s
        const intervalMs = 3000;
        const poll = async () => {
          attempts++;
          try {
            const { data, error } = await supabase
              .from("content")
              .select("id, idea_id, topic_number")
              .eq("idea_id", idea.id)
              .eq("topic_number", topic.number)
              .limit(1);
            if (!error && data && data.length) {
              // Mark generated
              setTopicGenerated((m) => ({ ...m, [key]: true }));
              if (viaModal) {
                setViewIdeaModal((prev) => ({
                  ...prev,
                  hasGeneratedContent: true,
                }));
                setGeneratingContent(false);
              } else {
                // restore previous modal state if placeholder
                setViewIdeaModal((curr) =>
                  curr.idea?.id === idea.id &&
                  curr.topic?.number === topic.number
                    ? prevState
                    : curr,
                );
              }
              dismissLoading();
              setTopicGenerating((m) => ({ ...m, [key]: false }));
              push({
                message: `Content generated for Topic #${topic.number}`,
                variant: "success",
              });
              return; // stop polling
            }
          } catch {
            // swallow and continue polling
          }
          if (attempts < maxAttempts) {
            setTimeout(poll, intervalMs);
          } else {
            // Timeout: leave as not generated; user can retry or it may appear later
            dismissLoading();
            if (viaModal) setGeneratingContent(false);
            setTopicGenerating((m) => ({ ...m, [key]: false }));
            push({
              message: "Still processing; content will appear once generated",
              variant: "info",
            });
          }
        };
        // Keep generating state true during polling
        if (!viaModal) {
          // already true
        } else {
          // generatingContent stays true; only cleared when detected or timeout
        }
        poll();
      }
    },
    [
      generateContentCall,
      push,
      remove,
      topicGenerating,
      topicGenerated,
      viewIdeaModal,
    ],
  );

  // Inline button handler
  const generateContentForTopic = useCallback(
    (idea: IdeaJoined, topic: Topic) =>
      void runTopicGeneration(idea, topic, { viaModal: false }),
    [runTopicGeneration],
  );

  // Modal button handler
  const handleGenerateContent = useCallback(() => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return;
    void runTopicGeneration(viewIdeaModal.idea, viewIdeaModal.topic, {
      viaModal: true,
    });
  }, [runTopicGeneration, viewIdeaModal.idea, viewIdeaModal.topic]);

  // Group ideas by brand name (from joined company)
  const ideasByBrand = useMemo(() => {
    const filtered = search
      ? ideas.filter((i) => {
          const topics = extractTopicsFromIdea(i);
          return (
            topics.some((t) =>
              t.topic.toLowerCase().includes(search.toLowerCase()),
            ) ||
            (i.company?.brand_name || "")
              .toLowerCase()
              .includes(search.toLowerCase())
          );
        })
      : ideas;
    return filtered.reduce(
      (acc, idea) => {
        const brandName = idea.company?.brand_name || "Unknown Brand";
        if (!acc[brandName]) acc[brandName] = [] as IdeaJoined[];
        acc[brandName].push(idea);
        return acc;
      },
      {} as Record<string, IdeaJoined[]>,
    );
  }, [ideas, search]);

  const toggleBrand = (brand: string) =>
    setCollapsedBrands((prev) => ({ ...prev, [brand]: !prev[brand] }));

  // Retry generation for an empty idea set by re-calling the generateIdeas webhook with stored metadata.
  const [regeneratingEmpty, setRegeneratingEmpty] = useState<
    Record<number, boolean>
  >({});
  // Track which idea sets we've already inspected for generated content
  const inspectedIdeasRef = useRef<Record<number, boolean>>({});

  // When expanding an idea set, lazily detect which topics already have generated content
  const detectGeneratedForIdea = useCallback(async (idea: IdeaJoined) => {
    if (!idea?.id) return;
    if (inspectedIdeasRef.current[idea.id]) return; // already done
    try {
      const { data, error } = await supabase
        .from("content")
        .select("content_body, idea_id")
        .eq("idea_id", idea.id);
      if (error) return;
      const rows: { content_body: string | null }[] = (data as any) || [];
      if (!rows.length) return;
      const bodyLower = rows.map((r) => (r.content_body || "").toLowerCase());
      const topics = extractTopicsFromIdea(idea);
      const updates: Record<string, boolean> = {};
      for (const t of topics) {
        const topicLower = (t.topic || "").toLowerCase();
        if (topicLower && bodyLower.some((b) => b.includes(topicLower))) {
          const key = `${idea.id}-${t.number}`;
          updates[key] = true;
        }
      }
      if (Object.keys(updates).length) {
        setTopicGenerated((m) => ({ ...m, ...updates }));
      }
    } finally {
      inspectedIdeasRef.current[idea.id] = true;
    }
  }, []);
  const handleRegenerateEmpty = useCallback(
    async (idea: IdeaJoined) => {
      if (regeneratingEmpty[idea.id]) return;
      if (!idea.strategy_id || !idea.company_id || !idea.angle_number) {
        push({
          title: "Cannot retry",
          message: "Missing strategy or angle references",
          variant: "error",
        });
        return;
      }
      setRegeneratingEmpty((m) => ({ ...m, [idea.id]: true }));
      const loadingToast = push({
        title: "Retrying",
        message: `Regenerating Idea Set #${idea.id}`,
        variant: "info",
        duration: 0,
      });
      try {
        // Fetch minimal strategy + company for context
        const [{ data: strategy }, { data: company }] = await Promise.all([
          supabase
            .from("strategies")
            .select("* ")
            .eq("id", idea.strategy_id)
            .single(),
          supabase
            .from("companies")
            .select("* ")
            .eq("id", idea.company_id)
            .single(),
        ]);
        if (!strategy || !company) throw new Error("Context fetch failed");
        const angleNumber = idea.angle_number;
        const angle = {
          number: angleNumber,
          header: (strategy as any)[`angle${angleNumber}_header`] || "",
          description:
            (strategy as any)[`angle${angleNumber}_description`] || "",
          objective: (strategy as any)[`angle${angleNumber}_objective`] || "",
          tonality: (strategy as any)[`angle${angleNumber}_tonality`] || "",
        };
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id || null;
        const normalizePlatforms = (platforms: string | null): string[] => {
          if (!platforms) return [];
          try {
            const parsed = JSON.parse(platforms);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          return String(platforms)
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        };
        const PLATFORM_ORDER = [
          "twitter",
          "linkedin",
          "newsletter",
          "facebook",
          "instagram",
          "youtube",
          "tiktok",
          "blog",
        ];
        const normalizedPlatforms = normalizePlatforms(strategy.platforms).map(
          (p) => p.toLowerCase(),
        );
        const platformsSlotted = PLATFORM_ORDER.map(() => "");
        normalizedPlatforms.forEach((p) => {
          const idx = PLATFORM_ORDER.indexOf(p);
          if (idx !== -1) platformsSlotted[idx] = p;
        });
        const payload = {
          identifier: "generateIdeas",
          operation: "create_ideas_from_angle",
          company_id: company.id,
          strategy_id: strategy.id,
          strategyIndex: angle.number,
          angle_number: angle.number,
          platforms: platformsSlotted,
          meta: {
            user_id: userId,
            source: "app",
            ts: new Date().toISOString(),
          },
          user_id: userId,
          brand: { id: company.id, name: company.brand_name },
          brandDetails: { id: company.id, name: company.brand_name },
          data: { brandData: { id: company.id, name: company.brand_name } },
          company: { id: company.id, brand_name: company.brand_name },
          strategy: {
            id: strategy.id,
            platforms: strategy.platforms,
            created_at: strategy.created_at,
          },
          angle: {
            angleNumber: angle.number,
            number: angle.number,
            header: angle.header,
            description: angle.description,
            objective: angle.objective,
            tonality: angle.tonality,
            strategy: { id: strategy.id, platforms: strategy.platforms },
          },
        };
        const { company_id, strategy_id, angle_number, platforms, ...rest } =
          payload as any;
        const resp = await n8nCall(
          "generateIdeas",
          {
            company_id,
            strategy_id,
            angle_number,
            platforms,
            ...rest,
          },
          { platforms },
        );
        if (!resp.ok) throw new Error(`Retry failed (${resp.status})`);
        push({
          title: "Queued",
          message: `Retry started for set #${idea.id}`,
          variant: "success",
        });
      } catch (e) {
        console.error("Retry generation failed", e);
        push({
          title: "Retry failed",
          message: e instanceof Error ? e.message : "Unknown error",
          variant: "error",
        });
      } finally {
        remove(loadingToast);
        setRegeneratingEmpty((m) => ({ ...m, [idea.id]: false }));
        // Refresh ideas later (slight delay to allow creation) - fire and forget
        setTimeout(() => void fetchIdeas(false), 4000);
      }
    },
    [regeneratingEmpty, push, remove, fetchIdeas],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Ideas"
        description="AI ideas by brand."
        icon={<Lightbulb className="h-5 w-5" />}
        actions={
          <Button
            onClick={() => fetchIdeas(true)}
            loading={loading}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {/* View Idea Modal */}
      {viewIdeaModal.isOpen && (
        <Modal
          isOpen={viewIdeaModal.isOpen}
          onClose={handleCloseViewModal}
          labelledById="view-idea-title"
        >
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <ModalBrandHeader
              titleId="view-idea-title"
              title={
                viewIdeaModal.isEditing
                  ? "Edit topic"
                  : viewIdeaModal.topic?.topic ||
                    `Topic ${viewIdeaModal.topic?.number}`
              }
              icon={<Lightbulb className="h-6 w-6 text-white" />}
              onClose={handleCloseViewModal}
              actionsRight={
                !viewIdeaModal.isEditing && viewIdeaModal.topic ? (
                  <IconButton
                    aria-label="Delete idea"
                    variant="danger"
                    onClick={() =>
                      setDeleteTopicDialog({ isOpen: true, loading: false })
                    }
                    disabled={saving || generatingContent}
                    className="hover:bg-white/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </IconButton>
                ) : null
              }
            />
            <div className="px-6 pt-4 -mb-2 flex flex-wrap gap-3 text-xs text-gray-600">
              <div className="inline-flex items-center gap-1 rounded-md bg-brand-50 text-brand-700 px-3 py-1 font-medium">
                {viewIdeaModal.idea?.company?.brand_name || "Unknown Brand"}
              </div>
              {viewIdeaModal.topic?.number && (
                <div className="inline-flex items-center gap-1 rounded-md bg-gray-100 text-gray-700 px-3 py-1">
                  Topic {viewIdeaModal.topic.number}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {/* Topic */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <FileText className="h-5 w-5 text-brand-600" />
                    Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <>
                      <input
                        type="text"
                        value={editForm.topic}
                        onChange={(e) =>
                          handleFormChange("topic", e.target.value)
                        }
                        aria-label="Topic"
                        aria-invalid={editErrors.topic ? true : undefined}
                        aria-errormessage={
                          editErrors.topic ? "edit-topic-error" : undefined
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-transparent"
                        placeholder="Enter topic..."
                      />
                      {editErrors.topic && (
                        <p
                          id="edit-topic-error"
                          className="mt-2 text-base text-red-600"
                        >
                          {editErrors.topic}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {viewIdeaModal.topic?.topic || "No topic specified"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          handleFormChange("description", e.target.value)
                        }
                        rows={4}
                        aria-label="Description"
                        aria-invalid={editErrors.description ? true : undefined}
                        aria-errormessage={
                          editErrors.description
                            ? "edit-description-error"
                            : undefined
                        }
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-transparent resize-none"
                        placeholder="Enter description..."
                      />
                      {editErrors.description && (
                        <p
                          id="edit-description-error"
                          className="mt-2 text-base text-red-600"
                        >
                          {editErrors.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewIdeaModal.topic?.description ||
                        "No description available"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Image Prompt */}
              {viewIdeaModal.topic?.image_prompt &&
                viewIdeaModal.topic.image_prompt !==
                  "No image prompt provided" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        <Target className="h-5 w-5 text-brand-600" />
                        Image Prompt
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {viewIdeaModal.isEditing ? (
                        <>
                          <textarea
                            value={editForm.image_prompt}
                            onChange={(e) =>
                              handleFormChange("image_prompt", e.target.value)
                            }
                            rows={3}
                            aria-label="Image prompt"
                            aria-invalid={
                              editErrors.image_prompt ? true : undefined
                            }
                            aria-errormessage={
                              editErrors.image_prompt
                                ? "edit-imageprompt-error"
                                : undefined
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-transparent resize-none"
                            placeholder="Enter image prompt..."
                          />
                          {editErrors.image_prompt && (
                            <p
                              id="edit-imageprompt-error"
                              className="mt-2 text-base text-red-600"
                            >
                              {editErrors.image_prompt}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {viewIdeaModal.topic.image_prompt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-3">
                {viewIdeaModal.isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      loading={saving}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={handleEditToggle}>
                      Edit
                    </Button>
                    <Button
                      onClick={handleGenerateContent}
                      loading={generatingContent}
                      disabled={
                        generatingContent ||
                        viewIdeaModal.hasGeneratedContent ||
                        viewIdeaModal.checkingGenerated
                      }
                      className="bg-brand-600 hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                    >
                      {generatingContent
                        ? "Generating…"
                        : viewIdeaModal.checkingGenerated
                          ? "Checking…"
                          : viewIdeaModal.hasGeneratedContent
                            ? "Content generated"
                            : "Generate content"}
                    </Button>
                    <Button variant="outline" onClick={handleCloseViewModal}>
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Removed Idea Set Modal; sets expand inline now */}

      {/* Delete Idea Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={cancelDeleteIdea}
        onConfirm={confirmDeleteIdea}
        title="Delete Idea Set"
        message={`Delete Idea Set #${deleteDialog.idea?.id}? This removes all its topics and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />

      {/* Delete Individual Topic Dialog */}
      <ConfirmDialog
        isOpen={deleteTopicDialog.isOpen}
        onClose={cancelDeleteTopic}
        onConfirm={confirmDeleteTopic}
        title="Delete idea"
        message={
          viewIdeaModal.topic
            ? `Delete "${viewIdeaModal.topic.topic}" from this set? This cannot be undone.`
            : "Delete this idea?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteTopicDialog.loading}
      />

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorState
          icon={<Lightbulb className="h-12 w-12 text-red-500" />}
          title="Error Loading Ideas"
          error={error}
          retry={
            <Button
              onClick={() => fetchIdeas(true)}
              variant="outline"
              loading={loading}
              disabled={loading}
            >
              Try Again
            </Button>
          }
        />
      )}

      {/* Search & Ideas by Brand */}
      {!loading && !error && ideas.length > 0 && (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics or brand"
              aria-label="Search ideas by topic or brand"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {search && Object.keys(ideasByBrand ?? {}).length === 0 && (
            <div className="text-base text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg p-6 flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" /> No matches for "
              {search}".
              <button
                onClick={() => setSearch("")}
                className="text-brand-600 font-medium hover:underline"
              >
                Clear
              </button>
            </div>
          )}
          <div className="space-y-5">
            {(
              Object.entries(ideasByBrand ?? {}) as [string, IdeaJoined[]][]
            ).map(([brandName, brandIdeas]) => {
              const totalTopics = brandIdeas.reduce((sum, idea) => {
                const count = extractTopicsFromIdea(idea).length;
                return sum + count;
              }, 0);
              const nonEmptySets = brandIdeas.filter(
                (i) => extractTopicsFromIdea(i).length > 0,
              ).length;
              const collapsed = collapsedBrands[brandName];

              return (
                <div
                  key={brandName}
                  className="border border-gray-200 rounded-xl bg-white shadow-sm hover:border-brand-300 transition"
                >
                  <button
                    onClick={() => toggleBrand(brandName)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-expanded={!collapsed}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white text-base font-semibold shadow-sm">
                        {brandName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight text-base">
                          {brandName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {nonEmptySets}/{brandIdeas.length} sets with topics •{" "}
                          {totalTopics} topics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" className="text-xs px-2 py-0.5">
                        {nonEmptySets} active
                      </Badge>
                      {collapsed ? (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {!collapsed && (
                    <div className="px-5 pb-5">
                      <ul className="space-y-3 mt-3">
                        {brandIdeas.map((idea) => {
                          const topics = extractTopicsFromIdea(idea);
                          const expanded = !!collapsedBrands[`idea-${idea.id}`];
                          const toggle = (id: number) =>
                            setCollapsedBrands((prev) => {
                              const currently = !!prev[`idea-${id}`];
                              const next = {
                                ...prev,
                                [`idea-${id}`]: !currently,
                              };
                              // If we are expanding now (currently collapsed), run detection
                              if (currently) return next; // we are collapsing
                              // Expanding -> trigger detection (fire and forget)
                              void detectGeneratedForIdea(idea);
                              return next;
                            });
                          return (
                            <IdeaSetListItem
                              key={idea.id}
                              idea={idea}
                              topics={topics}
                              expanded={expanded}
                              onToggle={toggle}
                              onViewTopic={handleViewTopic}
                              onDelete={openDeleteDialog}
                              onGenerateTopic={generateContentForTopic}
                              generatingMap={topicGenerating}
                              generatedMap={topicGenerated}
                              onRegenerateEmpty={handleRegenerateEmpty}
                              regenerating={regeneratingEmpty[idea.id]}
                            />
                          );
                        })}
                      </ul>
                      <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" /> How ideas work
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* Empty State */}
      {!loading && !error && ideas.length === 0 && (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8 text-white" />}
          title="No ideas"
          message="No ideas yet."
          variant="brand"
          actions={
            <Button onClick={() => fetchIdeas(true)}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          }
        />
      )}
    </PageContainer>
  );
}
