import React, { useEffect, useRef, useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

type TopBarProps = React.HTMLAttributes<HTMLDivElement> & {
  onMenuClick?: () => void;
  /**
   * Extra attributes for the mobile menu button (e.g. aria-controls/aria-expanded)
   * so consumers can wire accessibility without leaking them onto the header element.
   */
  menuButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
};

export function TopBar({
  onMenuClick,
  menuButtonProps,
  ...divProps
}: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<number | null>(null);
  // const { companies } = useCompanies() // reserved for future search scoping
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const notificationsCount = 0; // Hide when zero; wire real data when available

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never interfere if another handler already handled it
      if (e.defaultPrevented) return;
      // Don't steal focus from any open modal (dialog or alertdialog)
      const hasOpenModal = !!document.querySelector('[aria-modal="true"]');
      if (hasOpenModal) return;
      const isSearchShortcut =
        (e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey);
      if (isSearchShortcut) {
        const target = e.target as HTMLElement;
        const tag = target?.tagName;
        const active = document.activeElement as HTMLElement | null;
        const isEditable = (node: HTMLElement | null) =>
          !!node &&
          (node.tagName === "INPUT" ||
            node.tagName === "TEXTAREA" ||
            (node as HTMLElement).isContentEditable ||
            !!node.closest('[contenteditable="true"]'));
        const isInteractive = (node: HTMLElement | null) =>
          !!node &&
          (node.tagName === "BUTTON" ||
            node.tagName === "A" ||
            node.tagName === "SELECT" ||
            node.tagName === "INPUT" ||
            node.tagName === "TEXTAREA" ||
            !!node.getAttribute("role")?.includes("button") ||
            !!node.closest(
              'button, a, select, input, textarea, [role="button"], [tabindex]:not([tabindex="-1"])',
            ));

        const typingInTarget =
          tag === "INPUT" || tag === "TEXTAREA" || isEditable(target);
        const typingInActive = isEditable(active);
        const inInteractive = isInteractive(target) || isInteractive(active);

        if (!typingInTarget && !typingInActive && !inInteractive) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep the TopBar search in sync with the Content page's ?q param
  useEffect(() => {
    if (location.pathname.startsWith("/content")) {
      const q = new URLSearchParams(location.search).get("q") || "";
      setSearchQuery(q);
    } else {
      setSearchQuery("");
    }
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [location.pathname, location.search]);

  return (
    <header
      className="bg-white px-4 sm:px-6 h-[var(--app-header-h)] flex items-center border-b border-gray-200"
      {...divProps}
    >
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          <IconButton
            className={cn("lg:hidden", menuButtonProps?.className)}
            aria-label="Open menu"
            onClick={onMenuClick}
            {...menuButtonProps}
          >
            <Menu className="h-5 w-5" />
          </IconButton>
          <form
            role="search"
            className="relative max-w-md flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (!q) return; // don’t submit empty queries
              navigate(`/content?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search (Cmd/Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                // Debounced URL sync while typing only when on /content
                if (location.pathname.startsWith("/content")) {
                  if (debounceRef.current)
                    window.clearTimeout(debounceRef.current);
                  debounceRef.current = window.setTimeout(() => {
                    const params = new URLSearchParams(location.search);
                    if (v) params.set("q", v);
                    else params.delete("q");
                    navigate({ search: params.toString() }, { replace: true });
                  }, 250);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = searchQuery.trim();
                  if (!q) {
                    e.preventDefault();
                    return;
                  }
                  if (debounceRef.current)
                    window.clearTimeout(debounceRef.current);
                  navigate(`/content?q=${encodeURIComponent(q)}`);
                }
              }}
              aria-label="Search"
              ref={searchRef}
              className="w-full pl-10 pr-10 py-3 text-sm border-2 border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus:border-brand-500"
              style={{ minHeight: 44 }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => {
                  setSearchQuery("");
                  if (location.pathname.startsWith("/content")) {
                    const params = new URLSearchParams(location.search);
                    params.delete("q");
                    navigate({ search: params.toString() }, { replace: true });
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                style={{ width: 44, height: 44 }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <IconButton className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-h-[1.25rem] min-w-[1.25rem] px-1 bg-red-500 text-white text-base rounded-full flex items-center justify-center leading-none font-semibold shadow-sm">
                {notificationsCount}
              </span>
            )}
          </IconButton>
          {/* Sign Out button moved to Account page */}
        </div>
      </div>
    </header>
  );
}
