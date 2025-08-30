import { useEffect, useState } from "react";
import { supabase, type Tables } from "../lib/supabase";

type CompanyRow = Tables<"companies">;
export type CompanyUI = CompanyRow & {
  name?: string;
  brand_voice?: { tone: string; style: string; keywords: string[] };
  target_audience_parsed?: {
    demographics: string;
    interests: string[];
    pain_points: string[];
  };
};

export function useCompanies() {
  const [companies, setCompanies] = useState<CompanyUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompaniesFromSupabase = async () => {
    try {
      // Scope query to the current user to align with RLS and reduce payloads
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;

      let query = supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (userId) {
        query = query.eq("owner_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching companies:", error);
        throw error;
      }

      const supabaseCompanies: CompanyUI[] = (data || []).map(
        (company: CompanyRow) => ({
          ...company,
          name: company.brand_name || "Unnamed Brand",
          brand_voice: {
            tone: company.brand_tone || "Not specified",
            style: company.key_offer || "Not specified",
            keywords: company.key_offer
              ? company.key_offer.split(" ").slice(0, 4)
              : [],
          },
          target_audience_parsed: {
            demographics: company.target_audience || "Not specified",
            interests: [],
            pain_points: [],
          },
        }),
      );

      setCompanies(supabaseCompanies);
      setError(null);
    } catch (error) {
      console.error("Error fetching companies from Supabase:", error);
      setCompanies([]);
      setError(
        error instanceof Error ? error.message : "Failed to load companies",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompaniesFromSupabase();
  }, []);

  // Creating companies is handled by CreateBrandModal via Supabase insert

  const deleteCompany = async (companyId: number | string) => {
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", companyId);

      if (error) {
        console.error("Error deleting company:", error);
        return { error: error.message };
      }

      setCompanies((prev) =>
        prev.filter((company) => String(company.id) !== String(companyId)),
      );
      return { error: null };
    } catch (error) {
      console.error("Error deleting company:", error);
      return { error: "Failed to delete company" };
    }
  };
  const refetch = () => {
    setLoading(true);
    fetchCompaniesFromSupabase();
  };

  return {
    companies,
    loading,
    error,
    deleteCompany,
    refetch,
  };
}
