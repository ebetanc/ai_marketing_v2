import React from "react";
import { listJobs, listAssets, MediaJob, MediaAsset } from "../../lib/media";
import { useToast } from "../ui/Toast";
import { supabase } from "../../lib/supabase";

interface UseMediaJobsOptions {
  companyId: number | null;
  refreshIntervalMs?: number;
  limit?: number;
}

interface MediaJobWithAssets extends MediaJob {
  assets?: MediaAsset[];
  assetsLoaded?: boolean;
}

export function useMediaJobs({
  companyId,
  refreshIntervalMs = 5000,
  limit = 25,
}: UseMediaJobsOptions) {
  const { push } = useToast();
  const [jobs, setJobs] = React.useState<MediaJobWithAssets[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Realtime channel ref for cleanup when company changes
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const loadingAssetsRef = React.useRef<Set<number>>(new Set());

  const load = React.useCallback(async () => {
    if (!companyId) {
      setJobs([]);
      return;
    }
    setLoading(true);
    try {
      const data = await listJobs(companyId, limit);
      setJobs((prev) => {
        // Preserve already loaded assets
        const byId: Record<number, MediaJobWithAssets> = {};
        prev.forEach((j) => {
          byId[j.id] = j;
        });
        return data.map((j) => ({
          ...j,
          assets: byId[j.id]?.assets,
          assetsLoaded: byId[j.id]?.assetsLoaded,
        }));
      });
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [companyId, limit]);

  const loadAssets = React.useCallback(
    async (jobId: number) => {
      if (loadingAssetsRef.current.has(jobId)) return;
      loadingAssetsRef.current.add(jobId);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, assetsLoaded: true } : j)),
      );
      try {
        const assets = await listAssets(jobId);
        setJobs((prev) => {
          return prev.map((j) => {
            if (j.id === jobId) {
              return { ...j, assets, assetsLoaded: true };
            }
            return j;
          });
        });
      } catch (e: any) {
        push({
          message: e.message || "Failed to load assets",
          variant: "error",
        });
      }
      loadingAssetsRef.current.delete(jobId);
    },
    [push],
  );

  React.useEffect(() => {
    load();
  }, [load]);

  // Auto-load assets for jobs that just completed and haven't loaded assets yet
  React.useEffect(() => {
    jobs
      .filter((j) => j.status === "completed" && !j.assetsLoaded)
      .forEach((j) => {
        loadAssets(j.id);
      });
  }, [jobs, loadAssets]);

  // Realtime subscription: listen to job & asset changes instead of interval polling
  React.useEffect(() => {
    if (!companyId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Tear down any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`media_jobs_company_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "media_jobs",
          filter: `company_id=eq.${companyId}`,
        },
        (payload: any) => {
          setJobs((prev) => {
            const id = payload.new?.id ?? payload.old?.id;
            const idx = prev.findIndex((j) => j.id === id);
            const next = [...prev];
            if (payload.eventType === "INSERT") {
              if (idx === -1) {
                const newJob: MediaJobWithAssets = {
                  ...(payload.new as MediaJob),
                  assets: [],
                  assetsLoaded: false,
                };
                return [newJob, ...next].slice(0, limit);
              } else {
                next[idx] = { ...next[idx], ...(payload.new as MediaJob) };
                return next;
              }
            }
            if (payload.eventType === "UPDATE") {
              if (idx !== -1) {
                next[idx] = { ...next[idx], ...(payload.new as MediaJob) };
                return next;
              }
              return next;
            }
            if (payload.eventType === "DELETE") {
              if (idx !== -1) {
                next.splice(idx, 1);
                return next;
              }
              return next;
            }
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "media_assets",
        },
        (payload: any) => {
          setJobs((prev) =>
            prev.map((j) =>
              j.id === payload.new.job_id
                ? {
                    ...j,
                    assets: [...(j.assets || []), payload.new as MediaAsset],
                    assetsLoaded: true,
                  }
                : j,
            ),
          );
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [companyId, limit]);

  // (Optional) very infrequent refresh as safety net; disabled by default
  // React.useEffect(() => {
  //   if (!companyId) return;
  //   const id = window.setInterval(() => load(), refreshIntervalMs * 12);
  //   return () => window.clearInterval(id);
  // }, [companyId, load, refreshIntervalMs]);

  return { jobs, loading, error, reload: load, loadAssets };
}
