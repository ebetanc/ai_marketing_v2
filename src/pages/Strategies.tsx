import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { GenerateStrategyModal } from "@/features/content/components";
import { supabase, type Tables } from "../lib/supabase";
import {
  FileText,
  Building2,
  RefreshCw,
  Target,
  Zap,
  Plus,
  HelpCircle,
  X,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Search,
  Trash2,
} from "lucide-react";
import { formatDate } from "../lib/utils";
import { StrategyListItem } from "@/features/strategies/components";
// removed unused IconButton import
import { Modal } from "../components/ui/Modal";
import { ModalBrandHeader } from "../components/ui/ModalBrandHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { n8nGenerateIdeas } from "../lib/n8n";
import { useAsyncCallback } from "../hooks/useAsync";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";

type Strategy = Tables<"strategies"> & {
  company?: { id: number; brand_name: string; created_at: string };
};

interface Company {
  id: number;
  brand_name: string;
  created_at: string;
  strategies: Strategy[];
}

export function Strategies() {
  useDocumentTitle("Strategies — Lighting");
  const [companiesWithStrategies, setCompaniesWithStrategies] = useState<
    Company[]
  >([]);
  const [companiesForModal, setCompaniesForModal] = useState<
    { id: number; brand_name: string; created_at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingIdeas, setGeneratingIdeas] = useState<number | null>(null);
  const [collapsedCompanies, setCollapsedCompanies] = useState<
    Record<number, boolean>
  >({});
  const [search, setSearch] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    strategy: Strategy | null; // strategy set
    company: Company | null;
    angle: {
      number: number;
      header: string;
      description: string;
      objective: string;
      tonality: string;
    } | null;
  }>({
    isOpen: false,
    strategy: null,
    company: null,
    angle: null,
  });
  // Angles that already have ideas generated for the currently viewed strategy
  const [existingIdeaAngles, setExistingIdeaAngles] = useState<number[]>([]);
  // Map of strategyId -> angles with idea sets (for inline list display)
  const [strategyIdeaAngles, setStrategyIdeaAngles] = useState<
    Record<number, number[]>
  >({});
  const [loadingIdeaAngles, setLoadingIdeaAngles] = useState(false);
  // Angle editing state
  const [editingAngle, setEditingAngle] = useState<number | null>(null);
  const [angleForm, setAngleForm] = useState({
    header: "",
    description: "",
    objective: "",
    tonality: "",
  });
  const [angleErrors, setAngleErrors] = useState<{ header?: string }>({});
  const [savingAngle, setSavingAngle] = useState(false);
  const [expandedAngles, setExpandedAngles] = useState<Record<number, boolean>>(
    {},
  );
  // Deletion state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    strategy: Strategy | null;
    loading: boolean;
  }>({ isOpen: false, strategy: null, loading: false });
  const [deleteAngleDialog, setDeleteAngleDialog] = useState<{
    isOpen: boolean;
    angleNumber: number | null;
    loading: boolean;
  }>({ isOpen: false, angleNumber: null, loading: false });
  const { push, remove, success, error: toastError } = useToast();

  const fetchStrategies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching strategies from Supabase...");

      // Fetch strategies with company information
      const { data: strategies, error: strategiesError } = await supabase
        .from("strategies")
        .select(
          `
          *,
          company:companies (
            id,
            brand_name,
            created_at
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (strategiesError) {
        console.error("Supabase error:", strategiesError);
        throw strategiesError;
      }

      console.log(
        "Strategies fetched successfully:",
        strategies?.length || 0,
        "records",
      );

      // Group strategies by company
      const companiesMap = new Map<number, Company>();

      strategies?.forEach((strategy: any) => {
        const companyId = strategy.company?.id || strategy.company_id;
        const companyName = strategy.company?.brand_name || "Unknown Company";
        const companyCreatedAt =
          strategy.company?.created_at || strategy.created_at;

        if (!companiesMap.has(companyId)) {
          companiesMap.set(companyId, {
            id: companyId,
            brand_name: companyName,
            created_at: companyCreatedAt,
            strategies: [],
          });
        }

        companiesMap.get(companyId)?.strategies.push(strategy);
      });

      const companiesArray = Array.from(companiesMap.values());
      console.log("Companies with strategies:", companiesArray);
      setCompaniesWithStrategies(companiesArray);
      // Preload idea angles for all strategies so inline buttons show correct state
      void preloadIdeaAngles(
        companiesArray.flatMap((c) => c.strategies.map((s) => s.id)),
      );
    } catch (error) {
      console.error("Error fetching strategies from Supabase:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch strategies",
      );
      setCompaniesWithStrategies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStrategies();
    fetchCompanies();
  }, [fetchStrategies]);

  const preloadIdeaAngles = async (strategyIds: number[]) => {
    if (strategyIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from("ideas")
        .select("strategy_id, angle_number")
        .in("strategy_id", strategyIds);
      if (error) {
        console.warn("Failed to preload idea angles", error.message);
        return;
      }
      const map: Record<number, Set<number>> = {};
      (data || []).forEach(
        (row: { strategy_id: number; angle_number: number | null }) => {
          if (row.angle_number == null) return;
          if (!map[row.strategy_id]) map[row.strategy_id] = new Set();
          map[row.strategy_id].add(row.angle_number);
        },
      );
      setStrategyIdeaAngles(
        Object.fromEntries(
          Object.entries(map).map(([k, v]) => [
            Number(k),
            Array.from(v).sort((a, b) => a - b),
          ]),
        ),
      );
    } catch (e) {
      console.warn("Error preloading idea angles", e);
    }
  };

  const fetchCompanies = async () => {
    try {
      console.log("Fetching companies for strategy generation...");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      let q = supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (userId) q = q.eq("owner_id", userId);
      const { data, error } = await q;

      if (error) {
        console.error("Error fetching companies:", error);
        return;
      }

      console.log("Companies fetched for modal:", data?.length || 0, "records");
      setCompaniesForModal(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };
  const countAngles = (strategy: Strategy): number => {
    let count = 0;
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as
        | string
        | null;
      if (header && header.trim()) {
        count++;
      }
    }
    return count;
  };

  const getPlatformBadges = (platforms: string | null) => {
    if (!platforms) return [];
    try {
      const parsed = JSON.parse(platforms);
      if (Array.isArray(parsed)) return parsed.filter((p) => p && p.trim());
    } catch {
      return platforms
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
    }
    return [];
  };

  const handleViewAngle = (
    strategy: Strategy,
    company: Company,
    angle: {
      number: number;
      header: string;
      description: string;
      objective: string;
      tonality: string;
    },
  ) => {
    setViewModal({ isOpen: true, strategy, company, angle });
    setExistingIdeaAngles([]);
    setLoadingIdeaAngles(true);
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("ideas")
          .select("angle_number")
          .eq("strategy_id", strategy.id);
        if (error) return;
        const usedAngles: number[] = (data || [])
          .map((r: { angle_number: number | null }) => r.angle_number)
          .filter(
            (n: number | null): n is number =>
              typeof n === "number" && n !== null,
          );
        setExistingIdeaAngles(
          Array.from(new Set(usedAngles)).sort((a, b) => a - b),
        );
        setStrategyIdeaAngles((prev) => ({
          ...prev,
          [strategy.id]: Array.from(new Set(usedAngles)).sort((a, b) => a - b),
        }));
      } finally {
        setLoadingIdeaAngles(false);
      }
    })();
  };

  const handleCloseModal = () => {
    setViewModal({ isOpen: false, strategy: null, company: null, angle: null });
    setExistingIdeaAngles([]);
    setLoadingIdeaAngles(false);
    setEditingAngle(null);
  };

  // Generate ideas for an angle (works for both modal + inline without depending on viewModal state timing)
  const { call: runGenerateIdeas } = useAsyncCallback(
    async (
      strategy: Strategy,
      company: Company,
      angle: {
        number: number;
        header: string;
        description: string;
        objective: string;
        tonality: string;
      },
    ) => {
      if (!strategy || !company) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id || null;
      const normalizedPlatforms = getPlatformBadges(strategy.platforms)
        .map((p: string) => String(p).trim().toLowerCase())
        .filter(Boolean);
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
      const payload = {
        identifier: "generateIdeas",
        operation: "create_ideas_from_angle",
        company_id: company.id,
        strategy_id: strategy.id,
        strategyIndex: angle.number,
        angle_number: angle.number,
        platforms: platformsSlotted,
        meta: { user_id: userId, source: "app", ts: new Date().toISOString() },
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
      const response = await n8nGenerateIdeas({
        company_id,
        strategy_id,
        angle_number,
        platforms,
        ...rest,
      });
      if (!response.ok) throw new Error("Failed to generate ideas");
      console.log("Ideas generation started successfully");
    },
  );

  const handleGenerateIdeas = async (angle: any) => {
    if (!viewModal.strategy || !viewModal.company) return;
    setGeneratingIdeas(angle.number);
    const loadingToast = push({
      message: `Generating idea set (Angle #${angle.number})…`,
      variant: "info",
      // keep it visible until we remove it
      duration: 60000,
    });
    try {
      const res = await runGenerateIdeas(
        viewModal.strategy,
        viewModal.company,
        angle,
      );
      if (res && (res as any).error) throw (res as any).error;
      setExistingIdeaAngles((prev) =>
        prev.includes(angle.number)
          ? prev
          : [...prev, angle.number].sort((a, b) => a - b),
      );
      setStrategyIdeaAngles((prev) => {
        const sid = viewModal.strategy!.id;
        const list = prev[sid] || [];
        return {
          ...prev,
          [sid]: list.includes(angle.number)
            ? list
            : [...list, angle.number].sort((a, b) => a - b),
        };
      });
      remove(loadingToast);
      success("Idea Set generated successfully");
    } catch (e: any) {
      remove(loadingToast);
      toastError(e?.message || "Failed to generate ideas");
    } finally {
      setGeneratingIdeas(null);
    }
  };

  // Inline generate from list (without opening full modal)
  const handleInlineGenerateIdeas = async (
    strategy: Strategy,
    company: Company,
    angle: {
      number: number;
      header: string;
      description: string;
      objective: string;
      tonality: string;
    },
  ) => {
    setGeneratingIdeas(angle.number);
    const loadingToast = push({
      message: `Generating idea set (Angle #${angle.number})…`,
      variant: "info",
      duration: 60000,
    });
    try {
      const res = await runGenerateIdeas(strategy, company, angle);
      if (res && (res as any).error) throw (res as any).error;
      setStrategyIdeaAngles((prev) => {
        const list = prev[strategy.id] || [];
        return {
          ...prev,
          [strategy.id]: list.includes(angle.number)
            ? list
            : [...list, angle.number].sort((a, b) => a - b),
        };
      });
      remove(loadingToast);
      success("Idea Set generated successfully");
    } catch (e: any) {
      remove(loadingToast);
      toastError(e?.message || "Failed to generate ideas");
    } finally {
      setGeneratingIdeas(null);
    }
  };

  const handleGenerateStrategy = () => {
    if (companiesForModal.length === 0) {
      return;
    }
    setShowGenerateModal(true);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
  };

  const handleStrategyGenerated = () => {
    setShowGenerateModal(false);
    // Refresh strategies after generation
    fetchStrategies();
    fetchCompanies();
  };

  const getAnglesFromStrategy = (strategy: Strategy) => {
    const angles = [];
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as
        | string
        | null;
      const description = strategy[
        `angle${i}_description` as keyof Strategy
      ] as string | null;
      const objective = strategy[`angle${i}_objective` as keyof Strategy] as
        | string
        | null;
      const tonality = strategy[`angle${i}_tonality` as keyof Strategy] as
        | string
        | null;

      if (header && header.trim()) {
        angles.push({
          number: i,
          header: header.trim(),
          description: description?.trim() || "",
          objective: objective?.trim() || "",
          tonality: tonality?.trim() || "",
        });
      }
    }
    return angles;
  };

  const beginEditAngle = (angle: {
    number: number;
    header: string;
    description: string;
    objective: string;
    tonality: string;
  }) => {
    setEditingAngle(angle.number);
    setAngleForm({
      header: angle.header,
      description: angle.description,
      objective: angle.objective,
      tonality: angle.tonality,
    });
    setAngleErrors({});
  };

  const cancelEditAngle = () => {
    setEditingAngle(null);
    setAngleErrors({});
  };

  const saveAngle = async () => {
    if (!viewModal.strategy || editingAngle == null) return;
    if (!angleForm.header.trim()) {
      setAngleErrors({ header: "Header is required." });
      return;
    }
    setSavingAngle(true);
    try {
      const update: Record<string, any> = {
        [`angle${editingAngle}_header`]: angleForm.header.trim(),
        [`angle${editingAngle}_description`]: angleForm.description.trim(),
        [`angle${editingAngle}_objective`]: angleForm.objective.trim(),
        [`angle${editingAngle}_tonality`]: angleForm.tonality.trim(),
      };
      const { error } = await supabase
        .from("strategies")
        .update(update)
        .eq("id", viewModal.strategy.id);
      if (error) throw error;
      // Optimistically update local strategy in modal
      setViewModal((prev) =>
        prev.strategy
          ? {
              ...prev,
              strategy: { ...prev.strategy, ...update },
            }
          : prev,
      );
      setEditingAngle(null);
    } catch (e) {
      console.error("Failed to save angle", e);
      setAngleErrors({
        header: e instanceof Error ? e.message : "Save failed",
      });
    } finally {
      setSavingAngle(false);
    }
  };

  const toggleAngle = (num: number) => {
    setExpandedAngles((prev) => ({ ...prev, [num]: !prev[num] }));
  };
  const isAngleExpanded = (num: number) => !!expandedAngles[num];

  // Delete entire strategy set
  const openDeleteStrategy = (strategy: Strategy) => {
    setDeleteDialog({ isOpen: true, strategy, loading: false });
  };
  const { call: runDeleteStrategy } = useAsyncCallback(async () => {
    if (!deleteDialog.strategy) return;
    const id = deleteDialog.strategy.id;
    const { error } = await supabase.from("strategies").delete().eq("id", id);
    if (error) throw error;
    // Remove locally
    setCompaniesWithStrategies((prev) =>
      prev
        .map((c) => ({
          ...c,
          strategies: c.strategies.filter((s) => s.id !== id),
        }))
        .filter((c) => c.strategies.length > 0),
    );
    // Close strategy view modal if referencing
    setViewModal((prev) =>
      prev.strategy?.id === id
        ? { isOpen: false, strategy: null, company: null, angle: null }
        : prev,
    );
    push({
      title: "Deleted",
      message: "Strategy Set removed",
      variant: "success",
    });
    setDeleteDialog({ isOpen: false, strategy: null, loading: false });
  });
  const confirmDeleteStrategy = () => {
    setDeleteDialog((d) => ({ ...d, loading: true }));
    void runDeleteStrategy();
  };
  const cancelDeleteStrategy = () =>
    setDeleteDialog({ isOpen: false, strategy: null, loading: false });

  // Delete (clear) individual angle within strategy set
  const openDeleteAngle = (angleNumber: number) => {
    setDeleteAngleDialog({ isOpen: true, angleNumber, loading: false });
  };
  const { call: runDeleteAngle } = useAsyncCallback(async () => {
    if (!viewModal.strategy || deleteAngleDialog.angleNumber == null) return;
    const num = deleteAngleDialog.angleNumber;
    const update: Record<string, any> = {
      [`angle${num}_header`]: null,
      [`angle${num}_description`]: null,
      [`angle${num}_objective`]: null,
      [`angle${num}_tonality`]: null,
    };
    const { error } = await supabase
      .from("strategies")
      .update(update)
      .eq("id", viewModal.strategy.id);
    if (error) throw error;
    // Update local modal state
    setViewModal((prev) =>
      prev.strategy
        ? {
            ...prev,
            strategy: { ...prev.strategy, ...update },
            angle: prev.angle?.number === num ? null : prev.angle,
          }
        : prev,
    );
    // Update list representation
    setCompaniesWithStrategies((prev) =>
      prev.map((c) => ({
        ...c,
        strategies: c.strategies.map((s) =>
          s.id === viewModal.strategy!.id ? { ...s, ...update } : s,
        ),
      })),
    );
    push({
      title: "Deleted",
      message: `Strategy #${num} removed`,
      variant: "success",
    });
    setDeleteAngleDialog({ isOpen: false, angleNumber: null, loading: false });
  });
  const confirmDeleteAngle = () => {
    setDeleteAngleDialog((d) => ({ ...d, loading: true }));
    void runDeleteAngle();
  };
  const cancelDeleteAngle = () =>
    setDeleteAngleDialog({ isOpen: false, angleNumber: null, loading: false });

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Strategies"
          description="AI strategies by company."
          icon={<FileText className="h-5 w-5" />}
        />
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Strategies"
          description="AI strategies by company."
          icon={<FileText className="h-5 w-5" />}
          actions={
            <Button
              onClick={fetchStrategies}
              loading={loading}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          }
        />
        <ErrorState
          icon={<FileText className="h-12 w-12 text-red-500" />}
          title="Error Loading Strategies"
          error={error}
          retry={
            <Button
              onClick={fetchStrategies}
              variant="outline"
              loading={loading}
              disabled={loading}
            >
              Try Again
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Strategies"
        description="AI strategies by company."
        icon={<FileText className="h-5 w-5" />}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={fetchStrategies}
              variant="outline"
              loading={loading}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleGenerateStrategy}>
              <Plus className="h-4 w-4" />
              Generate Strategy Set
            </Button>
          </div>
        }
      />

      {/* Generate Strategy Modal */}
      <GenerateStrategyModal
        isOpen={showGenerateModal}
        onClose={handleCloseGenerateModal}
        companies={companiesForModal}
        onStrategyGenerated={handleStrategyGenerated}
      />

      {/* Strategy Angle Modal */}
      {viewModal.isOpen &&
        viewModal.strategy &&
        viewModal.company &&
        viewModal.angle && (
          <Modal
            isOpen={viewModal.isOpen}
            onClose={handleCloseModal}
            labelledById="view-strategy-title"
          >
            <div className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
              <ModalBrandHeader
                titleId="view-strategy-title"
                title={`Strategy #${viewModal.angle.number}: ${editingAngle === viewModal.angle.number ? angleForm.header || "(Untitled)" : viewModal.angle.header}`}
                icon={<FileText className="h-6 w-6 text-white" />}
                onClose={handleCloseModal}
              />
              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
                {/* Brand name (moved from old subtitle) */}
                <div className="rounded-lg bg-brand-50 border border-brand-200 px-4 py-2 text-sm font-medium text-brand-800 inline-flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-600" />
                  {viewModal.company.brand_name}
                </div>
                {/* Strategy Set Overview */}
                <div
                  className="rounded-xl border border-gray-200 bg-white/60 backdrop-blur-sm p-4 sm:p-5 shadow-sm"
                  aria-label="Strategy overview stats"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Created
                      </span>
                      <span className="mt-1 text-sm font-semibold text-gray-900">
                        {formatDate(viewModal.strategy.created_at)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Platforms
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1.5">
                        {getPlatformBadges(viewModal.strategy.platforms)
                          .length > 0 ? (
                          getPlatformBadges(viewModal.strategy.platforms).map(
                            (p) => (
                              <span
                                key={p}
                                className="inline-flex items-center rounded-md bg-gray-100 text-gray-700 px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ring-gray-200"
                              >
                                {p}
                              </span>
                            ),
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Total Strategies
                      </span>
                      <span className="mt-1 text-sm font-semibold text-brand-700">
                        {countAngles(viewModal.strategy)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Company
                      </span>
                      <span
                        className="mt-1 text-sm font-semibold text-brand-700 truncate"
                        title={viewModal.company.brand_name}
                      >
                        {viewModal.company.brand_name}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Selected Angle Content */}
                {viewModal.angle && (
                  <div className="space-y-6">
                    {/* Header / Controls */}
                    <div className="flex flex-wrap items-start gap-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center font-bold text-lg shadow">
                          {viewModal.angle.number}
                        </div>
                        <div>
                          {editingAngle === viewModal.angle.number ? (
                            <input
                              type="text"
                              value={angleForm.header}
                              onChange={(e) => {
                                setAngleForm((f) => ({
                                  ...f,
                                  header: e.target.value,
                                }));
                                setAngleErrors({});
                              }}
                              className="w-64 max-w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium"
                              placeholder="Strategy header"
                              aria-label="Strategy header"
                            />
                          ) : (
                            <h3 className="text-xl font-semibold text-gray-900">
                              {viewModal.angle.header}
                            </h3>
                          )}
                          <p className="text-xs text-gray-500 mt-0.5">
                            Part of Strategy Set #{viewModal.strategy.id}
                          </p>
                          {angleErrors.header && (
                            <p className="text-xs text-red-600 mt-1">
                              {angleErrors.header}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {editingAngle === viewModal.angle.number ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelEditAngle()}
                              disabled={savingAngle}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void saveAngle()}
                              loading={savingAngle}
                              disabled={savingAngle}
                            >
                              {savingAngle ? "Saving…" : "Save"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => beginEditAngle(viewModal.angle!)}
                          >
                            Edit
                          </Button>
                        )}
                        {editingAngle !== viewModal.angle.number && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              openDeleteAngle(viewModal.angle!.number)
                            }
                            disabled={generatingIdeas !== null}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        )}
                        <Button
                          onClick={() => handleGenerateIdeas(viewModal.angle)}
                          loading={generatingIdeas === viewModal.angle.number}
                          disabled={
                            generatingIdeas !== null ||
                            existingIdeaAngles.includes(
                              viewModal.angle.number,
                            ) ||
                            editingAngle === viewModal.angle.number
                          }
                          variant={
                            existingIdeaAngles.includes(viewModal.angle.number)
                              ? "outline"
                              : "primary"
                          }
                        >
                          <Lightbulb className="h-4 w-4" />
                          {existingIdeaAngles.includes(viewModal.angle.number)
                            ? "Idea Set Generated"
                            : generatingIdeas === viewModal.angle.number
                              ? "Generating…"
                              : "Generate Idea Set"}
                        </Button>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    {editingAngle === viewModal.angle.number ? (
                      <div className="space-y-5">
                        <div>
                          <label
                            className="block text-sm font-medium text-gray-600 mb-1"
                            htmlFor="angle-description-input"
                          >
                            Description
                          </label>
                          <textarea
                            id="angle-description-input"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                            value={angleForm.description}
                            onChange={(e) =>
                              setAngleForm((f) => ({
                                ...f,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe the strategic approach"
                          />
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium text-gray-600 mb-1"
                            htmlFor="angle-objective-input"
                          >
                            Objective
                          </label>
                          <textarea
                            id="angle-objective-input"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                            value={angleForm.objective}
                            onChange={(e) =>
                              setAngleForm((f) => ({
                                ...f,
                                objective: e.target.value,
                              }))
                            }
                            placeholder="What are we trying to achieve?"
                          />
                        </div>
                        <div>
                          <label
                            className="block text-sm font-medium text-gray-600 mb-1"
                            htmlFor="angle-tonality-input"
                          >
                            Tonality
                          </label>
                          <input
                            id="angle-tonality-input"
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                            value={angleForm.tonality}
                            onChange={(e) =>
                              setAngleForm((f) => ({
                                ...f,
                                tonality: e.target.value,
                              }))
                            }
                            placeholder="Tone / style guidance"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        {viewModal.angle.description && (
                          <div className="bg-brand-50 rounded-lg p-4 border-l-4 border-brand-400">
                            <div className="flex items-center mb-2">
                              <FileText className="h-4 w-4 text-brand-600 mr-2" />
                              <h5 className="font-semibold text-brand-900">
                                Description
                              </h5>
                            </div>
                            <p className="text-brand-800 leading-relaxed whitespace-pre-wrap">
                              {viewModal.angle.description}
                            </p>
                          </div>
                        )}
                        {viewModal.angle.objective && (
                          <div className="bg-brand-50 rounded-lg p-4 border-l-4 border-brand-400">
                            <div className="flex items-center mb-2">
                              <Target className="h-4 w-4 text-brand-600 mr-2" />
                              <h5 className="font-semibold text-brand-900">
                                Objective
                              </h5>
                            </div>
                            <p className="text-brand-800 leading-relaxed whitespace-pre-wrap">
                              {viewModal.angle.objective}
                            </p>
                          </div>
                        )}
                        {viewModal.angle.tonality && (
                          <div className="bg-brand-50 rounded-lg p-4 border-l-4 border-brand-400">
                            <div className="flex items-center mb-2">
                              <Zap className="h-4 w-4 text-brand-600 mr-2" />
                              <h5 className="font-semibold text-brand-900">
                                Tonality
                              </h5>
                            </div>
                            <p className="text-brand-800 leading-relaxed whitespace-pre-wrap">
                              {viewModal.angle.tonality}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}

      {/* Companies with Strategies */}
      {companiesWithStrategies.length > 0 ? (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or platform"
              aria-label="Search strategies by company or platform"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-base bg-white shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-4">
            {companiesWithStrategies
              .filter((c) => {
                if (!search) return true;
                const matchName = c.brand_name
                  .toLowerCase()
                  .includes(search.toLowerCase());
                const matchPlatform = c.strategies.some((s) =>
                  getPlatformBadges(s.platforms).some((p) =>
                    p.toLowerCase().includes(search.toLowerCase()),
                  ),
                );
                return matchName || matchPlatform;
              })
              .map((company) => {
                const collapsed = collapsedCompanies[company.id];
                return (
                  <div
                    key={company.id}
                    className="border border-gray-200 rounded-xl bg-white shadow-sm"
                  >
                    <button
                      onClick={() =>
                        setCollapsedCompanies((prev) => ({
                          ...prev,
                          [company.id]: !prev[company.id],
                        }))
                      }
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                      aria-expanded={!collapsed}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                          {company.brand_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 leading-tight">
                            {company.brand_name}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="primary" className="px-3 py-1 text-xs">
                          {company.strategies.length} Strategy Set
                          {company.strategies.length === 1 ? "" : "s"}
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
                          {company.strategies.map((strategy) => {
                            const angles = getAnglesFromStrategy(strategy);
                            const [expandedSets, setExpandedSets] = [
                              expandedAngles,
                              setExpandedAngles,
                            ];
                            const expanded = !!expandedSets[strategy.id];
                            return (
                              <StrategyListItem
                                key={strategy.id}
                                strategy={strategy}
                                angleCount={angles.length}
                                platforms={getPlatformBadges(
                                  strategy.platforms,
                                )}
                                angles={angles}
                                expanded={expanded}
                                onToggle={(id) =>
                                  setExpandedSets((prev) => ({
                                    ...prev,
                                    [id]: !prev[id],
                                  }))
                                }
                                onViewAngle={(s, angle) =>
                                  handleViewAngle(s, company, angle)
                                }
                                onDelete={openDeleteStrategy}
                                deleting={
                                  deleteDialog.loading &&
                                  deleteDialog.strategy?.id === strategy.id
                                }
                                ideaAngles={
                                  strategyIdeaAngles[strategy.id] || []
                                }
                                onGenerateAngle={(s, angle) =>
                                  handleInlineGenerateIdeas(s, company, angle)
                                }
                                generatingAngleNumber={generatingIdeas}
                              />
                            );
                          })}
                        </ul>
                        <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" /> How strategies work
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      ) : (
        /* Empty State */
        <EmptyState
          icon={<FileText className="h-8 w-8 text-white" />}
          title="No strategies"
          message={
            <>
              <p>No strategies yet. Create one to start planning.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto my-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-brand-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Multi‑platform
                  </h4>
                  <p className="text-base text-gray-600">
                    Strategies for all your channels
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">AI‑powered</h4>
                  <p className="text-base text-gray-600">Generated using AI</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Brand‑specific
                  </h4>
                  <p className="text-base text-gray-600">
                    Tailored to your brand
                  </p>
                </div>
              </div>
            </>
          }
          variant="purple"
          actions={
            <Button onClick={handleGenerateStrategy} size="lg">
              <Plus className="h-4 w-4" />
              Generate your first Strategy Set
            </Button>
          }
        />
      )}
      {/* Confirm delete strategy set */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={cancelDeleteStrategy}
        onConfirm={confirmDeleteStrategy}
        title="Delete Strategy Set"
        message={`Delete Strategy Set #${deleteDialog.strategy?.id}? This permanently removes its strategies and associated idea sets.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />
      {/* Confirm delete individual angle */}
      <ConfirmDialog
        isOpen={deleteAngleDialog.isOpen}
        onClose={cancelDeleteAngle}
        onConfirm={confirmDeleteAngle}
        title="Delete Strategy"
        message={`Remove this individual strategy (angle #${deleteAngleDialog.angleNumber}) from the set? Ideas already generated remain.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteAngleDialog.loading}
      />
    </PageContainer>
  );
}
