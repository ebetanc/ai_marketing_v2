import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
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

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App