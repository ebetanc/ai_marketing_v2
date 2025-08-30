import { Calendar, Eye, Share2, Trash2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { IconButton } from "../ui/IconButton";
import { formatDate, truncateText } from "../../lib/utils";

interface ContentListItemProps {
  content: any;
  onView: (content: any) => void;
  onDelete: (content: any) => void;
  onCopyLink: (content: any) => Promise<void>;
}

// Approval flow removed – no status badge

const typeEmoji = (type: string) => {
  switch (type) {
    case "blog_post":
      return "📝";
    case "social_post":
      return "📱";
    case "ad_copy":
      return "📢";
    case "email":
      return "📧";
    case "generated_content":
      return "🤖";
    default:
      return "📄";
  }
};

export function ContentListItem({
  content,
  onView,
  onDelete,
  onCopyLink,
}: ContentListItemProps) {
  // Approval flow removed

  return (
    <li>
      <div
        className={`group flex items-start gap-4 rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-brand-400 hover:shadow-sm focus-within:border-brand-500 transition ${content.post ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        role={!content.post ? "button" : undefined}
        tabIndex={!content.post ? 0 : -1}
        onClick={() => !content.post && onView(content)}
        onKeyDown={(e) => {
          if (content.post) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(content);
          }
        }}
        aria-label={
          !content.post ? `View details for ${content.title}` : undefined
        }
      >
        <div className="mt-1 text-lg select-none" aria-hidden>
          {typeEmoji(content.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className="font-medium text-gray-900 truncate max-w-[22ch]"
              title={content.title}
            >
              {content.title}
            </span>
            {/* Status badge removed */}
            {content.post && (
              <Badge variant="success" className="text-xs">
                Posted
              </Badge>
            )}
            {(() => {
              const typeLabel = content.type?.replace("_", " ");
              const platformLabel = content.platform;
              if (
                platformLabel &&
                typeLabel &&
                platformLabel.toLowerCase() !== typeLabel.toLowerCase()
              ) {
                return (
                  <>
                    <Badge variant="secondary" className="text-xs">
                      {platformLabel}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabel}
                    </Badge>
                  </>
                );
              }
              return (
                <Badge variant="secondary" className="text-xs">
                  {platformLabel || typeLabel}
                </Badge>
              );
            })()}
            {content.strategy_id && (
              <Badge variant="secondary" className="text-xs">
                Strategy #{content.strategy_id}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {truncateText(content.body_text || content.body || "", 200)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(content.created_at)}
            </span>
            <span>{content.metadata?.word_count || 0} words</span>
            {content.metadata?.topic && (
              <span className="text-brand-600">
                Topic: {truncateText(content.metadata.topic, 40)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end ml-2">
          {/* Approve button removed */}
          <div className="flex gap-1">
            <IconButton
              aria-label="Copy link"
              onClick={(e) => {
                e.stopPropagation();
                void onCopyLink(content);
              }}
            >
              <Share2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label="Delete"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(content);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
            <IconButton
              aria-label="View details"
              onClick={(e) => {
                e.stopPropagation();
                onView(content);
              }}
            >
              <Eye className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>
    </li>
  );
}

export default ContentListItem;
