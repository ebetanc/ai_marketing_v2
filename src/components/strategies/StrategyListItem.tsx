import { Calendar, Eye, FileText, Target } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatDate } from "../../lib/utils";

interface StrategyListItemProps {
  strategy: any;
  angleCount: number;
  platforms: string[];
  onView: (strategy: any) => void;
}

export function StrategyListItem({
  strategy,
  angleCount,
  platforms,
  onView,
}: StrategyListItemProps) {
  return (
    <li>
      <div
        className="group flex items-start gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-brand-400 hover:shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
        role="button"
        tabIndex={0}
        onClick={() => onView(strategy)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(strategy);
          }
        }}
        aria-label={`View strategy ${strategy.id}`}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              Strategy #{strategy.id}
            </span>
            {angleCount > 0 && (
              <Badge variant="success">{angleCount} Angles</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-base text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(strategy.created_at)}
            </span>
            {platforms.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Target className="h-3 w-3" /> {platforms.join(", ")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(strategy);
            }}
            aria-label={`Open strategy ${strategy.id}`}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>
    </li>
  );
}

export default StrategyListItem;
