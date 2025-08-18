import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Bell, Menu, Search, X } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useLocation, useNavigate } from 'react-router-dom'

type TopBarProps = {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  // const { companies } = useCompanies() // reserved for future search scoping
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const searchRef = useRef<HTMLInputElement | null>(null)
  const notificationsCount = 0 // Hide when zero; wire real data when available

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (_e) {
      // no-op: navigate away regardless
    } finally {
      navigate('/login', { replace: true })
    }
  }

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never interfere if another handler already handled it
      if (e.defaultPrevented) return
      // Don't steal focus from any open modal (dialog or alertdialog)
      const hasOpenModal = !!document.querySelector('[aria-modal="true"]')
      if (hasOpenModal) return
      const isSearchShortcut = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)
      if (isSearchShortcut) {
        const target = e.target as HTMLElement
        const tag = target?.tagName
        const active = document.activeElement as HTMLElement | null
        const isEditable = (node: HTMLElement | null) => !!node && (
          node.tagName === 'INPUT' ||
          node.tagName === 'TEXTAREA' ||
          (node as HTMLElement).isContentEditable ||
          !!node.closest('[contenteditable="true"]')
        )
        const isInteractive = (node: HTMLElement | null) => !!node && (
          node.tagName === 'BUTTON' ||
          node.tagName === 'A' ||
          node.tagName === 'SELECT' ||
          node.tagName === 'INPUT' ||
          node.tagName === 'TEXTAREA' ||
          !!node.getAttribute('role')?.includes('button') ||
          !!node.closest('button, a, select, input, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')
        )

        const typingInTarget = tag === 'INPUT' || tag === 'TEXTAREA' || isEditable(target)
        const typingInActive = isEditable(active)
        const inInteractive = isInteractive(target) || isInteractive(active)

        if (!typingInTarget && !typingInActive && !inInteractive) {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Keep the TopBar search in sync with the Content page's ?q param
  useEffect(() => {
    if (location.pathname.startsWith('/content')) {
      const q = new URLSearchParams(location.search).get('q') || ''
      setSearchQuery(q)
    } else {
      setSearchQuery('')
    }
  }, [location.pathname, location.search])

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          <IconButton
            className="lg:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </IconButton>
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search (Cmd/Ctrl+K)"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value
                setSearchQuery(v)
                // Live-sync the Content page search via the URL when on /content
                if (location.pathname.startsWith('/content')) {
                  const params = new URLSearchParams(location.search)
                  if (v) params.set('q', v); else params.delete('q')
                  navigate({ search: params.toString() }, { replace: true })
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = searchQuery.trim()
                  navigate(q ? `/content?q=${encodeURIComponent(q)}` : '/content')
                }
              }}
              aria-label="Search"
              ref={searchRef}
              className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => {
                  setSearchQuery('')
                  if (location.pathname.startsWith('/content')) {
                    const params = new URLSearchParams(location.search)
                    params.delete('q')
                    navigate({ search: params.toString() }, { replace: true })
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <IconButton className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center leading-none">
                {notificationsCount}
              </span>
            )}
          </IconButton>
          {session && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
