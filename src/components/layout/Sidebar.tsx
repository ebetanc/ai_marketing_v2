import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Lightbulb,
  Megaphone,
  Zap,
  Youtube,
  TrendingUp,
  Network,
  Search,
} from "lucide-react";

// Navigation sections (order matters for grouped rendering)
const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const contentWorkflowNav = [
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Strategies", href: "/strategies", icon: FileText },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Content", href: "/content", icon: FileText },
];

// Tools (hidden for real_estate mode)
const toolsNav = [
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
  { name: "YouTube → SEO Blog", href: "/youtube-seo", icon: Youtube },
  { name: "Trend Blog", href: "/trend-blog", icon: TrendingUp },
  { name: "Semantic SEO", href: "/semantic-seo", icon: Network },
  { name: "Keyword Research", href: "/keyword-research", icon: Search },
];

// Real Estate (hidden for marketing mode)
const realEstateNav = [
  {
    name: "Real Estate Content",
    href: "/real-estate-content",
    icon: Building2,
  },
];

export function Sidebar() {
  const location = useLocation();
  const [displayName, setDisplayName] = React.useState<string>("");
  const [userRole, setUserRole] = React.useState<
    "admin" | "marketing" | "real_estate" | null
  >(null);
  const [hasProfile, setHasProfile] = React.useState<boolean | null>(null); // null = unknown/loading

  React.useEffect(() => {
    // Fetch current auth user to replace demo label
    let mounted = true;
    (async () => {
      try {
        const result = await supabase.auth.getUser();
        if (!mounted) return;
        const user = result?.data?.user;
        const name =
          (user?.user_metadata as any)?.name || user?.email || "User";
        setDisplayName(name);

        if (user) {
          // Attempt to load profile row. If none exists, we'll show all nav groups.
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (!mounted) return;

          if (profile && !profileError) {
            setHasProfile(true);
            const dbRole = profile.role as string | undefined;
            if (
              dbRole === "admin" ||
              dbRole === "marketing" ||
              dbRole === "real_estate"
            ) {
              setUserRole(dbRole);
            } else {
              // Fallback if role is something else (e.g., call_center/user) -> keep prior behavior defaulting to marketing
              setUserRole("marketing");
            }
          } else {
            // No profile row found (or not accessible) -> treat as "no profile attached" scenario
            setHasProfile(false);
            setUserRole(null); // We'll override visibility logic when hasProfile === false
          }
        } else {
          setHasProfile(false);
          setUserRole(null);
        }
      } catch (_e) {
        if (!mounted) return;
        setDisplayName("User");
        setHasProfile(false);
        setUserRole(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute visibility:
  // If the user has NO profile (hasProfile === false) we show ALL nav groups.
  // Otherwise we respect role-based visibility (admin sees everything, marketing hides real estate, real_estate hides tools).
  const role = userRole || "marketing";
  const showAll = hasProfile === false;
  const showTools = showAll || role === "admin" || role === "marketing";
  const showRealEstate = showAll || role === "admin" || role === "real_estate";

  return (
    <div className="flex w-full lg:w-64 flex-col bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen">
      <div className="flex items-center px-4 sm:px-6 h-[var(--app-header-h)] border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3 hidden sm:block">
            <h1 className="text-base lg:text-lg font-semibold text-gray-900">
              AI Marketing
            </h1>
            <p className="text-xs text-gray-500 lg:hidden">Companion</p>
          </div>
        </div>
      </div>

      <nav
        className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-4 sm:py-6 space-y-4"
        aria-label="Primary"
      >
        {/* Primary */}
        <div className="space-y-1">
          {primaryNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  isActive
                    ? "bg-brand-50 text-brand-700 border border-brand-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={cn(
                    "mr-2 sm:mr-3 h-5 w-5 transition-colors",
                    isActive
                      ? "text-brand-600"
                      : "text-gray-400 group-hover:text-gray-600",
                  )}
                  aria-hidden
                />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Content workflow group */}
        <div>
          <p className="px-2 sm:px-3 mb-2 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Content workflow
          </p>
          <div className="space-y-1">
            {contentWorkflowNav.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                    isActive
                      ? "bg-brand-50 text-brand-700 border border-brand-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon
                    className={cn(
                      "mr-2 sm:mr-3 h-5 w-5 transition-colors",
                      isActive
                        ? "text-brand-600"
                        : "text-gray-400 group-hover:text-gray-600",
                    )}
                    aria-hidden
                  />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tools (marketing & admin) */}
        {showTools && (
          <div>
            <p className="px-2 sm:px-3 mb-2 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Tools
            </p>
            <div className="space-y-1">
              {toolsNav.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      isActive
                        ? "bg-brand-50 text-brand-700 border border-brand-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 sm:mr-3 h-5 w-5 transition-colors",
                        isActive
                          ? "text-brand-600"
                          : "text-gray-400 group-hover:text-gray-600",
                      )}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Real Estate (real_estate & admin) */}
        {showRealEstate && (
          <div>
            <p className="px-2 sm:px-3 mb-2 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Real Estate
            </p>
            <div className="space-y-1">
              {realEstateNav.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                      isActive
                        ? "bg-brand-50 text-brand-700 border border-brand-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "mr-2 sm:mr-3 h-5 w-5 transition-colors",
                        isActive
                          ? "text-brand-600"
                          : "text-gray-400 group-hover:text-gray-600",
                      )}
                      aria-hidden
                    />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-2 sm:p-4">
        <Link
          to="/account"
          aria-label="Open account settings"
          className="flex items-center rounded-xl px-2 py-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          <div className="ml-3 min-w-0 flex-1 hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName || "User"}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
