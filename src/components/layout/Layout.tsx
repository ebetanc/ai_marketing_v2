import React from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <div className="lg:hidden">
        <Sidebar />
      </div>
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
