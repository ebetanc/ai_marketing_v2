import React, { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { Bell, Menu, Search } from 'lucide-react'
import { IconButton } from '../ui/IconButton'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useNavigate } from 'react-router-dom'

type TopBarProps = {
  onMenuClick?: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  // const { companies } = useCompanies() // reserved for future search scoping
  const { session } = useAuth()
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement | null>(null)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  // Keyboard shortcut to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'
        if (!isTyping) {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
              placeholder="Search... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search"
              ref={searchRef}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <IconButton className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center leading-none">
              3
            </span>
          </IconButton>
          {session && (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
