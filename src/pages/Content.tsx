import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { supabase, type Tables } from '../lib/supabase'
import { FileText, Eye, CheckCircle, Clock, Search, Trash2, RefreshCw, Calendar, HelpCircle } from 'lucide-react'
import { IconButton } from '../components/ui/IconButton'
import { formatDate, truncateText } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'

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
  if (typeof fallbackContent === 'string' && fallbackContent.includes('"')) {
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

  return fallbackContent
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
  // Typed helpers for joined rows
  type CompanyRow = Tables<'companies'>
  type StrategyRow = Tables<'strategies'>
  type IdeaRow = Tables<'ideas'>
  type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow }
  type TwitterRow = Tables<'twitter_content'> & { idea?: IdeaJoined; company?: CompanyRow; strategy?: StrategyRow } & {
    // legacy/derived fields we may encounter
    brand_name?: string
    company_id?: number
    brand_id?: number
    strategy_id?: number
    title?: string
    body?: string
    status?: string
    post?: boolean | null
  }
  type LinkedInRow = Tables<'linkedin_content'> & { idea?: IdeaJoined; company?: CompanyRow; strategy?: StrategyRow } & TwitterRow
  type NewsletterRow = Tables<'newsletter_content'> & { idea?: IdeaJoined; company?: CompanyRow; strategy?: StrategyRow } & TwitterRow
  const [companies, setCompanies] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [_loadingCompanies, setLoadingCompanies] = useState(true) // reserved for future brand context
  const [loadingContent, setLoadingContent] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>('all')
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
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

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true)
      console.log('Fetching companies from Supabase...')

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

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

      // Fetch from all three content tables
      // Prefer relational select to join company for brand name; fallback to * if relation not available
      const [twitterRes, linkedinRes, newsletterRes] = await Promise.all([
        (async () => {
          // Prefer relational select via idea -> company/strategy (post-3NF)
          try {
            const res = await supabase
              .from('twitter_content')
              .select(`*, idea:ideas(*, company:companies(*), strategy:strategies(*))`)
              .order('created_at', { ascending: false })
            return res
          } catch (_e) {
            // Fallback to basic select
            return await supabase.from('twitter_content').select('*').order('created_at', { ascending: false })
          }
        })(),
        (async () => {
          try {
            const res = await supabase
              .from('linkedin_content')
              .select(`*, idea:ideas(*, company:companies(*), strategy:strategies(*))`)
              .order('created_at', { ascending: false })
            return res
          } catch (_e) {
            return await supabase.from('linkedin_content').select('*').order('created_at', { ascending: false })
          }
        })(),
        (async () => {
          try {
            const res = await supabase
              .from('newsletter_content')
              .select(`*, idea:ideas(*, company:companies(*), strategy:strategies(*))`)
              .order('created_at', { ascending: false })
            return res
          } catch (_e) {
            return await supabase.from('newsletter_content').select('*').order('created_at', { ascending: false })
          }
        })()
      ])

      console.log('=== SUPABASE CONTENT FETCH DEBUG ===')
      console.log('Twitter content response:', twitterRes)
      console.log('LinkedIn content response:', linkedinRes)
      console.log('Newsletter content response:', newsletterRes)

      const allContent = []

      // Process Twitter content
      if (twitterRes.data && !twitterRes.error) {
        const twitterContent = (twitterRes.data as TwitterRow[]).map((item) => ({
          ...item,
          source: 'twitter_content',
          platform: 'Twitter',
          type: 'social_post',
          title: item.title || 'Twitter Content',
          status: item.status || 'draft',
          post: item.post || false,
          // Derive company/strategy via idea relation after 3NF
          company_id: item.idea?.company_id ?? item.company_id ?? item.brand_id,
          strategy_id: item.idea?.strategy_id ?? item.strategy_id,
          brand_name: item.idea?.company?.brand_name || item.company?.brand_name || item.brand_name || 'Unknown Brand',
          body: item.content_body || item.body || 'No content available',
          body_text: item.content_body || item.body || 'No content available'
        }))
        allContent.push(...twitterContent)
        console.log('Twitter content processed:', twitterContent.length, 'items')
      } else if (twitterRes.error) {
        console.error('Error fetching Twitter content:', twitterRes.error)
      }

      // Process LinkedIn content
      if (linkedinRes.data && !linkedinRes.error) {
        const linkedinContent = (linkedinRes.data as LinkedInRow[]).map((item) => ({
          ...item,
          source: 'linkedin_content',
          platform: 'LinkedIn',
          type: 'social_post',
          title: item.title || item.content_body?.substring(0, 50) + '...' || 'LinkedIn Content',
          status: item.status || 'draft',
          post: item.post || false,
          company_id: item.idea?.company_id ?? item.company_id ?? item.brand_id,
          strategy_id: item.idea?.strategy_id ?? item.strategy_id,
          brand_name: item.idea?.company?.brand_name || item.company?.brand_name || item.brand_name || 'Unknown Brand',
          body: item.content_body || item.body || 'No content available',
          body_text: item.content_body || item.body || 'No content available'
        }))
        allContent.push(...linkedinContent)
        console.log('LinkedIn content processed:', linkedinContent.length, 'items')
        console.log('LinkedIn content sample:', linkedinContent[0])
      } else if (linkedinRes.error) {
        console.error('Error fetching LinkedIn content:', linkedinRes.error)
      }

      // Process Newsletter content
      if (newsletterRes.data && !newsletterRes.error) {
        const newsletterContent = (newsletterRes.data as NewsletterRow[]).map((item) => ({
          ...item,
          source: 'newsletter_content',
          platform: 'Newsletter',
          type: 'email',
          title: item.title || item.content_body?.substring(0, 50) + '...' || 'Newsletter Content',
          status: item.status || 'draft',
          post: item.post || false,
          company_id: item.idea?.company_id ?? item.company_id ?? item.brand_id,
          strategy_id: item.idea?.strategy_id ?? item.strategy_id,
          brand_name: item.idea?.company?.brand_name || item.company?.brand_name || item.brand_name || 'Unknown Brand',
          body: item.content_body || item.body || 'No content available',
          body_text: item.content_body || item.body || 'No content available'
        }))
        allContent.push(...newsletterContent)
        console.log('Newsletter content processed:', newsletterContent.length, 'items')
        console.log('Newsletter content sample:', newsletterContent[0])
      } else if (newsletterRes.error) {
        console.error('Error fetching Newsletter content:', newsletterRes.error)
      }

      // Sort all content by created_at (most recent first)
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log('Total content items fetched:', allContent.length)
      console.log('All content:', allContent)
      setGeneratedContent(allContent)

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

  const handleViewContent = (content: any) => {
    console.log('Opening content modal for:', content)
    console.log('Content has strategy_id (from idea or legacy column):', content.strategy_id)
    setViewContentModal({
      isOpen: true,
      content,
      strategyId: content.strategy_id || content.idea?.strategy_id || content.metadata?.parent_strategy_id // Prefer idea.strategy_id post-3NF
    })
  }

  const handleCloseViewModal = () => {
    setViewContentModal({ isOpen: false, content: null, strategyId: undefined })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generated Content</h1>
          <p className="mt-2 text-gray-600">
            View and manage all your AI-generated content pieces.
          </p>
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
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Content"
        message={`Are you sure you want to delete "${deleteDialog.content?.title}"? This action cannot be undone.`}
        confirmText="Delete Content"
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
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search content"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Select
                options={brandOptions}
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              />

              <Select
                options={typeOptions}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              />

              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              />
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
                        <p className="text-sm text-gray-500">
                          {totalContent} content piece{totalContent === 1 ? '' : 's'} • {approvedContent} approved
                        </p>
                      </div>
                    </div>
                    <Badge variant="primary" className="text-sm px-3 py-1">
                      {totalContent} Pieces
                    </Badge>
                  </div>

                  <p className="text-sm font-normal text-gray-500 mb-4">
                    AI-generated content ready for review and publishing. Click on any content piece to view details and manage approval status.
                  </p>

                  {/* Content List */}
                  <ul className="space-y-3">
                    {brandContent.map((content: any) => {
                      const contentTopic = extractContentTopic(content)

                      return (
                        <li key={content.id}>
                          <div className={`flex items-center justify-between p-4 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group focus-within:bg-gray-100 hover:shadow transition-all duration-200 ${content.post ? 'opacity-50 pointer-events-none bg-gray-200' : ''
                            }`}>
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
                      How does content generation work?
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
              {allContent.length === 0 ? 'No content yet' : 'No content matches your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {allContent.length === 0
                ? 'Generate content from your ideas to see them here.'
                : 'Try adjusting your filters to see more content.'
              }
            </p>
            {allContent.length === 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Go to <strong>Ideas</strong> → View an idea → Select an idea → Click <strong>Generate Content</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
