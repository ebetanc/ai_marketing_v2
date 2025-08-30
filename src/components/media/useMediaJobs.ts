import React from "react";
import { listJobs, listAssets, MediaJob, MediaAsset } from "../../lib/media";
import { useToast } from "../ui/Toast";

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
  const timerRef = React.useRef<number | null>(null);
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

  React.useEffect(() => {
    if (!companyId) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      load();
    }, refreshIntervalMs);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [companyId, refreshIntervalMs, load]);

  return { jobs, loading, error, reload: load, loadAssets };
}
