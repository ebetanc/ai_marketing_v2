import { Calendar, Eye, Building2, Target, FileText } from "lucide-react";
import { Button } from "../ui/Button";
import { formatDate, truncateText } from "../../lib/utils";

interface BrandListItemProps {
  brand: any;
  onView: (brand: any) => void;
}

export function BrandListItem({ brand, onView }: BrandListItemProps) {
  const name = brand.brand_name || brand.name || "Unnamed";
  return (
    <li>
      <div
        className="group relative flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-brand-400 hover:shadow transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
        role="button"
        tabIndex={0}
        onClick={() => onView(brand)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView(brand);
          }
        }}
        aria-label={`View brand ${name}`}
      >
        <div className="w-12 h-12 bg-brand-600/10 ring-1 ring-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="h-6 w-6 text-brand-700" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <span
              className="font-medium text-gray-900 truncate max-w-[28ch]"
              title={name}
            >
              {name}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
              <Calendar className="h-3 w-3" /> {formatDate(brand.created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {brand.brand_tone
              ? truncateText(brand.brand_tone, 140)
              : "No brand description available"}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {brand.target_audience && (
              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                <Target className="h-3 w-3 text-gray-500" /> Audience
              </span>
            )}
            {(brand.key_offer || brand.brand_voice?.style) && (
              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                <Building2 className="h-3 w-3 text-gray-500" /> Offer
              </span>
            )}
            {brand.additional_information && (
              <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                <FileText className="h-3 w-3 text-gray-500" /> Info
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center pl-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView(brand);
            }}
            aria-label={`Open brand ${name}`}
            className="transition-opacity"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">View</span>
          </Button>
        </div>
      </div>
    </li>
  );
}

export default BrandListItem;
