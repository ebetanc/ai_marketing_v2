import React from "react";
import { cn } from "../../lib/utils";

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * PageHeader
 * A consistent, responsive header for application pages.
 *
 * Usage:
 * <PageHeader
 *   title="Companies"
 *   description="Manage brands and profiles."
 *   icon={<SomeIcon className="h-6 w-6" />}
 *   actions={<>
 *     <Button variant="outline">Refresh</Button>
 *     <Button>Add</Button>
 *   </>}
 * />
 */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon ? (
          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 flex-shrink-0">
            {/* Icon container; icon should set its own size/color */}
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-gray-600 text-base sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default PageHeader;
