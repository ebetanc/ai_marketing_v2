import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Bell, Plus, Search } from 'lucide-react'
import { useCompanies } from '../../hooks/useCompanies'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'

export function TopBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const { companies } = useCompanies()
  const { session } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
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
