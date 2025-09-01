import {
  Building2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  FileText,
  Home,
  ImagePlus,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Network,
  Search,
  TrendingUp,
  UserCircle,
  Video,
  Wand2,
  Youtube,
  Zap,
} from "lucide-react";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

// Types
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface NavGroupConfig {
  id: GroupKey;
  label: string;
  items: NavItem[];
  visible: (ctx: VisibilityContext) => boolean;
}

// Navigation sections (order matters for grouped rendering)
const primaryNav: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const contentWorkflowNav: NavItem[] = [
  { name: "Companies", href: "/companies", icon: Building2 },
  { name: "Strategies", href: "/strategies", icon: Layers },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
];

// Tools (hidden for real_estate mode)
// (SEO-related links moved to separate seoNav group below)
// Ordered after SEO group for flow: research -> production
const toolsNav: NavItem[] = [
  // Image workflow
  { name: "Create AI Image", href: "/create-ai-image", icon: ImagePlus },
  { name: "Edit Image with AI", href: "/edit-image-with-ai", icon: Wand2 },
  {
    name: "Animate Image with AI",
    href: "/animate-image-with-ai",
    icon: Wand2,
  },
  // Video workflow
  { name: "Create AI Video", href: "/create-ai-video", icon: Video },
  {
    name: "Create AI Video with Avatar",
    href: "/create-video-avatar",
    icon: UserCircle,
  },
  // Campaign orchestration (placed after asset creation tools)
  { name: "Campaigns", href: "/campaigns", icon: Megaphone },
];

// SEO tools (subset previously in toolsNav)
// Research / optimization ordering: foundational keyword -> semantic graph -> trends -> transformation
const seoNav: NavItem[] = [
  { name: "Keyword Research", href: "/keyword-research", icon: Search },
  { name: "Semantic SEO", href: "/semantic-seo", icon: Network },
  { name: "Trend Blog", href: "/trend-blog", icon: TrendingUp },
  { name: "YouTube → SEO Blog", href: "/youtube-seo", icon: Youtube },
];

// Real Estate (hidden for marketing mode)
const realEstateNav: NavItem[] = [
  {
    name: "Real Estate Content",
    href: "/real-estate-content",
    icon: Home,
  },
];

// Storage keys (single source)
const STORAGE_KEYS = {
  collapsedGroups: "sidebar:collapsedGroups:v1",
  collapsed: "sidebar:collapsed:v1",
} as const;

type Role = "admin" | "marketing" | "real_estate" | null;
interface VisibilityContext {
  role: Role;
  showAll: boolean; // when no profile
}

type GroupKey = "contentWorkflow" | "tools" | "seo" | "realEstate";

const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: "contentWorkflow",
    label: "Content Workflow",
    items: contentWorkflowNav,
    visible: () => true,
  },
  {
    id: "seo",
    label: "SEO",
    items: seoNav,
    visible: ({ role, showAll }) =>
      showAll || role === "admin" || role === "marketing",
  },
  {
    id: "tools",
    label: "Tools",
    items: toolsNav,
    visible: ({ role, showAll }) =>
      showAll || role === "admin" || role === "marketing",
  },
  {
    id: "realEstate",
    label: "Real Estate",
    items: realEstateNav,
    visible: ({ role, showAll }) =>
      showAll || role === "admin" || role === "real_estate",
  },
];

export function Sidebar() {
  const location = useLocation();
  const [displayName, setDisplayName] = React.useState<string>("");
  const [userRole, setUserRole] = React.useState<Role>(null);
  const [hasProfile, setHasProfile] = React.useState<boolean | null>(null); // null = unknown/loading
  const [collapsed, setCollapsed] = React.useState<Record<GroupKey, boolean>>({
    // Default all groups to collapsed; restored user prefs will override on mount
    contentWorkflow: true,
    tools: true,
    seo: true,
    realEstate: true,
  });
  const [sidebarCollapsed, setSidebarCollapsed] =
    React.useState<boolean>(false);

  // Load collapsed state from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.collapsedGroups);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCollapsed((prev) => ({ ...prev, ...parsed }));
      }
      const globalRaw = localStorage.getItem(STORAGE_KEYS.collapsed);
      if (globalRaw === "true") setSidebarCollapsed(true);
    } catch (_e) {
      // ignore
    }
  }, []);

  // Persist collapsed changes
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.collapsedGroups,
        JSON.stringify(collapsed),
      );
    } catch (_e) {
      // ignore
    }
  }, [collapsed]);

  // Persist global sidebar collapse
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.collapsed, String(sidebarCollapsed));
    } catch (_e) {
      // ignore
    }
  }, [sidebarCollapsed]);

  const toggleGroup = (key: keyof typeof collapsed) => {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }));
  };

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);

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
            // maybeSingle() returns null (no error) when 0 rows found, avoiding 406 noise
            .maybeSingle();
          if (!mounted) return;

          // PostgREST 406 previously surfaced when using single() with 0 rows.
          // Now: profile=null means no row (or RLS filtered out). Treat as no profile.
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

  // Compute visibility context
  const role: Role = userRole || "marketing";
  const showAll = hasProfile === false;
  const visibilityCtx: VisibilityContext = React.useMemo(
    () => ({ role, showAll }),
    [role, showAll],
  );

  // Pre-compute filtered groups to avoid logic duplication
  const visibleGroups = React.useMemo(
    () => NAV_GROUPS.filter((g) => g.visible(visibilityCtx)),
    [visibilityCtx],
  );

  // Helper to render nav item (ensures accessible name when collapsed)
  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname.startsWith(item.href);
    const linkLabelId = `nav-${item.href.replace(/[^a-z0-9]+/gi, "-")}`;
    return (
      <li key={item.name} className="list-none">
        <Link
          to={item.href}
          className={cn(
            "group flex items-center px-2 sm:px-3 py-2.5 text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            sidebarCollapsed && "justify-center",
            isActive
              ? "bg-brand-50 text-brand-700 border border-brand-200"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
          )}
          aria-current={isActive ? "page" : undefined}
          aria-labelledby={linkLabelId}
        >
          <item.icon
            className={cn(
              "mr-2 sm:mr-3 h-5 w-5 transition-colors",
              sidebarCollapsed && "mr-0 sm:mr-0",
              isActive
                ? "text-brand-600"
                : "text-gray-400 group-hover:text-gray-600",
            )}
            aria-hidden
          />
          {sidebarCollapsed ? (
            <span id={linkLabelId} className="sr-only">
              {item.name}
            </span>
          ) : (
            <span id={linkLabelId} className="hidden sm:inline">
              {item.name}
            </span>
          )}
        </Link>
      </li>
    );
  };

  const renderGroup = (group: NavGroupConfig) => {
    const isCollapsed = collapsed[group.id];
    const sectionId = `section-${group.id}`;
    return (
      <div key={group.id} aria-labelledby={`${sectionId}-label`}>
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between px-2 sm:px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase hover:text-gray-700"
            aria-expanded={!isCollapsed}
            aria-controls={sectionId}
            id={`${sectionId}-label`}
          >
            <span>{group.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed ? "-rotate-90" : "rotate-0",
              )}
              aria-hidden
            />
          </button>
        )}
        {(!isCollapsed || sidebarCollapsed) && (
          <ul id={sectionId} className="space-y-1">
            {group.items.map(renderNavItem)}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col bg-white border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
      )}
      aria-label="Sidebar"
    >
      <div
        className={cn(
          "flex items-center h-[var(--app-header-h)] border-b border-gray-200 px-3 sm:px-4",
          sidebarCollapsed && "justify-center px-2 sm:px-2",
        )}
      >
        <div
          className={cn(
            "flex items-center min-w-0",
            !sidebarCollapsed && "flex-1",
          )}
        >
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 hidden sm:block truncate">
              <h1 className="text-base lg:text-2xl font-bold text-gray-900 truncate">
                Lighting
              </h1>
              <p className="text-base text-gray-500 lg:hidden">Companion</p>
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex-1 min-h-0 overflow-y-auto py-4 sm:py-6 space-y-4",
          sidebarCollapsed ? "px-1 sm:px-2" : "px-2 sm:px-4",
        )}
        aria-label="Primary"
      >
        {/* Primary */}
        <ul className="space-y-1">{primaryNav.map(renderNavItem)}</ul>

        {/* Dynamic groups */}
        {visibleGroups.map(renderGroup)}
      </nav>

      {/* Global collapse toggle moved here (above profile) */}
      <div
        className={cn(
          "px-2 sm:px-4 py-2",
          sidebarCollapsed && "flex justify-center",
        )}
      >
        {sidebarCollapsed ? (
          <IconButton
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            onClick={toggleSidebar}
            size="md"
            variant="default"
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                sidebarCollapsed ? "rotate-180" : "rotate-0",
              )}
              aria-hidden
            />
          </IconButton>
        ) : (
          <Button
            onClick={toggleSidebar}
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2 bg-white hover:bg-gray-50"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform",
                sidebarCollapsed ? "rotate-180" : "rotate-0",
              )}
              aria-hidden
            />
            <span>Collapse sidebar</span>
          </Button>
        )}
      </div>

      <div
        className={cn(
          "border-t border-gray-200 p-2 sm:p-4 transition-all",
          sidebarCollapsed && "flex justify-center",
        )}
      >
        <Link
          to="/account"
          aria-label="Open account settings"
          className={cn(
            "flex items-center rounded-xl px-2 py-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            sidebarCollapsed && "justify-center",
          )}
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-base font-medium text-gray-600">
              {displayName ? displayName.charAt(0).toUpperCase() : "U"}
            </span>
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 min-w-0 flex-1 hidden sm:block">
              <p className="text-base font-medium text-gray-900 truncate">
                {displayName || "User"}
              </p>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
