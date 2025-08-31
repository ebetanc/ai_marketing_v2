import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/IconButton";
import { formatDate } from "../../lib/utils";

interface AngleSummary {
  number: number;
  header: string;
  description: string;
  objective: string;
  tonality: string;
}

interface StrategyListItemProps {
  strategy: any;
  angleCount: number;
  platforms: string[];
  angles: AngleSummary[];
  expanded: boolean;
  onToggle: (strategyId: number) => void;
  onViewAngle: (strategy: any, angle: AngleSummary) => void;
  onDelete?: (strategy: any) => void;
  deleting?: boolean;
  ideaAngles?: number[]; // angles that already have idea sets
  onGenerateAngle?: (strategy: any, angle: AngleSummary) => void;
  generatingAngleNumber?: number | null;
}

export function StrategyListItem({
  strategy,
  angleCount,
  platforms,
  angles,
  expanded,
  onToggle,
  onViewAngle,
  onDelete,
  deleting = false,
  ideaAngles = [],
  onGenerateAngle,
  generatingAngleNumber = null,
}: StrategyListItemProps) {
  return (
    <li className="relative">
      <div
        className="group relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-brand-400 hover:shadow transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
        role="button"
        tabIndex={0}
        onClick={() => onToggle(strategy.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(strategy.id);
          }
        }}
        aria-expanded={expanded}
        aria-controls={`strategy-panel-${strategy.id}`}
        aria-label={`Toggle strategy set ${strategy.id}`}
      >
        <div className="w-12 h-12 bg-brand-600/10 ring-1 ring-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="h-6 w-6 text-brand-700" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <span
              className="font-medium text-gray-900 truncate"
              title={`Strategy Set #${strategy.id}`}
            >
              Strategy Set #{strategy.id}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                <Calendar className="h-3 w-3" />{" "}
                {formatDate(strategy.created_at)}
              </span>
              {onDelete && (
                <IconButton
                  aria-label={`Delete strategy set #${strategy.id}`}
                  variant="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(strategy);
                  }}
                  disabled={deleting}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            {angleCount > 0 && (
              <Badge variant="primary" className="text-xs px-2 py-0.5">
                {angleCount} strategies
              </Badge>
            )}
            {platforms.slice(0, 4).map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium"
              >
                {p}
              </span>
            ))}
            {platforms.length > 4 && (
              <span className="text-xs text-gray-500">
                +{platforms.length - 4}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center pl-2 text-gray-500">
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </div>
      {expanded && (
        <div
          id={`strategy-panel-${strategy.id}`}
          className="mt-3 ml-4 pl-4 border-l border-gray-200 space-y-2"
        >
          {angles.map((a) => (
            <div
              key={a.number}
              className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/60 border border-gray-200"
            >
              <div className="w-8 h-8 rounded-md bg-brand-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {a.number}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-gray-900 truncate"
                  title={a.header}
                >
                  {a.header}
                </p>
                {(a.description || a.objective || a.tonality) && (
                  <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                    {(a.description || a.objective || a.tonality).slice(0, 140)}
                    {(a.description || a.objective || a.tonality).length > 140
                      ? "…"
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAngle(strategy, a);
                  }}
                  aria-label={`Open strategy angle ${a.number} of set ${strategy.id}`}
                >
                  View
                </Button>
                {onGenerateAngle && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!ideaAngles.includes(a.number))
                        onGenerateAngle(strategy, a);
                    }}
                    disabled={
                      ideaAngles.includes(a.number) ||
                      generatingAngleNumber !== null
                    }
                    variant={
                      ideaAngles.includes(a.number) ? "outline" : "primary"
                    }
                    aria-label={
                      ideaAngles.includes(a.number)
                        ? `Idea set already generated for angle ${a.number}`
                        : `Generate idea set for angle ${a.number}`
                    }
                  >
                    <Lightbulb className="h-4 w-4" />
                    {ideaAngles.includes(a.number)
                      ? "Idea Set Generated"
                      : generatingAngleNumber === a.number
                        ? "Generating…"
                        : "Generate Idea Set"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export default StrategyListItem;
