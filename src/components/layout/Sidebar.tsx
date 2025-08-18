import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
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

} from 'lucide-react'
// Navigation sections to visually group related items
const primaryNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
]

const contentWorkflowNav = [
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Strategies', href: '/strategies', icon: FileText },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Content', href: '/content', icon: FileText },
]

const toolsNav = [
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'YouTube → SEO Blog', href: '/youtube-seo', icon: Youtube },
  { name: 'Trend Blog', href: '/trend-blog', icon: TrendingUp },
  { name: 'Semantic SEO', href: '/semantic-seo', icon: Network },
  { name: 'Keyword Research', href: '/keyword-research', icon: Search },
  { name: 'Real Estate Content', href: '/real-estate-content', icon: Building2 },
]

export function Sidebar() {
  const location = useLocation()
  const [displayName, setDisplayName] = React.useState<string>('')

  React.useEffect(() => {
    // Fetch current auth user to replace demo label
    let mounted = true
    supabase.auth.getUser().then((result: { data?: { user?: any } }) => {
      if (!mounted) return
      const user = result?.data?.user
      const name = (user?.user_metadata as any)?.name || user?.email || 'User'
      setDisplayName(name)
    }).catch(() => {
      if (!mounted) return
      setDisplayName('User')
    })
    return () => { mounted = false }
  }, [])

  return (
    <div className="flex h-full w-full lg:w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex items-center px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3 hidden sm:block">
            <h1 className="text-base lg:text-lg font-semibold text-gray-900">AI Marketing</h1>
            <p className="text-xs text-gray-500">Companion</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 space-y-4">
        {/* Primary */}
        <div className="space-y-1">
          {primaryNav.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon
                  className={cn(
                    'mr-2 sm:mr-3 h-5 w-5 transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Content workflow group */}
        <div>
          <p className="px-2 sm:px-3 mb-2 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">Content workflow</p>
          <div className="space-y-1">
            {contentWorkflowNav.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={cn(
                      'mr-2 sm:mr-3 h-5 w-5 transition-colors',
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Tools */}
        <div>
          <p className="px-2 sm:px-3 mb-2 text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">Tools</p>
          <div className="space-y-1">
            {toolsNav.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-2 sm:px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon
                    className={cn(
                      'mr-2 sm:mr-3 h-5 w-5 transition-colors',
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-gray-200 p-2 sm:p-4">
        <Link
          to="/account"
          aria-label="Open account settings"
          className="flex items-center rounded-xl px-2 py-2 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="ml-3 min-w-0 flex-1 hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName || 'User'}
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
