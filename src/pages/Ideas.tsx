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
  Users,
  Calendar
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { supabase } from '../lib/supabase'

// Helper function to extract and format idea content
const extractIdeaContent = (idea: any) => {
  return idea.description || 'No description available'
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
  // Group ideas by brand
  const ideasByBrand = supabaseIdeas.reduce((acc, idea) => {
    const brandName = idea.brand || 'Unknown Brand'
    if (!acc[brandName]) {
      acc[brandName] = []
    }
    acc[brandName].push({
      ...idea,
      source: 'supabase',
      company_id: idea.brand || idea.brand_id,
      brand_name: brandName,
      title: idea.header || idea.title || 'Untitled Idea',
      body: idea.description || idea.body || 'No description available',
      type: idea.type || 'idea',
      status: idea.status || 'draft',
      platforms: idea.platforms || [],
      created_at: idea.created_at || new Date().toISOString()
    })
    return acc
  }, {} as Record<string, any[]>)

  // Filter brands based on search and filters
  const filteredBrands = Object.entries(ideasByBrand).filter(([brandName, ideas]) => {
    const matchesCompany = !selectedCompany || brandName === selectedCompany
    const matchesSearch = !searchQuery || 
      brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ideas.some(idea => 
        (idea.topic && idea.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (idea.header && idea.header.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    return matchesCompany && matchesSearch
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
    ...Object.keys(ideasByBrand).map(brand => ({ value: brand, label: brand }))
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

      {/* Ideas by Brand */}
      <div className="space-y-8">
        {filteredBrands.map(([brandName, ideas]) => (
          <Card key={brandName} className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{brandName}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(ideas[0]?.created_at)}
                      </span>
                      <span className="font-medium">{ideas.length} idea{ideas.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </div>
                
                <Badge variant="primary" className="text-lg px-6 py-3 font-semibold">
                  {ideas.length} Ideas
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Individual Idea Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideas.map((idea) => (
                  <Card key={idea.id} className="bg-white border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                          💡
                        </div>
                        <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {idea.topic || idea.header || 'Untitled Idea'}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0 pb-4">
                      {/* Description */}
                      <div>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-gray-50 p-2 rounded-lg">
                          {truncateText(idea.description || 'No description available', 120)}
                        </p>
                      </div>
                      
                      {/* Image Prompt */}
                      {idea.image_prompt && (
                        <div>
                          <p className="text-xs font-medium text-gray-900 mb-1 flex items-center">
                            <Target className="h-3 w-3 mr-1 text-purple-500" />
                            Image Prompt
                          </p>
                          <p className="text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg line-clamp-2">
                            {truncateText(idea.image_prompt, 80)}
                          </p>
                        </div>
                      )}

                      {/* Platforms */}
                      {idea.platforms && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(idea.platforms) ? idea.platforms : [idea.platforms]).slice(0, 2).map((platform, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                              {platform}
                            </Badge>
                          ))}
                          {(Array.isArray(idea.platforms) ? idea.platforms : [idea.platforms]).length > 2 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              +{(Array.isArray(idea.platforms) ? idea.platforms : [idea.platforms]).length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-1 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs py-1.5 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                          onClick={() => handleViewIdea(idea)}
                        >
                          <Eye className="h-3 w-3 mr-1.5" />
                          View
                        </Button>
                        <button 
                          onClick={() => handleDeleteClick(idea)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                          title="Delete idea"
                        >
                          <Trash2 className="h-3 w-3 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
      {!loadingIdeas && filteredBrands.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {Object.keys(ideasByBrand).length === 0 ? 'No ideas found' : 'No ideas match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {Object.keys(ideasByBrand).length === 0 
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