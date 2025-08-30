import React from "react";
import { useMediaJobs } from "./useMediaJobs";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

interface Props {
  companyId: number | null;
  className?: string;
  highlightJobId?: number | null;
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "failed":
      return "error" as const;
    case "processing":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export function MediaJobsList(props: Props) {
  const { companyId, className, highlightJobId } = props;
  const { jobs, loading, error, reload, loadAssets } = useMediaJobs({
    companyId,
    limit: 50,
  });
  const [showInputs, setShowInputs] = React.useState(false);

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-0">
            Recent media jobs
          </h3>
          <label className="flex items-center gap-1 text-xs text-gray-600 select-none cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={showInputs}
              onChange={(e) => setShowInputs(e.target.checked)}
            />
            Show input assets
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => reload()}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>
      {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
      {loading && jobs.length === 0 && (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}
      {!loading && jobs.length === 0 && (
        <p className="text-sm text-gray-500">No jobs yet.</p>
      )}
      <ul className="space-y-3">
        {jobs.map((job) => {
          const waitingForAssets =
            job.status === "completed" && !job.assetsLoaded;
          const highlight = job.id === highlightJobId;
          return (
            <li
              key={job.id}
              className={`rounded-xl border bg-white p-3 relative ${highlight ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}
            >
              {highlight ? (
                <span className="absolute -top-2 left-3 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  New
                </span>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    #{job.id} {job.type === "image" ? "Image" : "Video"} job
                  </p>
                  <p className="max-w-[320px] truncate text-xs text-gray-600">
                    {job.prompt_subject}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(job.status)}>
                    {job.status}
                  </Badge>
                  {job.error_message ? (
                    <Badge variant="error" title={job.error_message}>
                      err
                    </Badge>
                  ) : null}
                  {waitingForAssets ? (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => loadAssets(job.id)}
                    >
                      Assets
                    </Button>
                  ) : null}
                </div>
              </div>
              {job.assets && job.assets.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {job.assets
                    .filter((a) =>
                      showInputs ? true : (a as any).kind !== "input",
                    )
                    .map((a) => {
                      const isImage = !!a.mime_type?.startsWith("image/");
                      const isVideo = !!a.mime_type?.startsWith("video/");
                      return (
                        <div
                          key={a.id}
                          className="relative overflow-hidden rounded-lg border bg-gray-50 group"
                        >
                          {isImage ? (
                            <img
                              src={a.url}
                              alt={`Asset ${a.asset_index}`}
                              className="h-40 w-full object-cover transition-transform group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          ) : null}
                          {isVideo ? (
                            <video
                              src={a.url}
                              className="h-40 w-full object-cover"
                              controls
                              preload="metadata"
                              aria-label={`Video asset ${a.asset_index}`}
                            >
                              <track
                                kind="captions"
                                src=""
                                label="(No captions yet)"
                              />
                            </video>
                          ) : null}
                          {!isImage && !isVideo ? (
                            <div className="p-4 text-xs text-gray-500">
                              Unsupported asset
                            </div>
                          ) : null}
                          <div className="absolute left-1 top-1 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-800 shadow-sm font-semibold leading-none flex items-center gap-1">
                            {(a as any).kind === "input" ? (
                              <span className="inline-block rounded bg-amber-200 text-amber-800 px-1">
                                IN
                              </span>
                            ) : (
                              <span className="inline-block">
                                {a.asset_index + 1}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default MediaJobsList;
