import { Calendar, Eye, Lightbulb, Target, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { formatDate } from "../../lib/utils";
import { IconButton } from "../ui/IconButton";

interface IdeaSetListItemProps {
  idea: any;
  topics: {
    number: number;
    topic: string;
    description: string;
    image_prompt: string;
  }[];
  onView: (idea: any) => void;
  onDelete?: (idea: any) => void;
}

export function IdeaSetListItem({
  idea,
  topics,
  onView,
  onDelete,
}: IdeaSetListItemProps) {
  return (
    <li>
      <div
        className="group flex items-start gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-brand-400 hover:shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
        role="button"
        tabIndex={0}
        onClick={() => onView(idea)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(idea);
          }
        }}
        aria-label={`View idea set ${idea.id}`}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Lightbulb className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              Idea set #{idea.id}
            </span>
            {topics.length > 0 && (
              <Badge variant="success">{topics.length} Topics</Badge>
            )}
            {idea.strategy_id && (
              <Badge variant="secondary">Strategy #{idea.strategy_id}</Badge>
            )}
            {idea.angle_number && (
              <Badge variant="secondary">Angle {idea.angle_number}</Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(idea.created_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" /> {topics.length} content topics
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <IconButton
              aria-label="Delete idea set"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(idea);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(idea);
            }}
            aria-label={`Open idea set ${idea.id}`}
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        </div>
      </div>
    </li>
  );
}

export default IdeaSetListItem;
