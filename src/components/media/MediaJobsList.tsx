import React from "react";
import { useMediaJobs } from "./useMediaJobs";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

interface Props {
  companyId: number | null;
  className?: string;
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
  const { companyId, className } = props;
  const { jobs, loading, error, reload, loadAssets } = useMediaJobs({
    companyId,
    limit: 50,
  });

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Recent media jobs
        </h3>
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
          return (
            <li key={job.id} className="rounded-xl border bg-white p-3">
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
              {job.status === "completed" &&
              job.assets &&
              job.assets.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {job.assets.map((a) => {
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
                        <div className="absolute left-1 top-1 rounded bg-white/90 px-2 py-1 text-base text-gray-800 shadow-sm font-semibold leading-none min-h-[1.5rem] min-w-[1.5rem] flex items-center justify-center">
                          {a.asset_index + 1}
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
