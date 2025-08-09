import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Lightbulb,
  Megaphone, 
  BarChart3, 
  Settings,
  Zap,
  Youtube,
  TrendingUp,
  Network,
  Search
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Companies', href: '/companies', icon: Building2 },
  { name: 'Strategies', href: '/strategies', icon: FileText },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Content', href: '/content', icon: FileText },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'YouTube Transcript → SEO Blog', href: '/youtube-seo', icon: Youtube },
  { name: 'Trend Based Blog Generation', href: '/trend-blog', icon: TrendingUp },
  { name: 'Semantic Cluster → SEO Article', href: '/semantic-seo', icon: Network },
  { name: 'Keyword Research Agent', href: '/keyword-research', icon: Search },
]

export function Sidebar() {
  const location = useLocation()

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

      <nav className="flex-1 px-2 sm:px-4 py-4 sm:py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
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
      </nav>

      <div className="border-t border-gray-200 p-2 sm:p-4">
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              D
            </span>
          </div>
          <div className="ml-3 min-w-0 flex-1 hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate">
              Demo User
            </p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}