import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { Outlet } from 'react-router-dom'
import { Modal } from '../ui/Modal'

export function Layout() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const mobileDialogId = 'mobile-sidebar-dialog'

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:shadow focus:border focus:border-gray-200"
      >
        Skip to content
      </a>
      {/* Full-width divider aligning Sidebar header and TopBar bottom edge */}
      <div
        aria-hidden
        className="hidden lg:block pointer-events-none absolute left-0 right-0 top-[var(--app-header-h)] h-px bg-gray-200 z-10"
      />
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
        <h2 id="mobile-nav-title" className="sr-only">Mobile navigation</h2>
        <Sidebar />
      </Modal>

      <div className="flex-1 flex flex-col min-h-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          menuButtonProps={{
            'aria-controls': mobileDialogId,
            'aria-expanded': mobileOpen,
          }}
        />
        <main id="main-content" role="main" aria-label="Main content" className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
