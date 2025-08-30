import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useLocation, useOutlet } from "react-router-dom";
import { Modal } from "../ui/Modal";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "framer-motion";

export function Layout() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const mobileDialogId = "mobile-sidebar-dialog";
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const mainRef = React.useRef<HTMLDivElement>(null);
  const outlet = useOutlet();
  const [displayOutlet, setDisplayOutlet] =
    React.useState<React.ReactNode>(outlet);
  const [displayKey, setDisplayKey] = React.useState(location.key);
  const [pendingOutlet, setPendingOutlet] =
    React.useState<React.ReactNode | null>(null);
  const [pendingKey, setPendingKey] = React.useState<string | null>(null);
  const [isExiting, setIsExiting] = React.useState(false);

  // Scroll the main content to top on route change
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  // Queue the new outlet and trigger exit when the route changes
  React.useEffect(() => {
    if (location.key !== displayKey && !isExiting) {
      setPendingOutlet(outlet);
      setPendingKey(location.key);
      setIsExiting(true);
    }
  }, [location.key, displayKey, outlet, isExiting]);

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:shadow focus:border focus:border-gray-200"
      >
        Skip to content
      </a>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Off-canvas mobile sidebar (accessible) */}
      <Modal
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        labelledById="mobile-nav-title"
        id={mobileDialogId}
        backdropClassName="fixed inset-0 bg-black/50 z-50 lg:hidden flex items-stretch justify-start"
        className="relative h-full w-72 max-w-[80%] bg-white border-r border-gray-200 shadow-xl outline-none"
      >
        {/* Hidden accessible title for the dialog */}
        <h2 id="mobile-nav-title" className="sr-only">
          Mobile navigation
        </h2>
        <Sidebar />
      </Modal>

      <div className="flex-1 flex flex-col min-h-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          menuButtonProps={{
            "aria-controls": mobileDialogId,
            "aria-expanded": mobileOpen,
          }}
        />
        <main
          id="main-content"
          role="main"
          aria-label="Main content"
          className="flex-1 overflow-auto p-4 sm:p-6"
          ref={mainRef}
        >
          <MotionConfig reducedMotion="user">
            <div style={{ position: "relative" }}>
              <AnimatePresence
                mode="wait"
                initial={false}
                onExitComplete={() => {
                  if (pendingOutlet) setDisplayOutlet(pendingOutlet);
                  if (pendingKey) setDisplayKey(pendingKey);
                  setPendingOutlet(null);
                  setPendingKey(null);
                  setIsExiting(false);
                }}
              >
                {!isExiting && displayOutlet && (
                  <motion.div
                    key={displayKey}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 12 }
                    }
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 1, y: 0 }
                    }
                    exit={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: -12 }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.15, ease: "easeOut" }
                    }
                    style={{ position: "absolute", inset: 0, width: "100%" }}
                  >
                    {displayOutlet}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </MotionConfig>
        </main>
      </div>
    </div>
  );
}
