import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { supabase, type Tables } from '../lib/supabase'
import { FileText, Eye, CheckCircle, Clock, Search, Trash2, RefreshCw, Calendar, HelpCircle, Share2 } from 'lucide-react'
import { IconButton } from '../components/ui/IconButton'
import { formatDate, truncateText } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useLocation, useNavigate } from 'react-router-dom'
// (reserved) formatting helpers for future rich rendering of content bodies
// Helper function to extract and format content from JSON (reserved)
const _extractContentBody = (content: any) => {
  // Try to parse the body if it's JSON
  let parsedContent = null
  try {
    if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
      parsedContent = JSON.parse(content.body)
    }
  } catch (_e) {
    // If parsing fails, use the raw body
  }

  // Extract meaningful content from parsed JSON
  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstContent = parsedContent[0]
      if (firstContent.content) {
        // Clean up the content by removing extra quotes and formatting
        return firstContent.content.replace(/^["']|["']$/g, '').trim()
      }
      if (firstContent.body) {
        return firstContent.body.replace(/^["']|["']$/g, '').trim()
      }
      if (firstContent.description) {
        return firstContent.description.replace(/^["']|["']$/g, '').trim()
      }
      // If it's an array of content, try to extract a meaningful summary
      if (typeof firstContent === 'string') {
        return firstContent.replace(/^["']|["']$/g, '').trim()
      }
    }

    if (parsedContent.content) {
      return parsedContent.content.replace(/^["']|["']$/g, '').trim()
    }

    if (parsedContent.body) {
      return parsedContent.body.replace(/^["']|["']$/g, '').trim()
    }

    if (parsedContent.description) {
      return parsedContent.description.replace(/^["']|["']$/g, '').trim()
    }
  }

  // Fallback to original body or a default message
  const fallbackContent = content.body || 'AI-generated content ready for review and publishing.'

  // If it's still JSON-like, try to clean it up
  // Try to extract readable content from JSON strings
  const cleanContent = fallbackContent
    .replace(/^\[|\]$/g, '') // Remove array brackets
    .replace(/^\{|\}$/g, '') // Remove object brackets
    .replace(/"[^"]*":\s*/g, '') // Remove JSON keys
    .replace(/[{}[\]"]/g, '') // Remove remaining JSON characters
    .replace(/,\s*/g, '. ') // Replace commas with periods
    .replace(/\.\s*\./g, '.') // Remove double periods
    .trim()

  return cleanContent || 'AI-generated content ready for review and publishing.'
}

// Helper function to extract content type/topic
const extractContentTopic = (content: any) => {
  let parsedContent = null
  try {
    if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
      parsedContent = JSON.parse(content.body)
    }
  } catch (_e) {
    // If parsing fails, return null
  }

  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstContent = parsedContent[0]
      if (firstContent.topic) {
        return firstContent.topic
      }
      if (firstContent.title) {
        return firstContent.title
      }
      if (firstContent.subject) {
        return firstContent.subject
      }
    }

    if (parsedContent.topic) {
      return parsedContent.topic
    }

    if (parsedContent.title) {
      return parsedContent.title
    }
  }

  return null
}

export function Content() {
  useDocumentTitle('Content — AI Marketing')
  const location = useLocation()
  const navigate = useNavigate()
  const initialQ = new URLSearchParams(location.search).get('q') || ''
  // Typed helpers for joined rows
  type CompanyRow = Tables<'companies'>
  type StrategyRow = Tables<'strategies'>
  type IdeaRow = Tables<'ideas'>
  type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow }
  type ContentRow = Tables<'content'> & { idea?: IdeaJoined; company?: CompanyRow; strategy?: StrategyRow } & {
    // derived fields compatibility
    brand_name?: string
    company_id?: number
    brand_id?: number
    strategy_id?: number
    title?: string
    body?: string
    status?: string
    post?: boolean | null
  }
  // Legacy types removed; unified content only
  const [companies, setCompanies] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [_loadingCompanies, setLoadingCompanies] = useState(true) // reserved for future brand context
  const [loadingContent, setLoadingContent] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const paramsAtInit = new URLSearchParams(location.search)
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>((paramsAtInit.get('status') as any) || 'all')
  const [filterType, setFilterType] = useState<'all' | string>(paramsAtInit.get('type') || 'all')
  const [brandFilter, setBrandFilter] = useState<string>(paramsAtInit.get('brand') || '')
  const [searchQuery, setSearchQuery] = useState(initialQ)
  const [viewContentModal, setViewContentModal] = useState<{ isOpen: boolean; content: any; strategyId: any }>({
    isOpen: false,
    content: null,
    strategyId: undefined
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    content: any
    loading: boolean
  }>({
    isOpen: false,
    content: null,
    loading: false
  })
  const { push } = useToast()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const lastFocusRef = useRef<HTMLElement | null>(null)

  // While viewing a specific content item, reflect it in the document title
  useEffect(() => {
    if (!viewContentModal.isOpen || !viewContentModal.content?.title) return
    const prev = document.title
    document.title = `${viewContentModal.content.title} — Content — AI Marketing`
    return () => { document.title = prev }
  }, [viewContentModal.isOpen, viewContentModal.content?.title])

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true)
      console.log('Fetching companies from Supabase...')

      const { data: userRes } = await supabase.auth.getUser()
      const userId = userRes.user?.id
      let q = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      if (userId) q = q.eq('owner_id', userId)
      const { data, error } = await q

      if (error) {
        console.error('Error fetching companies:', error)
        throw error
      }

      console.log('Companies fetched successfully:', data?.length || 0, 'records')
      setCompanies(data || [])
    } catch (_error) {
      console.error('Error fetching companies:', _error)
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  const fetchContent = useCallback(async () => {
    try {
      setLoadingContent(true)
      setLoading(true)
      console.log('Fetching content from Supabase tables...')

      // Unified table only
      const unifiedRes = await supabase
        .from('content')
        .select(`*, idea:ideas(*, company:companies(*), strategy:strategies(*))`)
        .order('created_at', { ascending: false })

      const platformLabel = (p: string) =>
        p === 'twitter' ? 'Twitter' :
          p === 'linkedin' ? 'LinkedIn' :
            p === 'newsletter' ? 'Newsletter' :
              p === 'facebook' ? 'Facebook' :
                p === 'instagram' ? 'Instagram' :
                  p === 'youtube' ? 'YouTube' :
                    p === 'tiktok' ? 'TikTok' :
                      p === 'blog' ? 'Blog' : p

      if (unifiedRes.data && !unifiedRes.error) {
        const rows = unifiedRes.data as ContentRow[]
        const mapped = rows.map((item) => ({
          ...item,
          source: 'content' as const,
          platform: platformLabel((item as any).platform),
          type: (item as any).platform === 'newsletter' ? 'email' : 'social_post',
          title: (item as any).title || truncateText(item.content_body, 60),
          status: item.status || 'draft',
          post: item.post || false,
          company_id: item.idea?.company_id ?? item.company_id ?? item.brand_id,
          strategy_id: item.idea?.strategy_id ?? item.strategy_id,
          brand_name: item.idea?.company?.brand_name || item.company?.brand_name || item.brand_name || 'Unknown Brand',
          body: item.content_body || (item as any).body || 'No content available',
          body_text: item.content_body || (item as any).body || 'No content available'
        }))

        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setGeneratedContent(mapped)
        console.log('Unified content processed:', mapped.length, 'items')
      } else {
        throw new Error(unifiedRes.error?.message || 'Failed to fetch content')
      }

    } catch (error) {
      console.error('Error fetching content from Supabase:', error)
      setGeneratedContent([])
      setError(error instanceof Error ? error.message : 'Failed to fetch content')
    } finally {
      setLoadingContent(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
    fetchContent()
  }, [fetchCompanies, fetchContent])

  // Keep local search/filters in sync with the URL when navigating via history or external actions
  useEffect(() => {
    const url = new URLSearchParams(location.search)
    const q = url.get('q') || ''
    const status = (url.get('status') as 'all' | 'draft' | 'approved' | null) || 'all'
    const type = url.get('type') || 'all'
    const brand = url.get('brand') || ''

    setSearchQuery(prev => (prev === q ? prev : q))
    setFilterStatus(prev => (prev === status ? prev : status))
    setFilterType(prev => (prev === type ? prev : type))
    setBrandFilter(prev => (prev === brand ? prev : brand))
  }, [location.search])

  // If the modal is open and the underlying list item updates (e.g., approved/posted),
  // keep the modal's content object in sync so UI reflects the latest status.
  useEffect(() => {
    if (!viewContentModal.isOpen || !viewContentModal.content) return
    const currentId = viewContentModal.content.id
    const latest = generatedContent.find((c: any) => c.id === currentId)
    if (latest) {
      setViewContentModal(prev => ({ ...prev, content: { ...prev.content, ...latest } }))
    }
  }, [generatedContent, viewContentModal.isOpen, viewContentModal.content])

  // Global '/' shortcut is handled in TopBar; avoid duplicating here to prevent focus conflicts

  // Auto-open deep-linked content modal when `?open=source:id` is present
  const lastOpenRef = useRef<string | null>(null)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const open = params.get('open')
      if (!open) {
        lastOpenRef.current = null
        return
      }
      if (viewContentModal.isOpen) return
      if (lastOpenRef.current === open) return

      const [source, idStr] = open.split(':')
      if (!source || !idStr) return
      // Find the content item once data is loaded
      const match = generatedContent.find((c: any) => String(c.id) === idStr && (c.source === source))
      if (match) {
        lastOpenRef.current = open
        // Inline open logic to avoid ordering/deps issues
        const newParams = new URLSearchParams(location.search)
        const resolvedSource = 'content'
        newParams.set('open', `${resolvedSource}:${match.id}`)
        // Normalize the URL if needed but avoid adding to history from auto-open
        navigate({ search: newParams.toString() }, { replace: true })
        setViewContentModal({
          isOpen: true,
          content: match,
          strategyId: match.strategy_id || match.idea?.strategy_id || match.metadata?.parent_strategy_id
        })
      } else if (!loading && !loadingContent) {
        // If we've loaded data and still didn't find the item, clean up the URL and notify
        const cleanupParams = new URLSearchParams(location.search)
        cleanupParams.delete('open')
        navigate({ search: cleanupParams.toString() }, { replace: true })
        push({ title: 'Link not found', message: 'The linked content is unavailable.', variant: 'warning' })
      }
    } catch (_e) {
      // noop – if parsing fails, just ignore
    }
  }, [generatedContent, location.search, viewContentModal.isOpen, navigate, loading, loadingContent, push])

  // const refreshContent = async () => {
  //   await fetchContent()
  // }

  const handleDeleteClick = (content: any) => {
    setDeleteDialog({
      isOpen: true,
      content,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.content) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      console.log(`Attempting to delete content from ${deleteDialog.content.source}`)
      console.log('Content to delete:', deleteDialog.content)

      const { error } = await supabase
        .from(deleteDialog.content.source)
        .delete()
        .eq('id', deleteDialog.content.id)

      if (error) {
        console.error('Supabase delete error:', error)
        push({ title: 'Delete failed', message: `Failed to delete content: ${error.message}`, variant: 'error' })
        return
      }

      console.log('Content deleted successfully from Supabase')

      // Update local state
      setGeneratedContent(prev => prev.filter(content => content.id !== deleteDialog.content.id))

      // Close dialog
      setDeleteDialog({ isOpen: false, content: null, loading: false })

      console.log('Content deleted successfully and UI updated')
      push({ title: 'Deleted', message: 'Content removed', variant: 'success' })
    } catch (_error) {
      console.error('Error deleting content:', error)
      push({ title: 'Delete failed', message: 'Please try again', variant: 'error' })
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false })
  }

  const allContent = generatedContent.map(content => ({
    ...content,
    company_id: content.company_id ?? content.idea?.company_id ?? content.brand_id,
    strategy_id: content.strategy_id ?? content.idea?.strategy_id,
    brand_name: content.brand_name || content.idea?.company?.brand_name || content.company?.brand_name || 'Unknown Brand'
  }))

  const filteredContent = allContent.filter(content => {
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    const matchesType = filterType === 'all' || content.type === filterType
    const matchesBrand = !brandFilter || String(content.company_id) === brandFilter
    const matchesSearch = !searchQuery ||
      (content.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.body || '').toLowerCase().includes(searchQuery.toLowerCase())

    return matchesStatus && matchesType && matchesBrand && matchesSearch
  })

  const handleViewContent = useCallback((content: any) => {
    console.log('Opening content modal for:', content)
    console.log('Content has strategy_id (from idea or legacy column):', content.strategy_id)
    // Remember the current focused element to restore after closing
    lastFocusRef.current = (document.activeElement as HTMLElement) || null
    // Update URL with deep link
    const params = new URLSearchParams(location.search)
    const source = 'content'
    params.set('open', `${source}:${content.id}`)
    // Push a history entry so Back closes the modal and returns to prior state
    navigate({ search: params.toString() }, { replace: false })
    setViewContentModal({
      isOpen: true,
      content,
      strategyId: content.strategy_id || content.idea?.strategy_id || content.metadata?.parent_strategy_id // Prefer idea.strategy_id post-3NF
    })
  }, [navigate, location.search])

  const handleCloseViewModal = () => {
    // Remove deep link from URL
    const params = new URLSearchParams(location.search)
    params.delete('open')
    navigate({ search: params.toString() }, { replace: true })
    setViewContentModal({ isOpen: false, content: null, strategyId: undefined })
    // Restore focus to the previously focused item
    setTimeout(() => {
      lastFocusRef.current?.focus()
      lastFocusRef.current = null
    }, 0)
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Approved' }
  ]

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'generated_content', label: 'Generated Content' },
    { value: 'blog_post', label: 'Blog Post' },
    { value: 'social_post', label: 'Social Post' },
    { value: 'ad_copy', label: 'Ad Copy' },
    { value: 'email', label: 'Email' }
  ]

  const brandOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map(company => ({
      value: String(company.id),
      label: company.brand_name || company.name || 'Unnamed Company'
    }))
  ]

  const getStatusBadge = (status: string) => {
    return status === 'approved' ? (
      <Badge variant="success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    ) : (
      <Badge variant="warning">
        <Clock className="h-3 w-3 mr-1" />
        Draft
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return '📝'
      case 'social_post': return '📱'
      case 'ad_copy': return '📢'
      case 'email': return '📧'
      case 'generated_content': return '🤖'
      default: return '📄'
    }
  }

  const handleCopyLink = async (content: any) => {
    const params = new URLSearchParams(location.search)
    const source = 'content'
    params.set('open', `${source}:${content.id}`)
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
    const url = `${siteUrl}/content?${params.toString()}`
    try {
      await navigator.clipboard.writeText(url)
      push({ message: 'Link copied', variant: 'success' })
    } catch (_e) {
      push({ message: 'Copy failed. Please try again.', variant: 'error' })
    }
  }

  const isFiltersActive = (
    (searchQuery && searchQuery.length > 0) ||
    (filterStatus && filterStatus !== 'all') ||
    (filterType && filterType !== 'all') ||
    (brandFilter && brandFilter !== '')
  )

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterType('all')
    setBrandFilter('')
    const params = new URLSearchParams(location.search)
    params.delete('q')
    params.delete('status')
    params.delete('type')
    params.delete('brand')
    navigate({ search: params.toString() }, { replace: true })
    // Refocus the search box for quick typing
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content</h1>
          <p className="mt-2 text-gray-600">Review and manage generated content.</p>
        </div>
        <Button onClick={fetchContent} loading={loadingContent} disabled={loadingContent}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <ViewContentModal
        isOpen={viewContentModal.isOpen}
        onClose={handleCloseViewModal}
        content={viewContentModal.content}
        strategyId={viewContentModal.strategyId}
        onPosted={(updated) => {
          setGeneratedContent(prev => prev.map(c => c.id === updated.id ? { ...c, post: true } : c))
        }}
        onApproved={(updated) => {
          setGeneratedContent(prev => prev.map(c => c.id === updated.id ? { ...c, status: 'approved' } : c))
          // Also reflect inside the open modal immediately
          setViewContentModal(prev => prev.isOpen && prev.content?.id === updated.id
            ? { ...prev, content: { ...prev.content, status: 'approved' } }
            : prev
          )
        }}
        deepLink={(() => {
          const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin
          const params = new URLSearchParams(location.search)
          const open = params.get('open')
          return open ? `${siteUrl}/content?${params.toString()}` : undefined
        })()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
  title="Delete content"
        message={`Are you sure you want to delete "${deleteDialog.content?.title}"? This action cannot be undone.`}
  confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content"
                value={searchQuery}
                ref={searchInputRef}
                onChange={(e) => {
                  const v = e.target.value
                  setSearchQuery(v)
                  const params = new URLSearchParams(location.search)
                  if (v) params.set('q', v); else params.delete('q')
                  navigate({ search: params.toString() }, { replace: true })
                }}
                aria-label="Search content"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 items-center">
              <Select
                options={brandOptions}
                value={brandFilter}
                onChange={(e) => {
                  const v = e.target.value
                  setBrandFilter(v)
                  const params = new URLSearchParams(location.search)
                  if (v) params.set('brand', v); else params.delete('brand')
                  navigate({ search: params.toString() }, { replace: true })
                }}
              />

              <Select
                options={typeOptions}
                value={filterType}
                onChange={(e) => {
                  const v = e.target.value as typeof filterType
                  setFilterType(v)
                  const params = new URLSearchParams(location.search)
                  if (v && v !== 'all') params.set('type', v); else params.delete('type')
                  navigate({ search: params.toString() }, { replace: true })
                }}
              />

              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => {
                  const v = e.target.value as typeof filterStatus
                  setFilterStatus(v)
                  const params = new URLSearchParams(location.search)
                  if (v && v !== 'all') params.set('status', v); else params.delete('status')
                  navigate({ search: params.toString() }, { replace: true })
                }}
              />

              {isFiltersActive && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4 w-full">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Content by Company */}
      {!loading && !error && filteredContent.length > 0 && (
        <div className="space-y-6">
          {(() => {
            const grouped = filteredContent.reduce((acc, content) => {
              const brandName = content.brand_name || 'Unknown Brand'
              if (!acc[brandName]) acc[brandName] = [] as typeof filteredContent
              acc[brandName].push(content)
              return acc
            }, {} as Record<string, typeof filteredContent>)

            const entries = Object.entries(grouped) as [string, typeof filteredContent][]

            return entries.map(([brandName, brandContent]) => {
              const totalContent = brandContent.length
              const approvedContent = brandContent.filter((c: any) => c.status === 'approved').length

              return (
                <div key={brandName} className="w-full max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                  {/* Company Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h5 className="text-xl font-semibold text-gray-900">
                          {brandName}
                        </h5>
                        <p className="text-sm text-gray-500">{totalContent} pieces • {approvedContent} approved</p>
                      </div>
                    </div>
                    <Badge variant="primary" className="text-sm px-3 py-1">
                      {totalContent} Pieces
                    </Badge>
                  </div>

                  <p className="text-sm font-normal text-gray-500 mb-4">Click a piece to view and approve.</p>

                  {/* Content List */}
                  <ul className="space-y-3">
                    {brandContent.map((content: any) => {
                      const contentTopic = extractContentTopic(content)

                      return (
                        <li key={content.id}>
                          <div
                            className={`flex items-center justify-between p-4 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group focus-within:bg-gray-100 hover:shadow transition-all duration-200 ${content.post ? 'opacity-50 pointer-events-none bg-gray-200' : ''}`}
                            role={!content.post ? 'button' : undefined}
                            tabIndex={!content.post ? 0 : -1}
                            onClick={() => !content.post && handleViewContent(content)}
                            onKeyDown={(e) => {
                              if (content.post) return
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleViewContent(content)
                              }
                            }}
                            aria-label={!content.post ? `View details for ${content.title}` : undefined}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg">{getTypeIcon(content.type)}</span>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="font-semibold text-gray-900">
                                    {content.title}
                                  </span>
                                  {getStatusBadge(content.status)}
                                  {content.status !== 'approved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        // Optimistically update local state
                                        setGeneratedContent(prev => prev.map(c => c.id === content.id ? { ...c, status: 'approved' } : c))
                                        // Persist to backing table
                                        supabase.from('content').update({ status: 'approved' }).eq('id', content.id).then(({ error }: { error: any }) => {
                                          if (error) {
                                            // Revert if failed
                                            setGeneratedContent(prev => prev.map(c => c.id === content.id ? { ...c, status: 'draft' } : c))
                                          }
                                        })
                                      }}
                                      className="!ml-2 !py-0 !px-2 text-xs"
                                    >
                                      Approve
                                    </Button>
                                  )}
                                  {content.post && (
                                    <Badge variant="success" className="text-xs">
                                      Posted
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    {content.platform || content.type?.replace('_', ' ')}
                                  </Badge>
                                  {content.strategy_id && (
                                    <Badge variant="secondary" className="text-xs">
                                      Strategy #{content.strategy_id}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(content.created_at)}
                                  </span>
                                  <span>{content.metadata?.word_count || 0} words</span>
                                  {contentTopic && (
                                    <span className="text-blue-600">Topic: {truncateText(contentTopic, 30)}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleCopyLink(content) }}
                                aria-label={`Copy link for content ${content.id}`}
                                title="Copy link"
                                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                              >
                                <Share2 className="h-4 w-4" />
                                Copy link
                              </Button>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(content)
                                }}
                                variant="danger"
                                aria-label={`Delete content ${content.id}`}
                                title="Delete content"
                                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewContent(content)}
                                className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline hover:text-gray-700 transition-colors">
                      <HelpCircle className="w-3 h-3 me-2" />
                      How content generation works
                    </button>
                  </div>
                </div>
              )
            })
          })()}
        </div>
      )}
      {filteredContent.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allContent.length === 0 ? 'No content' : 'No matches'}
            </h3>
            <p className="text-gray-500 mb-6">
              {allContent.length === 0 ? 'Generate content from Ideas.' : 'Adjust filters to see more.'}
            </p>
            {allContent.length > 0 && isFiltersActive && (
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            )}
            {allContent.length === 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Go to Ideas → View an idea → Select → Generate content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
