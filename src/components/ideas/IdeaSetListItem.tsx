import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Target,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatDate, relativeTime, truncateText } from "../../lib/utils";
import { IconButton } from "../ui/IconButton";

interface TopicPreview {
  number: number;
  topic: string;
  description: string;
  image_prompt: string;
}

interface IdeaSetListItemProps {
  idea: any;
  topics: TopicPreview[];
  expanded: boolean;
  onToggle: (id: number) => void;
  onViewTopic: (idea: any, topic: TopicPreview) => void;
  onDelete?: (idea: any) => void;
  // Optional generation handlers/state
  onGenerateTopic?: (idea: any, topic: TopicPreview) => void;
  generatingMap?: Record<string, boolean>; // key: `${idea.id}-${topic.number}`
  generatedMap?: Record<string, boolean>; // key: `${idea.id}-${topic.number}`
  // Empty-set recovery
  onRegenerateEmpty?: (idea: any) => void;
  regenerating?: boolean;
}

export function IdeaSetListItem({
  idea,
  topics,
  expanded,
  onToggle,
  onViewTopic,
  onDelete,
  onGenerateTopic,
  generatingMap,
  generatedMap,
  onRegenerateEmpty,
  regenerating,
}: IdeaSetListItemProps) {
  return (
    <li className="relative">
      <div
        className="group relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-brand-400 hover:shadow transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
        role="button"
        tabIndex={0}
        onClick={() => onToggle(idea.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(idea.id);
          }
        }}
        aria-expanded={expanded}
        aria-controls={`idea-panel-${idea.id}`}
        aria-label={`Toggle Idea Set ${idea.id}`}
      >
        <div className="w-12 h-12 bg-brand-600/10 ring-1 ring-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-6 w-6 text-brand-700" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <span
              className="font-medium text-gray-900 truncate"
              title={`Idea Set #${idea.id}`}
            >
              Idea Set #{idea.id}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
              <Calendar className="h-3 w-3" /> {formatDate(idea.created_at)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {topics.length > 0 && (
              <Badge variant="primary" className="text-xs px-2 py-0.5">
                {topics.length} topics
              </Badge>
            )}
            {idea.strategy_id && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">
                Strategy #{idea.strategy_id}
              </span>
            )}
            {idea.angle_number && (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">
                Angle {idea.angle_number}
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium">
              <Target className="h-3 w-3 mr-1 text-gray-500" /> {topics.length}
            </span>
            <span className="text-xs text-gray-400">
              {relativeTime(idea.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 pl-2">
          {onDelete && (
            <IconButton
              aria-label="Delete Idea Set"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea);
              }}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          )}
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </div>
      {expanded && (
        <div
          id={`idea-panel-${idea.id}`}
          className="mt-3 ml-4 pl-4 border-l border-gray-200 space-y-2"
        >
          {topics.length === 0 && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
              <div className="flex-1 text-sm leading-relaxed">
                <p className="font-medium mb-1">
                  No topics were generated for this set.
                </p>
                <p className="text-amber-700/80">
                  This sometimes happens if the AI response was empty or failed
                  validation. You can retry generating this idea set.
                </p>
              </div>
              {onRegenerateEmpty && (
                <div className="flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerateEmpty(idea);
                    }}
                    disabled={!!regenerating}
                    className="bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    {regenerating ? "Retrying…" : "Retry"}
                  </Button>
                </div>
              )}
            </div>
          )}
          {topics.map((t) => {
            const preview = truncateText(t.description || t.topic, 140);
            const hasImage =
              !!t.image_prompt && t.image_prompt !== "No image prompt provided";
            const key = `${idea.id}-${t.number}`;
            const isGenerating = generatingMap?.[key];
            const isGenerated = generatedMap?.[key];
            return (
              <div
                key={t.number}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/70 border border-gray-200 hover:border-brand-300 transition group"
              >
                <div className="w-8 h-8 rounded-md bg-brand-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {t.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-gray-900 truncate"
                    title={t.topic}
                  >
                    {t.topic}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                    {preview}
                  </p>
                  {hasImage && (
                    <p
                      className="text-[10px] text-brand-600 mt-1 line-clamp-1"
                      title={t.image_prompt}
                    >
                      Image prompt included
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTopic(idea, t);
                      }}
                      aria-label={`Open topic ${t.number} of idea set ${idea.id}`}
                    >
                      View
                    </Button>
                  </div>
                  {onGenerateTopic && (
                    <div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isGenerating && !isGenerated)
                            onGenerateTopic(idea, t);
                        }}
                        disabled={!!isGenerating || !!isGenerated}
                        className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white"
                        aria-label={`Generate content for topic ${t.number} of idea set ${idea.id}`}
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        {isGenerating
                          ? "Generating…"
                          : isGenerated
                            ? "Generated"
                            : "Generate Content"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </li>
  );
}

export default IdeaSetListItem;
