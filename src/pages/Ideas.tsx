import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { 
  Lightbulb, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock,
  Sparkles,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  FileText,
  Target,
  Users
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { supabase } from '../lib/supabase'

// Helper function to extract and format idea content
const extractIdeaContent = (idea: any) => {
  // First check if we have a direct description field from Supabase
  if (idea.description && typeof idea.description === 'string') {
    return idea.description
  }
  
  // Then check body field
  if (idea.body && typeof idea.body === 'string' && !idea.body.startsWith('[') && !idea.body.startsWith('{')) {
    return idea.body
  }
  
  // Try to parse the body if it's JSON
  let parsedContent = null
  try {
    if (typeof idea.body === 'string' && idea.body.startsWith('[') || idea.body.startsWith('{')) {
      parsedContent = JSON.parse(idea.body)
    }
  } catch (error) {
    // If parsing fails, use the raw body
  }

  // Extract meaningful content from parsed JSON
  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstIdea = parsedContent[0]
      if (firstIdea.description) {
        // Clean up the description by removing extra quotes and formatting
        return firstIdea.description.replace(/^["']|["']$/g, '').trim()
      }
      if (firstIdea.topic) {
        return firstIdea.topic.replace(/^["']|["']$/g, '').trim()
      }
      if (firstIdea.content) {
        return firstIdea.content.replace(/^["']|["']$/g, '').trim()
      }
      // If it's an array of ideas, try to extract a meaningful summary
      if (typeof firstIdea === 'string') {
        return firstIdea.replace(/^["']|["']$/g, '').trim()
      }
    }
    
    if (parsedContent.description) {
      return parsedContent.description.replace(/^["']|["']$/g, '').trim()
    }
    
    if (parsedContent.topic) {
      return parsedContent.topic.replace(/^["']|["']$/g, '').trim()
    }
    
    if (parsedContent.content) {
      return parsedContent.content.replace(/^["']|["']$/g, '').trim()
    }
  }

  // Fallback to original body or a default message
  const fallbackContent = idea.body || 'AI-generated content idea based on your selected strategy.'
  
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
    
    return cleanContent || 'AI-generated content idea based on your selected strategy.'
  }
  
  return fallbackContent
}

// Helper function to extract idea summary/topic
const extractIdeaSummary = (idea: any) => {
  // First check if we have a direct header field from Supabase
  if (idea.header && typeof idea.header === 'string') {
    return idea.header
  }
  
  // Then check title field
  if (idea.title && typeof idea.title === 'string') {
    return idea.title
  }
  
  let parsedContent = null
  try {
    if (typeof idea.body === 'string' && (idea.body.startsWith('[') || idea.body.startsWith('{'))) {
      parsedContent = JSON.parse(idea.body)
    }
  } catch (error) {
    // If parsing fails, return null
  }

  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstIdea = parsedContent[0]
      if (firstIdea.topic) {
        return firstIdea.topic
      }
      if (firstIdea.angleId) {
        return `Content Angle ${firstIdea.angleId}`
      }
    }
    
    if (parsedContent.topic) {
      return parsedContent.topic
    }
  }

  return null
}

export function Ideas() {
  const [supabaseIdeas, setSupabaseIdeas] = useState<any[]>([])
  const [loadingIdeas, setLoadingIdeas] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>('all')
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [filterPlatform, setFilterPlatform] = useState<'all' | string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewIdeaModal, setViewIdeaModal] = useState<{ isOpen: boolean; idea: any }>({
    isOpen: false,
    idea: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    idea: any
    loading: boolean
  }>({
    isOpen: false,
    idea: null,
    loading: false
  })

  // Fetch ideas from Supabase
  useEffect(() => {
    fetchIdeasFromSupabase()
  }, [])

  const fetchIdeasFromSupabase = async () => {
    try {
      setLoadingIdeas(true)
      console.log('Fetching ideas from Supabase...')
      
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Supabase ideas response:', { data, error })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Ideas fetched successfully:', data?.length || 0, 'records')
      setSupabaseIdeas(data || [])
    } catch (error) {
      console.error('Error fetching ideas from Supabase:', error)
      setSupabaseIdeas([])
    } finally {
      setLoadingIdeas(false)
    }
  }

  const refreshIdeas = async () => {
    await fetchIdeasFromSupabase()
  }

  const handleDeleteClick = (idea: any) => {
    setDeleteDialog({
      isOpen: true,
      idea,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.idea) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      console.log('Attempting to delete idea with Supabase ID:', deleteDialog.idea.id)
      console.log('Full idea object:', deleteDialog.idea)
      
      // Delete from Supabase ideas table
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', deleteDialog.idea.id)
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      console.log('Successfully deleted idea from Supabase:', deleteDialog.idea.id)
      
      // Update local state
      setSupabaseIdeas(prev => prev.filter(idea => idea.id !== deleteDialog.idea.id))
      
      console.log('Updated local state, removed idea from UI')
      
      // Close dialog
      setDeleteDialog({ isOpen: false, idea: null, loading: false })
      
      console.log('Idea deleted successfully from Supabase and UI updated')
    } catch (error) {
      console.error('Error deleting idea:', error)
      console.error('Error details:', error.message)
      console.error('Supabase ID that failed:', deleteDialog.idea.id)
      alert('Failed to delete idea. Please try again.')
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    } finally {
      // Ensure loading state is reset if still loading
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, idea: null, loading: false })
  }

  // Filter ideas
  const allIdeas = supabaseIdeas.map(idea => ({
    ...idea,
    source: 'supabase',
    company_id: idea.brand || idea.brand_id,
    brand_name: idea.brand || idea.brand_name || 'Unknown Brand',
    title: idea.header || idea.title || 'Untitled Idea',
    body: idea.description || idea.body || 'No description available',
    type: idea.type || 'idea',
    status: idea.status || 'draft',
    platforms: idea.platforms || [],
    created_at: idea.created_at || new Date().toISOString()
  }))

  const filteredIdeas = allIdeas.filter(idea => {
    const matchesCompany = !selectedCompany || 
      idea.company_id === selectedCompany || 
      idea.brand === selectedCompany ||
      idea.brand_name === selectedCompany
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus
    const matchesType = filterType === 'all' || idea.type === filterType
    const matchesPlatform = filterPlatform === 'all' || 
      (Array.isArray(idea.platforms) && idea.platforms.includes(filterPlatform)) ||
      (typeof idea.platforms === 'string' && idea.platforms.includes(filterPlatform)) ||
      (idea.metadata?.platforms && idea.metadata.platforms.includes(filterPlatform))
    const matchesSearch = !searchQuery || (
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (idea.header && idea.header.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    
    return matchesCompany && matchesStatus && matchesType && matchesPlatform && matchesSearch
  })

  const handleViewIdea = (idea: any) => {
    setViewIdeaModal({ isOpen: true, idea })
  }

  const handleCloseViewModal = () => {
    setViewIdeaModal({ isOpen: false, idea: null })
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Approved' }
  ]

  const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'blog', label: 'Blog' }
  ]

  const brandOptions = [
    { value: '', label: 'All Companies' },
    // Note: You may want to fetch brands from Supabase as well if needed
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="mt-2 text-gray-600">
            AI-generated content ideas based on your strategies.
          </p>
        </div>
      </div>

      <ViewContentModal
        isOpen={viewIdeaModal.isOpen}
        onClose={handleCloseViewModal}
        content={viewIdeaModal.idea}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Idea"
        message={`Are you sure you want to delete "${deleteDialog.idea?.title}"? This action cannot be undone.`}
        confirmText="Delete Idea"
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
                placeholder="Search ideas..."
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
                options={platformOptions}
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value as typeof filterPlatform)}
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

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredIdeas.map((idea) => (
          <Card key={idea.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base line-clamp-2">
                      {idea.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {idea.brand_name}
                      <Badge variant="primary" className="ml-2 text-xs">
                        AI Generated
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleDeleteClick(idea)}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors group"
                    title="Delete idea"
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
              {/* Idea Summary */}
              {extractIdeaSummary(idea) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-1 text-blue-600" />
                    Topic
                  </h4>
                  <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                    {extractIdeaSummary(idea)}
                  </p>
                </div>
              )}

              {/* Idea Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1 text-yellow-600" />
                  Generated Idea
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                    {truncateText(extractIdeaContent(idea), 200)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(idea.created_at)}</span>
                <span>From Supabase</span>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(idea.status)}
                <Badge variant="secondary" className="text-xs capitalize">
                  {idea.type?.replace('_', ' ') || 'idea'}
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewIdea(idea)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Loading State */}
      {loadingIdeas && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ideas from Supabase...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loadingIdeas && filteredIdeas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allIdeas.length === 0 ? 'No ideas found' : 'No ideas match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {allIdeas.length === 0 
                ? 'The ideas table in your Supabase database is empty.'
                : 'Try adjusting your filters to see more ideas.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}