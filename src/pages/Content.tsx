import {
  FileText,
  HelpCircle,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ViewContentModal } from "../components/content/ViewContentModal";
import ContentListItem from "../components/content/ContentListItem";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
// removed IconButton usage after refactor
import { ListSkeleton } from "../components/ui/ListSkeleton";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { useAsyncCallback } from "../hooks/useAsync";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { supabase, type Tables } from "../lib/supabase";
import { truncateText } from "../lib/utils";
// (reserved) formatting helpers for future rich rendering of content bodies
// Helper function to extract and format content from JSON (reserved)
const _extractContentBody = (content: any) => {
  // Try to parse the body if it's JSON
  let parsedContent = null;
  try {
    if (
      typeof content.body === "string" &&
      (content.body.startsWith("[") || content.body.startsWith("{"))
    ) {
      parsedContent = JSON.parse(content.body);
    }
  } catch (_e) {
    // If parsing fails, use the raw body
  }

  // Extract meaningful content from parsed JSON
  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstContent = parsedContent[0];
      if (firstContent.content) {
        // Clean up the content by removing extra quotes and formatting
        return firstContent.content.replace(/^["']|["']$/g, "").trim();
      }
      if (firstContent.body) {
        return firstContent.body.replace(/^["']|["']$/g, "").trim();
      }
      if (firstContent.description) {
        return firstContent.description.replace(/^["']|["']$/g, "").trim();
      }
      // If it's an array of content, try to extract a meaningful summary
      if (typeof firstContent === "string") {
        return firstContent.replace(/^["']|["']$/g, "").trim();
      }
    }

    if (parsedContent.content) {
      return parsedContent.content.replace(/^["']|["']$/g, "").trim();
    }

    if (parsedContent.body) {
      return parsedContent.body.replace(/^["']|["']$/g, "").trim();
    }

    if (parsedContent.description) {
      return parsedContent.description.replace(/^["']|["']$/g, "").trim();
    }
  }

  // Fallback to original body or a default message
  const fallbackContent =
    content.body || "AI-generated content ready for review and publishing.";

  // If it's still JSON-like, try to clean it up
  // Try to extract readable content from JSON strings
  const cleanContent = fallbackContent
    .replace(/^\[|\]$/g, "") // Remove array brackets
    .replace(/^\{|\}$/g, "") // Remove object brackets
    .replace(/"[^"]*":\s*/g, "") // Remove JSON keys
    .replace(/[{}[\]"]/g, "") // Remove remaining JSON characters
    .replace(/,\s*/g, ". ") // Replace commas with periods
    .replace(/\.\s*\./g, ".") // Remove double periods
    .trim();

  return (
    cleanContent || "AI-generated content ready for review and publishing."
  );
};

// Helper function to extract content type/topic
// extractContentTopic moved into list item rendering logic; legacy helper removed

export function Content() {
  useDocumentTitle("Content — AI Marketing");
  const location = useLocation();
  const navigate = useNavigate();
  const initialQ = new URLSearchParams(location.search).get("q") || "";
  // Typed helpers for joined rows
  type CompanyRow = Tables<"companies">;
  type StrategyRow = Tables<"strategies">;
  type IdeaRow = Tables<"ideas">;
  type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow };
  type ContentRow = Tables<"content"> & {
    idea?: IdeaJoined;
    company?: CompanyRow;
    strategy?: StrategyRow;
  } & {
    // derived fields compatibility
    brand_name?: string;
    company_id?: number;
    brand_id?: number;
    strategy_id?: number;
    title?: string;
    body?: string;
    status?: string;
    post?: boolean | null;
    scheduled_at?: string | null;
  };
  // Legacy types removed; unified content only
  const [companies, setCompanies] = useState<any[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [_loadingCompanies, setLoadingCompanies] = useState(true); // reserved for future brand context
  const [loadingContent, setLoadingContent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramsAtInit = new URLSearchParams(location.search);
  // Status filter removed
  const [filterType, setFilterType] = useState<"all" | string>(
    paramsAtInit.get("type") || "all",
  );
  const [brandFilter, setBrandFilter] = useState<string>(
    paramsAtInit.get("brand") || "",
  );
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [viewContentModal, setViewContentModal] = useState<{
    isOpen: boolean;
    content: any;
    strategyId: any;
  }>({
    isOpen: false,
    content: null,
    strategyId: undefined,
  });
  // approvingId removed
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    content: any;
    loading: boolean;
  }>({
    isOpen: false,
    content: null,
    loading: false,
  });
  // Approve action handler
  // approveCall removed
  const { push } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // While viewing a specific content item, reflect it in the document title
  useEffect(() => {
    if (!viewContentModal.isOpen || !viewContentModal.content?.title) return;
    const prev = document.title;
    document.title = `${viewContentModal.content.title} — Content — AI Marketing`;
    return () => {
      document.title = prev;
    };
  }, [viewContentModal.isOpen, viewContentModal.content?.title]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      console.log("Fetching companies from Supabase...");

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
        throw error;
      }

      console.log(
        "Companies fetched successfully:",
        data?.length || 0,
        "records",
      );
      setCompanies(data || []);
    } catch (_error) {
      console.error("Error fetching companies:", _error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      setLoadingContent(true);
      setLoading(true);
      console.log("Fetching content from Supabase tables...");

      // Unified table only
      const unifiedRes = await supabase
        .from("content")
        .select(
          `*, idea:ideas(*, company:companies(*), strategy:strategies(*))`,
        )
        .order("created_at", { ascending: false });

      const platformLabel = (p: string) =>
        p === "twitter"
          ? "Twitter"
          : p === "linkedin"
            ? "LinkedIn"
            : p === "newsletter"
              ? "Newsletter"
              : p === "facebook"
                ? "Facebook"
                : p === "instagram"
                  ? "Instagram"
                  : p === "youtube"
                    ? "YouTube"
                    : p === "tiktok"
                      ? "TikTok"
                      : p === "blog"
                        ? "Blog"
                        : p;

      if (unifiedRes.data && !unifiedRes.error) {
        const rows = unifiedRes.data as ContentRow[];
        const mapped = rows.map((item) => ({
          ...item,
          source: "content" as const,
          platform: platformLabel((item as any).platform),
          type:
            (item as any).platform === "newsletter" ? "email" : "social_post",
          title: (item as any).title || truncateText(item.content_body, 60),
          status: item.status || "draft",
          post: item.post || false,
          scheduled_at: (item as any).scheduled_at || null,
          company_id: item.idea?.company_id ?? item.company_id ?? item.brand_id,
          strategy_id: item.idea?.strategy_id ?? item.strategy_id,
          brand_name:
            item.idea?.company?.brand_name ||
            item.company?.brand_name ||
            item.brand_name ||
            "Unknown Brand",
          body:
            item.content_body || (item as any).body || "No content available",
          body_text:
            item.content_body || (item as any).body || "No content available",
        }));

        mapped.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setGeneratedContent(mapped);
        console.log("Unified content processed:", mapped.length, "items");
      } else {
        throw new Error(unifiedRes.error?.message || "Failed to fetch content");
      }
    } catch (error) {
      console.error("Error fetching content from Supabase:", error);
      setGeneratedContent([]);
      setError(
        error instanceof Error ? error.message : "Failed to fetch content",
      );
    } finally {
      setLoadingContent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchContent();
  }, [fetchCompanies, fetchContent]);

  // Keep local search/filters in sync with the URL when navigating via history or external actions
  useEffect(() => {
    const url = new URLSearchParams(location.search);
    const q = url.get("q") || "";
    // status param removed
    const type = url.get("type") || "all";
    const brand = url.get("brand") || "";

    setSearchQuery((prev) => (prev === q ? prev : q));
    // setFilterStatus removed
    setFilterType((prev) => (prev === type ? prev : type));
    setBrandFilter((prev) => (prev === brand ? prev : brand));
  }, [location.search]);

  // If the modal is open and the underlying list item updates (e.g., approved/posted),
  // keep the modal's content object in sync so UI reflects the latest status.
  useEffect(() => {
    if (!viewContentModal.isOpen || !viewContentModal.content) return;
    const currentId = viewContentModal.content.id;
    const latest = generatedContent.find((c: any) => c.id === currentId);
    if (latest) {
      setViewContentModal((prev) => ({
        ...prev,
        content: { ...prev.content, ...latest },
      }));
    }
  }, [generatedContent, viewContentModal.isOpen, viewContentModal.content]);

  // Global '/' shortcut is handled in TopBar; avoid duplicating here to prevent focus conflicts

  // Auto-open deep-linked content modal when `?open=source:id` is present
  const lastOpenRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const open = params.get("open");
      if (!open) {
        lastOpenRef.current = null;
        return;
      }
      if (viewContentModal.isOpen) return;
      if (lastOpenRef.current === open) return;

      const [source, idStr] = open.split(":");
      if (!source || !idStr) return;
      // Find the content item once data is loaded
      const match = generatedContent.find(
        (c: any) => String(c.id) === idStr && c.source === source,
      );
      if (match) {
        lastOpenRef.current = open;
        // Inline open logic to avoid ordering/deps issues
        const newParams = new URLSearchParams(location.search);
        const resolvedSource = "content";
        newParams.set("open", `${resolvedSource}:${match.id}`);
        // Normalize the URL if needed but avoid adding to history from auto-open
        navigate({ search: newParams.toString() }, { replace: true });
        setViewContentModal({
          isOpen: true,
          content: match,
          strategyId:
            match.strategy_id ||
            match.idea?.strategy_id ||
            match.metadata?.parent_strategy_id,
        });
      } else if (!loading && !loadingContent) {
        // If we've loaded data and still didn't find the item, clean up the URL and notify
        const cleanupParams = new URLSearchParams(location.search);
        cleanupParams.delete("open");
        navigate({ search: cleanupParams.toString() }, { replace: true });
        push({
          title: "Link not found",
          message: "The linked content is unavailable.",
          variant: "warning",
        });
      }
    } catch (_e) {
      // noop – if parsing fails, just ignore
    }
  }, [
    generatedContent,
    location.search,
    viewContentModal.isOpen,
    navigate,
    loading,
    loadingContent,
    push,
  ]);

  // const refreshContent = async () => {
  //   await fetchContent()
  // }

  const handleDeleteClick = (content: any) => {
    setDeleteDialog({
      isOpen: true,
      content,
      loading: false,
    });
  };

  const { call: runDelete, loading: deleting } = useAsyncCallback(async () => {
    if (!deleteDialog.content) return;
    console.log(
      `Attempting to delete content from ${deleteDialog.content.source}`,
    );
    console.log("Content to delete:", deleteDialog.content);

    const { error } = await supabase
      .from(deleteDialog.content.source)
      .delete()
      .eq("id", deleteDialog.content.id);

    if (error) {
      console.error("Supabase delete error:", error);
      push({
        title: "Delete failed",
        message: `Failed to delete: ${error.message}`,
        variant: "error",
      });
      return;
    }

    console.log("Content deleted successfully from Supabase");
    setGeneratedContent((prev) =>
      prev.filter((content) => content.id !== deleteDialog.content.id),
    );
    setDeleteDialog({ isOpen: false, content: null, loading: false });
    console.log("Content deleted successfully and UI updated");
    push({ title: "Deleted", message: "Content removed", variant: "success" });
  });

  const handleDeleteConfirm = () => {
    void runDelete();
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false });
  };

  const allContent = generatedContent.map((content) => ({
    ...content,
    company_id:
      content.company_id ?? content.idea?.company_id ?? content.brand_id,
    strategy_id: content.strategy_id ?? content.idea?.strategy_id,
    brand_name:
      content.brand_name ||
      content.idea?.company?.brand_name ||
      content.company?.brand_name ||
      "Unknown Brand",
  }));

  const filteredContent = allContent.filter((content) => {
    const matchesStatus = true;
    const matchesType = filterType === "all" || content.type === filterType;
    const matchesBrand =
      !brandFilter || String(content.company_id) === brandFilter;
    const matchesSearch =
      !searchQuery ||
      (content.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.body || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesBrand && matchesSearch;
  });

  const handleViewContent = useCallback(
    (content: any) => {
      console.log("Opening content modal for:", content);
      console.log(
        "Content has strategy_id (from idea or legacy column):",
        content.strategy_id,
      );
      // Remember the current focused element to restore after closing
      lastFocusRef.current = (document.activeElement as HTMLElement) || null;
      // Update URL with deep link
      const params = new URLSearchParams(location.search);
      const source = "content";
      params.set("open", `${source}:${content.id}`);
      // Push a history entry so Back closes the modal and returns to prior state
      navigate({ search: params.toString() }, { replace: false });
      setViewContentModal({
        isOpen: true,
        content,
        strategyId:
          content.strategy_id ||
          content.idea?.strategy_id ||
          content.metadata?.parent_strategy_id, // Prefer idea.strategy_id post-3NF
      });
    },
    [navigate, location.search],
  );

  const handleCloseViewModal = () => {
    // Remove deep link from URL
    const params = new URLSearchParams(location.search);
    params.delete("open");
    navigate({ search: params.toString() }, { replace: true });
    setViewContentModal({
      isOpen: false,
      content: null,
      strategyId: undefined,
    });
    // Restore focus to the previously focused item
    setTimeout(() => {
      lastFocusRef.current?.focus();
      lastFocusRef.current = null;
    }, 0);
  };

  // approval-related status options fully removed

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "generated_content", label: "Generated Content" },
    { value: "blog_post", label: "Blog Post" },
    { value: "social_post", label: "Social Post" },
    { value: "ad_copy", label: "Ad Copy" },
    { value: "email", label: "Email" },
  ];

  const brandOptions = [
    { value: "", label: "All Companies" },
    ...companies.map((company) => ({
      value: String(company.id),
      label: company.brand_name || company.name || "Unnamed Company",
    })),
  ];

  // status badge logic handled in ContentListItem

  // moved type icon & status logic into ContentListItem for cleaner page file
  // Copy link action handler
  const { call: copyLinkCall } = useAsyncCallback(async (content: any) => {
    const params = new URLSearchParams(location.search);
    const source = "content";
    params.set("open", `${source}:${content.id}`);
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const url = `${siteUrl}/content?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      push({ message: "Link copied", variant: "success" });
    } catch (_e) {
      push({ message: "Copy failed. Try again.", variant: "error" });
    }
  });

  const isFiltersActive =
    (searchQuery && searchQuery.length > 0) ||
    // status filter removed
    (filterType && filterType !== "all") ||
    (brandFilter && brandFilter !== "");

  const clearFilters = () => {
    setSearchQuery("");
    // status reset removed
    setFilterType("all");
    setBrandFilter("");
    const params = new URLSearchParams(location.search);
    params.delete("q");
    params.delete("status");
    params.delete("type");
    params.delete("brand");
    navigate({ search: params.toString() }, { replace: true });
    // Refocus the search box for quick typing
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  // Collapsible groups state
  const [collapsedBrands, setCollapsedBrands] = useState<
    Record<string, boolean>
  >({});
  const toggleBrand = (brand: string) =>
    setCollapsedBrands((prev) => ({ ...prev, [brand]: !prev[brand] }));

  return (
    <PageContainer>
      <PageHeader
        title="Content"
        description="Review and manage generated content."
        icon={<FileText className="h-5 w-5" />}
        actions={
          <Button
            onClick={fetchContent}
            loading={loadingContent}
            disabled={loadingContent}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <ViewContentModal
        isOpen={viewContentModal.isOpen}
        onClose={handleCloseViewModal}
        content={viewContentModal.content}
        strategyId={viewContentModal.strategyId}
        onPosted={(updated) => {
          setGeneratedContent((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, post: true } : c)),
          );
        }}
        onUpdated={(updated) => {
          setGeneratedContent((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          );
          setViewContentModal((prev) =>
            prev.isOpen && prev.content?.id === updated.id
              ? { ...prev, content: { ...prev.content, ...updated } }
              : prev,
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete content"
        message={`Delete "${deleteDialog.content?.title}"? This can’t be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content"
                value={searchQuery}
                ref={searchInputRef}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  const params = new URLSearchParams(location.search);
                  if (v) params.set("q", v);
                  else params.delete("q");
                  navigate({ search: params.toString() }, { replace: true });
                }}
                aria-label="Search content"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    const params = new URLSearchParams(location.search);
                    params.delete("q");
                    navigate({ search: params.toString() }, { replace: true });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select
              options={brandOptions}
              value={brandFilter}
              onChange={(e) => {
                const v = e.target.value;
                setBrandFilter(v);
                const params = new URLSearchParams(location.search);
                if (v) params.set("brand", v);
                else params.delete("brand");
                navigate({ search: params.toString() }, { replace: true });
              }}
            />
            <Select
              options={typeOptions}
              value={filterType}
              onChange={(e) => {
                const v = e.target.value as typeof filterType;
                setFilterType(v);
                const params = new URLSearchParams(location.search);
                if (v && v !== "all") params.set("type", v);
                else params.delete("type");
                navigate({ search: params.toString() }, { replace: true });
              }}
            />
            {/* Status filter removed */}
          </div>
          {isFiltersActive && (
            <div className="flex justify-between items-center text-base text-gray-500">
              <span className="truncate">
                {filteredContent.length} result
                {filteredContent.length === 1 ? "" : "s"}
              </span>
              <Button variant="outline" size="xs" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <PageContainer noGap className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ListSkeleton rows={4} avatar="square" showTrailingButton />
              </CardContent>
            </Card>
          ))}
        </PageContainer>
      )}

      {/* Content by Company */}
      {!loading && !error && filteredContent.length > 0 && (
        <div className="space-y-5">
          {(() => {
            const grouped = filteredContent.reduce(
              (acc, content) => {
                const brandName = content.brand_name || "Unknown Brand";
                if (!acc[brandName])
                  acc[brandName] = [] as typeof filteredContent;
                acc[brandName].push(content);
                return acc;
              },
              {} as Record<string, typeof filteredContent>,
            );
            const entries = Object.entries(grouped) as [
              string,
              typeof filteredContent,
            ][];

            return entries.map(([brandName, brandContent]) => {
              const totalContent = brandContent.length;
              // approval-related metrics removed
              const collapsed = collapsedBrands[brandName];
              return (
                <div
                  key={brandName}
                  className="border border-gray-200 rounded-xl bg-white shadow-sm hover:border-brand-300 transition"
                >
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-t-xl"
                    onClick={() => toggleBrand(brandName)}
                    aria-expanded={!collapsed}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-base font-semibold shadow-sm">
                        {brandName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight text-base">
                          {brandName}
                        </h3>
                        {/* Approved count removed */}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="primary" className="text-xs px-2 py-0.5">
                        {totalContent} piece{totalContent === 1 ? "" : "s"}
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
                        {brandContent.map((content: any) => (
                          <ContentListItem
                            key={content.id}
                            content={content}
                            onView={handleViewContent}
                            onDelete={handleDeleteClick}
                            onCopyLink={async (c) => {
                              await copyLinkCall(c);
                            }}
                          />
                        ))}
                      </ul>
                      <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                        <HelpCircle className="h-3 w-3" /> How content
                        generation works
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
      {filteredContent.length === 0 && (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-white" />}
          title={allContent.length === 0 ? "No content" : "No matches"}
          message={
            allContent.length === 0
              ? "Generate content from Ideas."
              : "Adjust filters to see more."
          }
          variant="brand"
          actions={
            allContent.length > 0 && isFiltersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}
    </PageContainer>
  );
}
