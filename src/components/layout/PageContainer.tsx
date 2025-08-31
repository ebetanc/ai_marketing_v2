import React from "react";
import { cn } from "../../lib/utils";

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Remove the default vertical stacking gap (space-y-6)
   */
  noGap?: boolean;
  /**
   * (Deprecated) Previously opt‑in centering. Now centering + max width is default.
   * Kept for backward compatibility; has no effect.
   */
  centered?: boolean;
  /**
   * If true, removes default padding constraints (for full-bleed sections inside the Layout main padding).
   */
  fullBleed?: boolean;
  /**
   * If true, disables the default max-width constraint (content becomes full width of parent).
   */
  fluid?: boolean;
  /**
   * Override the default max-width utility class (e.g. "max-w-5xl"). Ignored if fluid.
   */
  maxWidth?: string;
}

/**
 * PageContainer
 * A shared wrapper for top-level page content inside the application Layout.
 * Replaces repetitive <div className="space-y-6"> declarations across pages
 * and provides a single place to evolve spacing / responsive width rules.
 */
export const PageContainer = React.forwardRef<
  HTMLDivElement,
  PageContainerProps
>(
  (
    {
      children,
      className,
      noGap = false,
      centered: _centeredDeprecated, // unused
      fullBleed = false,
      fluid = false,
      maxWidth,
      ...rest
    },
    ref,
  ) => {
    const widthClass = fullBleed
      ? "" // fullBleed handles its own layout with negative margins
      : fluid
        ? "w-full"
        : `mx-auto w-full ${maxWidth || "max-w-7xl"}`; // sensible default constraint

    return (
      <div
        ref={ref}
        className={cn(
          widthClass,
          !noGap && "space-y-6",
          fullBleed && "-mx-4 sm:-mx-6 px-4 sm:px-6",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
PageContainer.displayName = "PageContainer";

export default PageContainer;
