import React, { useMemo, useState, useCallback } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { PageContainer } from "../components/layout/PageContainer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useContentPieces } from "../hooks/useContentPieces";
import { Button } from "../components/ui/Button";
import { cn, truncateText } from "../lib/utils";
import { ViewContentModal } from "../components/content/ViewContentModal";
import { supabase } from "../lib/supabase";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function Calendar() {
  useDocumentTitle("Calendar — AI Marketing");
  const [cursor, setCursor] = useState(startOfMonth(new Date()));
  const { contentPieces, loading, refetch } = useContentPieces();
  const [viewing, setViewing] = useState<{
    isOpen: boolean;
    content: any | null;
  }>({ isOpen: false, content: null });

  const openContent = useCallback(
    async (id: string) => {
      // Try to find from existing cache first
      const cached = contentPieces.find((c) => c.id === id);
      if (cached) {
        // Fetch full row (with idea join) for richer modal (platform, etc.)
        const { data, error } = await supabase
          .from("content")
          .select(
            "*, idea:ideas(*, company:companies(*), strategy:strategies(*))",
          )
          .eq("id", cached.id)
          .single();
        const row = error ? null : data;
        const modalShape = {
          id: Number(cached.id),
          created_at: cached.created_at,
          post: cached.status === "approved" ? true : false,
          content_body: cached.body,
          title: cached.title,
          status: cached.status,
          platform: cached.platform,
          brand_name: (row as any)?.idea?.company?.brand_name || undefined,
          idea: (row as any)?.idea,
          company: (row as any)?.idea?.company,
          strategy: (row as any)?.idea?.strategy,
          source: "content" as const,
          scheduled_at: cached.scheduled_at,
        };
        setViewing({ isOpen: true, content: modalShape });
      }
    },
    [contentPieces],
  );

  const closeModal = () => setViewing({ isOpen: false, content: null });

  // Group scheduled content by yyyy-mm-dd
  const byDay = useMemo(() => {
    const map: Record<string, typeof contentPieces> = {};
    contentPieces.forEach((c) => {
      if (!c.scheduled_at) return;
      const dt = new Date(c.scheduled_at);
      const key = dt.toISOString().slice(0, 10);
      (map[key] = map[key] || []).push(c);
    });
    return map;
  }, [contentPieces]);

  const monthStart = cursor;
  const monthEnd = endOfMonth(cursor);
  const days: Date[] = [];
  // Leading blanks (Sunday=0)
  const leading = monthStart.getDay();
  for (let i = 0; i < leading; i++) {
    days.push(
      new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        i - leading + 1,
      ),
    );
  }
  for (let d = 1; d <= monthEnd.getDate(); d++) {
    days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
  }
  // Trailing to complete 42 cells (6 weeks)
  while (days.length < 42) {
    const last = days[days.length - 1];
    days.push(
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
    );
  }

  const monthLabel = cursor.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
  const isSameMonth = (d: Date) => d.getMonth() === cursor.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Calendar"
          description="Plan and visualize scheduled content across brands and channels."
          icon={<CalendarIcon className="h-6 w-6" />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCursor(startOfMonth(new Date()))}
              >
                Today
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCursor((c) => addMonths(c, -1))}
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setCursor((c) => addMonths(c, 1))}
                  aria-label="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          }
        />
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4" aria-live="polite">
            {monthLabel}
          </h2>
          <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-gray-200 bg-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="bg-white p-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-600"
              >
                {d}
              </div>
            ))}
            {days.map((d, idx) => {
              const key = d.toISOString().slice(0, 10);
              const items = byDay[key] || [];
              const inMonth = isSameMonth(d);
              const isToday = key === todayStr;
              return (
                <div key={idx} className={cn("relative h-32")}>
                  <button
                    type="button"
                    className={cn(
                      "w-full h-full flex flex-col text-left bg-white p-1.5 rounded-none focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors",
                      !inMonth && "bg-gray-50 text-gray-400",
                      isToday && "ring-2 ring-brand-500",
                    )}
                    aria-label={`${d.toDateString()} ${items.length ? items.length + " scheduled items" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          !inMonth && "text-gray-400",
                        )}
                      >
                        {d.getDate()}
                      </span>
                      {items.length > 0 && (
                        <span className="ml-1 inline-flex items-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold px-1.5 py-0.5">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-1 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 pr-0.5">
                      {items.slice(0, 3).map((it) => (
                        <li key={it.id} className="group">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openContent(it.id);
                            }}
                            className="w-full text-left rounded-md border border-gray-200 bg-brand-50 hover:bg-brand-100 transition px-1.5 py-1 cursor-pointer text-[11px] leading-tight font-medium text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {truncateText(it.title || it.body || "Content", 40)}
                          </button>
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="text-[10px] text-gray-500 font-medium">
                          +{items.length - 3} more…
                        </li>
                      )}
                      {loading && items.length === 0 && inMonth && idx < 7 && (
                        <li className="text-[10px] text-gray-400">Loading…</li>
                      )}
                    </ul>
                  </button>
                </div>
              );
            })}
          </div>
          {Object.keys(byDay).length === 0 && !loading && (
            <div className="mt-6 text-center text-sm text-gray-500">
              No scheduled content yet. Schedule items from the Content page to
              see them here.
            </div>
          )}
        </div>
      </PageContainer>
      {/* Modal */}
      <ViewContentModal
        isOpen={viewing.isOpen && !!viewing.content}
        onClose={closeModal}
        content={viewing.content || ({} as any)}
        onUpdated={(updated) => {
          if (!updated) return;
          // Optimistically update modal content immediately
          setViewing((v) =>
            v.content ? { ...v, content: { ...v.content, ...updated } } : v,
          );
          // Refresh underlying hook data so calendar grid reflects new scheduling
          // (e.g., when scheduling or clearing schedule from the modal)
          refetch();
        }}
      />
    </>
  );
}

export default Calendar;
