import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  X,
  FileText,
  Calendar,
  User,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal"; // Footer still used; header replaced
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/Toast";
import { ModalBrandHeader } from "@/components/ui/ModalBrandHeader";
import type { Tables } from "@/lib/supabase";
import { useAsyncCallback } from "@/hooks/useAsync";

type CompanyRow = Tables<"companies">;
type StrategyRow = Tables<"strategies">;
type IdeaRow = Tables<"ideas">;
type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow };

type ContentSource = "content";

type ModalContent = {
  id: number;
  created_at: string;
  post: boolean | null;
  // body variants used across the app
  content_body?: string | null;
  body?: string | null;
  body_text?: string | null;
  // UI/derived fields
  title?: string | null;
  status?: string | null;
  platform?: string | null;
  type?: string | null;
  brand_name?: string | null;
  metadata?: Record<string, unknown> | null;
  // Relations (when fetched with joins)
  idea?: IdeaJoined;
  company?: CompanyRow;
  strategy?: StrategyRow;
  // Discriminator for source table
  source: ContentSource;
  // Optional angles array when already transformed upstream
  angles?: unknown[];
  // Scheduling
  scheduled_at?: string | null;
};

interface ViewContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ModalContent;
  strategyId?: string | number;
  onPosted?: (updated: ModalContent) => void;
  onUpdated?: (updated: ModalContent) => void;
}

import { supabase } from "@/lib/supabase";
// Helper: safely format a subset of markdown-like text without using innerHTML
const formatContentBody = (content: string) => {
  if (!content) return content;

  const renderBoldSegments = (text: string) => {
    // Split on **bold** markers and render <strong> nodes safely
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      const isBold =
        part.startsWith("**") && part.endsWith("**") && part.length > 4;
      if (isBold) {
        const inner = part.slice(2, -2);
        return <strong key={i}>{inner}</strong>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  return content.split("\n").map((line, index) => {
    const trimmed = line.trim();

    // Main headers (# )
    if (trimmed.startsWith("# ")) {
      return (
        <h3
          key={index}
          className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0"
        >
          {trimmed.substring(2)}
        </h3>
      );
    }

    // Sub headers (## )
    if (trimmed.startsWith("## ")) {
      return (
        <h4
          key={index}
          className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0"
        >
          {trimmed.substring(3)}
        </h4>
      );
    }

    // Horizontal rules (---)
    if (trimmed === "---") {
      return <hr key={index} className="my-3 border-gray-200" />;
    }

    // Empty lines
    if (trimmed === "") {
      return <div key={index} className="h-2" />;
    }

    // Regular paragraphs with safe bold formatting
    return (
      <p key={index} className="text-base text-gray-700 mb-2 leading-relaxed">
        {renderBoldSegments(line)}
      </p>
    );
  });
};

export function ViewContentModal({
  isOpen,
  onClose,
  content,
  strategyId,
  onPosted,
  onUpdated,
}: ViewContentModalProps) {
  const [expandedAngles, setExpandedAngles] = useState<{
    [key: number]: boolean;
  }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(content?.title || "");
  const [editBody, setEditBody] = useState(
    content?.body_text || content?.body || "",
  );
  const [saving, setSaving] = useState(false);
  // Scheduling state (mock client-side only)
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [timeHour, setTimeHour] = useState("09");
  const [timeMinute, setTimeMinute] = useState("00");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  // Timezone info for clarity
  const [tzInfo] = useState(() => {
    const d = new Date();
    const offsetMin = d.getTimezoneOffset(); // minutes behind UTC (positive if behind)
    const totalMin = -offsetMin; // invert sign: positive means ahead of UTC
    const sign = totalMin >= 0 ? "+" : "-";
    const abs = Math.abs(totalMin);
    const oh = String(Math.floor(abs / 60)).padStart(2, "0");
    const om = String(abs % 60).padStart(2, "0");
    let abbr: string | undefined;
    try {
      const parts = Intl.DateTimeFormat(undefined, {
        timeZoneName: "short",
      }).formatToParts(d);
      abbr = parts.find((p) => p.type === "timeZoneName")?.value;
    } catch (_e) {
      // ignore
    }
    const utcOffset = `UTC${sign}${oh}:${om}`;
    return { abbr: abbr || utcOffset, utcOffset };
  });
  // Re-hydrate edit form when content changes if not actively editing
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(content?.title || "");
      setEditBody(content?.body_text || content?.body || "");
    }
  }, [
    content?.id,
    content?.title,
    content?.body,
    content?.body_text,
    isEditing,
  ]);
  // Rehydrate scheduled time from content
  useEffect(() => {
    if (content?.scheduled_at) {
      const dt = new Date(content.scheduled_at);
      if (!Number.isNaN(dt.getTime())) {
        setScheduledAt(dt);
        setTimeHour(String(dt.getHours()).padStart(2, "0"));
        setTimeMinute(String(dt.getMinutes()).padStart(2, "0"));
      }
    } else {
      setScheduledAt(null);
    }
  }, [content?.scheduled_at]);
  const { call: runPost, loading: posting } = useAsyncCallback(async () => {
    if (!content?.id || !content?.source) return;
    console.log("Posting content:", content.id, "from table:", content.source);
    const { error } = await supabase
      .from(content.source)
      .update({ post: true })
      .eq("id", content.id);

    if (error) {
      console.error("Error posting content:", error);
      push({ message: `Failed to post: ${error.message}`, variant: "error" });
      return;
    }

    console.log("Content posted successfully");
    push({ message: "Content posted successfully!", variant: "success" });
    onPosted?.({ ...content, post: true });
    onClose();
  });
  // Approval flow removed
  const { push } = useToast();

  // Clipboard and share actions as hooks (must be before any early return)
  // Removed copy/share actions

  // Keep component mounted; Modal handles visibility and exit animations
  if (!content) return null;

  // Helper function to parse and extract angles from content
  const extractAngles = (content: ModalContent) => {
    // If content already has angles array (from Supabase transformation)
    if (content?.angles && Array.isArray(content.angles)) {
      return content.angles;
    }

    let parsedContent = null;
    try {
      if (
        typeof content.body === "string" &&
        (content.body.startsWith("[") || content.body.startsWith("{"))
      ) {
        parsedContent = JSON.parse(content.body);
      }
    } catch (error) {
      console.error("Error parsing content body:", error);
      return [];
    }

    if (parsedContent) {
      // If it's an array, return it directly
      if (Array.isArray(parsedContent)) {
        return parsedContent;
      }

      // If it has an angles property
      if (parsedContent.angles && Array.isArray(parsedContent.angles)) {
        return parsedContent.angles;
      }

      // If it's a single object, wrap it in an array
      if (typeof parsedContent === "object") {
        return [parsedContent];
      }
    }

    return [];
  };

  const angles = extractAngles(content);
  const hasAngles = angles.length > 0;

  const toggleAngleExpansion = (index: number) => {
    setExpandedAngles((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const expandAllAngles = () => {
    const newExpandedState: { [key: number]: boolean } = {};
    angles.forEach((_: unknown, index: number) => {
      newExpandedState[index] = true;
    });
    setExpandedAngles(newExpandedState);
  };

  const collapseAllAngles = () => {
    setExpandedAngles({});
  };

  const handlePost = () => {
    void runPost();
  };

  // const handleApprove removed

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditTitle(content.title || "");
    setEditBody(content.body_text || content.body || "");
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(content.title || "");
    setEditBody(content.body_text || content.body || "");
  };
  const handleSaveEdit = async () => {
    if (!content?.id || !content?.source) return;
    setSaving(true);
    try {
      const update: Record<string, any> = {
        title: editTitle.trim() || null,
        content_body: editBody.trim() || null,
        body_text: editBody.trim() || null,
      };
      const { error } = await supabase
        .from(content.source)
        .update(update)
        .eq("id", content.id)
        .select()
        .single();
      if (error) throw error;
      const updated: ModalContent = { ...content, ...update };
      onUpdated?.(updated);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save content edits", e);
      push({
        message: e instanceof Error ? e.message : "Save failed",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderAngleProperty = (key: string, value: unknown) => {
    if (!value) return null;

    const displayKey = key.replace(/([A-Z])/g, " $1").trim();
    const capitalizedKey =
      displayKey.charAt(0).toUpperCase() + displayKey.slice(1);

    let displayValue: string;
    if (typeof value === "string") {
      displayValue = value.replace(/^["']|["']$/g, "").trim();
    } else if (typeof value === "number" || typeof value === "boolean") {
      displayValue = String(value);
    } else if (typeof value === "object") {
      displayValue = JSON.stringify(value, null, 2);
    } else {
      displayValue = "";
    }

    return (
      <div key={key}>
        <h5 className="text-base font-medium text-gray-900 mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-1 text-brand-600" />
          {capitalizedKey}
        </h5>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayValue}
          </p>
        </div>
      </div>
    );
  };
  const renderAngleContent = (
    angle: Record<string, unknown>,
    index: number,
  ) => {
    const isExpanded = expandedAngles[index];

    // Get angle title/header
    const angleTitle =
      (angle as any).header ||
      (angle as any).title ||
      (angle as any).topic ||
      `Substrategy ${index + 1}`;

    // Get main content preview
    const getPreviewContent = () => {
      if (angle.description) {
        const desc =
          typeof (angle as any).description === "string"
            ? (angle as any).description.replace(/^["']|["']$/g, "").trim()
            : JSON.stringify((angle as any).description);
        return desc.length > 150 ? desc.substring(0, 150) + "..." : desc;
      }
      if (angle.content) {
        const c =
          typeof (angle as any).content === "string"
            ? (angle as any).content.replace(/^["']|["']$/g, "").trim()
            : JSON.stringify((angle as any).content);
        return c.length > 150 ? c.substring(0, 150) + "..." : c;
      }
      return "Click to view angle details...";
    };

    return (
      <Card key={index} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                <span className="text-brand-600 font-semibold text-base">
                  {index + 1}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-base">
                  {angleTitle}
                </h4>
                {Boolean((angle as any).platform) && (
                  <Badge variant="secondary" className="mt-1">
                    {String((angle as any).platform)}
                  </Badge>
                )}
                {!isExpanded && (
                  <p className="text-base text-gray-600 mt-2 leading-relaxed">
                    {getPreviewContent()}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAngleExpansion(index)}
              className="flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>{isExpanded ? "Collapse" : "Expand"}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Render all angle properties dynamically */}
              {Object.keys(angle)
                .filter(
                  (key) =>
                    !["header", "title", "topic", "platform"].includes(key),
                )
                .map((key) => renderAngleProperty(key, (angle as any)[key]))}
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const titleId = "view-content-title";

  // Copy/share handlers removed

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledById={titleId} size="lg">
      <ModalBrandHeader
        titleId={titleId}
        icon={<FileText className="h-6 w-6 text-white" />}
        onClose={onClose}
        title={
          isEditing ? (
            <div className="space-y-1">
              <input
                id="content-title-input"
                aria-label="Content title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-white/30 bg-white/10 text-white placeholder-white/50 rounded-md focus:outline-none focus:ring-2 focus:ring-white/60"
                placeholder="Title"
              />
            </div>
          ) : (
            content.title || "Untitled content"
          )
        }
      />

      <ModalBody className="space-y-6">
        {/* Basic Information */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <FileText className="h-5 w-5 mr-2 text-brand-600" />
              Content info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {/* Status removed */}
                <p className="text-base font-medium text-gray-900">Created</p>
                <p className="text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(content.created_at)}
                </p>
              </div>
              {content.type && content.type !== "social_post" && (
                <div>
                  <p className="text-base font-medium text-gray-900">Type</p>
                  <p className="text-gray-700 capitalize">
                    {content.type.replace(/_/g, " ") || "Content"}
                  </p>
                </div>
              )}

              <div>
                <p className="text-base font-medium text-gray-900">Platform</p>
                <p className="text-gray-700">{content.platform || "—"}</p>
              </div>

              {typeof (content.metadata as any)?.word_count === "number" && (
                <div>
                  <p className="text-base font-medium text-gray-900">
                    Word count
                  </p>
                  <p className="text-gray-700">
                    {String((content.metadata as any).word_count)} words
                  </p>
                </div>
              )}
            </div>

            {strategyId && (
              <div>
                <p className="text-base font-medium text-gray-900">
                  Strategy ID
                </p>
                <Badge variant="secondary" className="font-mono">
                  {strategyId}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Angles Section */}
        {hasAngles ? (
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-brand-600" />
                  Substrategies ({angles.length})
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={expandAllAngles}
                    className="text-base"
                  >
                    Expand all
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={collapseAllAngles}
                    className="text-base"
                  >
                    Collapse all
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {angles.map((angle: any, index: number) =>
                renderAngleContent(angle, index),
              )}
            </CardContent>
          </Card>
        ) : (
          /* Raw Content */
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-brand-600" />
                Content body
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    id="content-body-input"
                    aria-label="Content body"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={14}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                    placeholder="Content body markdown/text"
                  />
                  <p className="text-base text-gray-500">
                    Editing content body
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-base">
                    {formatContentBody(
                      content.body_text || content.body || "No content",
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        {content.metadata && (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="h-5 w-5 mr-2 text-gray-600" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-base text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(content.metadata, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </ModalBody>

      <ModalFooter className="justify-end relative">
        {/* Scheduler popover */}
        {showScheduler && (
          <div
            className="absolute bottom-full mb-3 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20 animate-in fade-in slide-in-from-bottom-2"
            role="dialog"
            aria-label="Schedule content"
          >
            <div className="text-base text-gray-600 mb-2 leading-snug">
              Times shown in <span className="font-semibold">local time</span> (
              {tzInfo.abbr}
              {tzInfo.abbr !== tzInfo.utcOffset && `, ${tzInfo.utcOffset}`}
              ).
            </div>
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-base font-medium">
                {calendarMonth.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(
                    (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {/* Calendar grid */}
            {(() => {
              const firstDay = new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth(),
                1,
              );
              const startWeekday = firstDay.getDay(); // 0=Sun
              const daysInMonth = new Date(
                calendarMonth.getFullYear(),
                calendarMonth.getMonth() + 1,
                0,
              ).getDate();
              const cells: (Date | null)[] = [];
              for (let i = 0; i < startWeekday; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) {
                cells.push(
                  new Date(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth(),
                    d,
                  ),
                );
              }
              const selectedSameDay = (d: Date) =>
                scheduledAt &&
                d.getFullYear() === scheduledAt.getFullYear() &&
                d.getMonth() === scheduledAt.getMonth() &&
                d.getDate() === scheduledAt.getDate();
              const today = new Date();
              const todayStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                0,
                0,
                0,
                0,
              );
              return (
                <div className="grid grid-cols-7 gap-1 mb-3 text-center">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                    <div
                      key={d}
                      className="text-base uppercase tracking-wide text-gray-500 font-semibold py-1 leading-none"
                    >
                      {d}
                    </div>
                  ))}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const isSelectedDay = selectedSameDay(d);
                    const isPastDay = d < todayStart; // strictly before today
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isPastDay) return; // ignore clicks on past days
                          // preserve chosen time when changing day
                          const base = new Date(d);
                          base.setHours(
                            parseInt(timeHour, 10),
                            parseInt(timeMinute, 10),
                            0,
                            0,
                          );
                          setScheduledAt(base);
                          setScheduleError(null);
                        }}
                        disabled={isPastDay}
                        className={`text-base h-8 w-8 flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${isPastDay ? "text-gray-300 cursor-not-allowed" : "hover:bg-brand-50 text-gray-700"} ${isSelectedDay ? "bg-brand-600 text-white hover:bg-brand-600" : ""}`}
                        aria-pressed={isSelectedDay ? true : false}
                        aria-label={d.toDateString()}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
            {/* Time selectors */}
            <div className="flex items-end space-x-2 mb-3">
              <div className="flex-1">
                <label
                  htmlFor="schedule-hour"
                  className="block text-base font-medium text-gray-700 mb-1"
                >
                  Hour
                </label>
                <select
                  id="schedule-hour"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={timeHour}
                  onChange={(e) => {
                    setTimeHour(e.target.value);
                    setScheduledAt((prev) => {
                      if (!prev) return prev;
                      const next = new Date(prev);
                      next.setHours(parseInt(e.target.value, 10));
                      return next;
                    });
                    setScheduleError(null);
                  }}
                >
                  {Array.from({ length: 24 }, (_, h) =>
                    String(h).padStart(2, "0"),
                  ).map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="schedule-minute"
                  className="block text-base font-medium text-gray-700 mb-1"
                >
                  Minute
                </label>
                <select
                  id="schedule-minute"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
                  value={timeMinute}
                  onChange={(e) => {
                    setTimeMinute(e.target.value);
                    setScheduledAt((prev) => {
                      if (!prev) return prev;
                      const next = new Date(prev);
                      next.setMinutes(parseInt(e.target.value, 10));
                      return next;
                    });
                    setScheduleError(null);
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) =>
                    String(i * 5).padStart(2, "0"),
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {scheduleError && (
              <div
                className="text-base text-red-600 mb-2 font-medium"
                role="alert"
              >
                {scheduleError}
              </div>
            )}
            <div className="flex justify-between items-center gap-2">
              <div className="text-base text-gray-600 flex-1 leading-snug">
                {scheduledAt
                  ? `Scheduled: ${scheduledAt.toLocaleString()}`
                  : "Pick a day & time"}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!content?.id || !content?.source) return;
                    const prev = scheduledAt;
                    setScheduledAt(null);
                    push({ message: "Schedule cleared", variant: "info" });
                    void (async () => {
                      const { error } = await supabase
                        .from(content.source)
                        .update({ scheduled_at: null })
                        .eq("id", content.id);
                      if (error) {
                        console.error("Failed clearing schedule", error);
                        push({
                          message: error.message,
                          variant: "error",
                        });
                        // rollback UI if failed
                        setScheduledAt(prev);
                      } else {
                        onUpdated?.({ ...content, scheduled_at: null });
                        setScheduleError(null);
                      }
                    })();
                  }}
                  disabled={!scheduledAt}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // If day not picked yet, pick today
                    let dt = scheduledAt;
                    if (!dt) {
                      dt = new Date();
                      dt.setHours(
                        parseInt(timeHour, 10),
                        parseInt(timeMinute, 10),
                        0,
                        0,
                      );
                      setScheduledAt(dt);
                    }
                    if (!content?.id || !content?.source) return;
                    // Validation: cannot schedule in the past (allow 30s grace)
                    const now = new Date();
                    if (dt!.getTime() < now.getTime() + 30000) {
                      setScheduleError("Choose a future date & time");
                      push({
                        message: "Cannot schedule in the past",
                        variant: "error",
                      });
                      return;
                    }
                    const iso = dt!.toISOString();
                    void (async () => {
                      const { error } = await supabase
                        .from(content.source)
                        .update({ scheduled_at: iso })
                        .eq("id", content.id)
                        .select()
                        .single();
                      if (error) {
                        console.error("Failed to set schedule", error);
                        push({
                          message: error.message,
                          variant: "error",
                        });
                      } else {
                        push({
                          message: `Scheduled for ${dt!.toLocaleString()}`,
                          variant: "success",
                        });
                        onUpdated?.({ ...content, scheduled_at: iso });
                        setShowScheduler(false);
                        setScheduleError(null);
                      }
                    })();
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex space-x-3 items-center">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  void handleSaveEdit();
                }}
                loading={saving}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                Edit
              </Button>
              <Button
                variant={scheduledAt ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowScheduler((s) => !s)}
                aria-haspopup="dialog"
                aria-expanded={showScheduler}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {scheduledAt ? "Reschedule" : "Schedule"}
              </Button>
              {scheduledAt && (
                <span className="text-base text-gray-600 flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {scheduledAt.toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZoneName: "short",
                    })}
                    <span className="ml-1 text-gray-400">
                      ({tzInfo.utcOffset})
                    </span>
                  </span>
                </span>
              )}
              <Button
                size="sm"
                onClick={handlePost}
                loading={posting}
                disabled={posting}
                variant="primary"
              >
                {posting ? "Posting…" : "Post"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={posting}
              >
                Close
              </Button>
            </>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
