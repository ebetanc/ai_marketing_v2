import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { supabase } from '../lib/supabase'
import { FileText, Eye, CheckCircle, Clock, Search, MoreVertical, Trash2 } from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'

// Helper function to extract and format content from JSON
const extractContentBody = (content: any) => {
  // Try to parse the body if it's JSON
  let parsedContent = null
  try {
    if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
      parsedContent = JSON.parse(content.body)
    }
  } catch (error) {
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
  } catch (error) {
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
  const [companies, setCompanies] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingContent, setLoadingContent] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>('all')
  const [filterType, setFilterType] = useState<'all' | string>('all')
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

  // Fetch companies and content from Supabase
  useEffect(() => {
    fetchCompanies()
    fetchContent()
  }, [])

  const fetchCompanies = async () => {
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
    } catch (error) {
      console.error('Error fetching companies:', error)
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  const fetchContent = async () => {
    try {
      setLoadingContent(true)
      console.log('Fetching content from Supabase tables...')

      // Fetch from all three content tables
      // Prefer relational select to join company for brand name; fallback to * if relation not available
      const [twitterRes, linkedinRes, newsletterRes] = await Promise.all([
        (async () => {
          try {
            const res = await supabase
              .from('twitter_content')
              .select(`*, company:companies(*)`)
              .order('created_at', { ascending: false })
            return res
          } catch (e) {
            return await supabase.from('twitter_content').select('*').order('created_at', { ascending: false })
          }
        })(),
        (async () => {
          try {
            const res = await supabase
              .from('linkedin_content')
              .select(`*, company:companies(*)`)
              .order('created_at', { ascending: false })
            return res
          } catch (e) {
            return await supabase.from('linkedin_content').select('*').order('created_at', { ascending: false })
          }
        })(),
        (async () => {
          try {
            const res = await supabase
              .from('newsletter_content')
              .select(`*, company:companies(*)`)
              .order('created_at', { ascending: false })
            return res
          } catch (e) {
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
        const twitterContent = twitterRes.data.map(item => ({
          ...item,
          source: 'twitter_content',
          platform: 'Twitter',
          type: 'social_post',
          title: item.title || 'Twitter Content',
          status: item.status || 'draft',
          company_id: item.company_id ?? item.brand_id,
          brand_name: item.company?.brand_name || item.brand_name || item.company?.name || 'Unknown Brand'
        }))
        allContent.push(...twitterContent)
        console.log('Twitter content processed:', twitterContent.length, 'items')
      } else if (twitterRes.error) {
        console.error('Error fetching Twitter content:', twitterRes.error)
      }

      // Process LinkedIn content
      if (linkedinRes.data && !linkedinRes.error) {
        const linkedinContent = linkedinRes.data.map(item => ({
          ...item,
          source: 'linkedin_content',
          platform: 'LinkedIn',
          type: 'social_post',
          title: item.title || 'LinkedIn Content',
          status: item.status || 'draft',
          company_id: item.company_id ?? item.brand_id,
          brand_name: item.company?.brand_name || item.brand_name || item.company?.name || 'Unknown Brand'
        }))
        allContent.push(...linkedinContent)
        console.log('LinkedIn content processed:', linkedinContent.length, 'items')
      } else if (linkedinRes.error) {
        console.error('Error fetching LinkedIn content:', linkedinRes.error)
      }

      // Process Newsletter content
      if (newsletterRes.data && !newsletterRes.error) {
        const newsletterContent = newsletterRes.data.map(item => ({
          ...item,
          source: 'newsletter_content',
          platform: 'Newsletter',
          type: 'email',
          title: item.title || 'Newsletter Content',
          status: item.status || 'draft',
          company_id: item.company_id ?? item.brand_id,
          brand_name: item.company?.brand_name || item.brand_name || item.company?.name || 'Unknown Brand'
        }))
        allContent.push(...newsletterContent)
        console.log('Newsletter content processed:', newsletterContent.length, 'items')
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
    } finally {
      setLoadingContent(false)
    }
  }

  // Refresh content after operations
  const refreshContent = async () => {
    await fetchContent()
  }

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
        alert(`Failed to delete content: ${error.message}`)
        return
      }

      console.log('Content deleted successfully from Supabase')

      // Update local state
      setGeneratedContent(prev => prev.filter(content => content.id !== deleteDialog.content.id))

      // Close dialog
      setDeleteDialog({ isOpen: false, content: null, loading: false })

      console.log('Content deleted successfully and UI updated')
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Failed to delete content. Please try again.')
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false })
  }

  // Legacy Firebase code removed - keeping for reference if needed
  const legacyFetchBrandsFromFirebase = async () => {
    try {
      const { db } = await import('../lib/firebase')
      const { collection, getDocs } = await import('firebase/firestore')
      const brandsCollection = collection(db, 'brands')
      const brandsSnapshot = await getDocs(brandsCollection)

      const brands = brandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setCompanies(brands)
    } catch (error) {
      console.error('Error fetching brands from Firebase:', error)
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  const legacyFetchGeneratedContentFromFirebase = async () => {
    try {
      const { db } = await import('../lib/firebase')
      const { collection, getDocs } = await import('firebase/firestore')
      const contentSnapshot = await getDocs(collection(db, 'content'))

      const contentItems = contentSnapshot.docs.map(doc => ({
        id: doc.id,
        firebaseId: doc.id, // Store the actual Firebase document ID
        source: 'content',
        ...doc.data()
      }))

      setGeneratedContent(contentItems)
    } catch (error) {
      console.error('Error fetching content from Firebase:', error)
      setGeneratedContent([])
    } finally {
      setLoadingContent(false)
    }
  }

  // Filter content
  const allContent = generatedContent.map(content => ({
    ...content,
    company_id: content.company_id ?? content.brand_id,
    brand_name: content.brand_name || content.company?.brand_name || content.company?.name || 'Unknown Brand'
  }))

  const filteredContent = allContent.filter(content => {
    const matchesCompany = !selectedCompany || String(content.company_id) === String(selectedCompany)
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    const matchesType = filterType === 'all' || content.type === filterType
    const matchesSearch = !searchQuery ||
      (content.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.body || '').toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCompany && matchesStatus && matchesType && matchesSearch
  })

  const handleViewContent = (content: any) => {
    console.log('Opening content modal for:', content)
    console.log('Content has strategy_id:', content.strategy_id)
    setViewContentModal({
      isOpen: true,
      content,
      strategyId: content.strategy_id || content.metadata?.parent_strategy_id // Pass strategy_id if it exists
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
      value: company.id,
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <Select
                options={brandOptions}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredContent.map((content) => (
          <Card key={content.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">{getTypeIcon(content.type)}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base line-clamp-2">
                      {content.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {content.brand_name}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {content.platform || 'AI Generated'}
                      </Badge>
                      {content.strategy_id && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Strategy: {String(content.strategy_id).slice(-6)}
                        </Badge>
                      )}
                      {content.platform && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {content.platform}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleDeleteClick(content)}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors group"
                    title="Delete content"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Content Topic/Subject */}
              {extractContentTopic(content) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-blue-600" />
                    Content Focus
                  </h4>
                  <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                    {extractContentTopic(content)}
                  </p>
                </div>
              )}

              {/* Content Body */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1 text-green-600" />
                  Generated Content
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                    {truncateText(extractContentBody(content), 200)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(content.created_at)}</span>
                <span>{content.metadata?.word_count || 0} words</span>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(content.status)}
                <Badge variant="secondary" className="text-xs capitalize">
                  {content.type?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleViewContent(content)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
