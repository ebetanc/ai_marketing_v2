import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AuthProvider, ProtectedLayout } from './lib/auth'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Companies } from './pages/Companies'
import { Strategies } from './pages/Strategies'
import { Ideas } from './pages/Ideas'
import { Content } from './pages/Content'
import { Campaigns } from './pages/Campaigns'
import { YouTubeSEO } from './pages/YouTubeSEO'
import { TrendBlog } from './pages/TrendBlog'
import { SemanticSEO } from './pages/SemanticSEO'
import { KeywordResearch } from './pages/KeywordResearch'
import { RealEstateContent } from './pages/RealEstateContent'
import { ToastProvider } from './components/ui/Toast'
import { Account } from './pages/Account'

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedLayout />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/strategies" element={<Strategies />} />
                <Route path="/ideas" element={<Ideas />} />
                <Route path="/content" element={<Content />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/youtube-seo" element={<YouTubeSEO />} />
                <Route path="/trend-blog" element={<TrendBlog />} />
                <Route path="/semantic-seo" element={<SemanticSEO />} />
                <Route path="/keyword-research" element={<KeywordResearch />} />
                <Route path="/real-estate-content" element={<RealEstateContent />} />
                <Route path="/account" element={<Account />} />
                <Route path="/" element={<RootRedirector />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  )
}

function RootRedirector() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const redirectTo = params.get('redirectTo')
  if (redirectTo) {
    return <Navigate to={redirectTo} replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default App
