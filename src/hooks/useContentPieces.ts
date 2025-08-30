import { useState, useEffect, useCallback } from "react";
import { supabase, type Tables } from "../lib/supabase";

// UI-facing content shape used by Dashboard and other components
export type ContentPiece = {
  id: string;
  company_id: string;
  type: "blog_post" | "social_post" | "ad_copy" | "email" | "content_strategy";
  status: "draft" | "approved";
  title: string;
  body: string;
  platform?: string;
  strategy_id?: string;
  metadata?: {
    prompt?: string;
    generated_at?: string;
    word_count?: number;
  };
  created_at: string;
};

type IdeaRow = Tables<"ideas">;
type ContentRow = Tables<"content"> & {
  idea?: Pick<IdeaRow, "company_id" | "strategy_id">;
};

export function useContentPieces(companyId?: string) {
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapContentRow = (row: ContentRow): ContentPiece => {
    const cid = row.idea?.company_id;
    const sid = row.idea?.strategy_id;
    const titleFallback =
      typeof row.content_body === "string" && row.content_body
        ? (row.content_body as string).slice(0, 60) +
          (row.content_body.length > 60 ? "…" : "")
        : "Content";
    const platformLabel =
      row.platform === "twitter"
        ? "Twitter"
        : row.platform === "linkedin"
          ? "LinkedIn"
          : row.platform === "newsletter"
            ? "Newsletter"
            : row.platform === "facebook"
              ? "Facebook"
              : row.platform === "instagram"
                ? "Instagram"
                : row.platform === "youtube"
                  ? "YouTube"
                  : row.platform === "tiktok"
                    ? "TikTok"
                    : row.platform === "blog"
                      ? "Blog"
                      : row.platform;
    return {
      id: String(row.id),
      company_id: String(cid ?? ""),
      type: row.platform === "newsletter" ? "email" : "social_post",
      status:
        row.status === "approved" || row.post === true ? "approved" : "draft",
      title: (row as any).title || titleFallback,
      body: row.content_body || (row as any).body || "",
      platform: platformLabel,
      strategy_id: sid != null ? String(sid) : undefined,
      created_at: row.created_at,
    };
  };

  // No legacy mapping; unified content only

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Unified content only
      const contentQ = supabase
        .from("content")
        .select(
          companyId
            ? "*, idea:ideas!inner(company_id,strategy_id)"
            : "*, idea:ideas(company_id,strategy_id)",
        )
        .order("created_at", { ascending: false });

      // When filtering by company, compare against the numeric company_id on the joined ideas table.
      // PostgREST expects filters to use the relationship name (ideas), not the select alias.
      const companyIdNum =
        companyId != null &&
        companyId !== "" &&
        !Number.isNaN(Number(companyId))
          ? Number(companyId)
          : undefined;
      const contentFiltered =
        companyIdNum != null
          ? contentQ.eq("ideas.company_id", companyIdNum)
          : contentQ;
      const contentRes = await contentFiltered;

      if (contentRes.error) {
        throw new Error(contentRes.error.message || "Failed to load content");
      }

      const rows = (contentRes.data as ContentRow[] | null) || [];
      const all: ContentPiece[] = rows.map(mapContentRow);

      // Sort newest first
      all.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setContentPieces(all);
    } catch (err) {
      setContentPieces([]);
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    contentPieces,
    loading,
    error,
    refetch: fetchContent,
  };
}
