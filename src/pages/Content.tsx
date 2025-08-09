import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Download,
  Share2
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

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
  const [firebaseBrands, setFirebaseBrands] = useState<any[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
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

  // Fetch brands from Firebase
  useEffect(() => {
    const fetchBrandsFromFirebase = async () => {
      try {
        const brandsCollection = collection(db, 'brands')
        const brandsSnapshot = await getDocs(brandsCollection)
        
        const brands = brandsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setFirebaseBrands(brands)
      } catch (error) {
        console.error('Error fetching brands from Firebase:', error)
        setFirebaseBrands([])
      } finally {
        setLoadingBrands(false)
      }
    }

    const fetchGeneratedContentFromFirebase = async () => {
      try {
        // Fetch only from 'content' collection
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

    fetchBrandsFromFirebase()
    fetchGeneratedContentFromFirebase()
  }, [])

  // Refresh content after operations
  const refreshContent = async () => {
    setLoadingContent(true)
    try {
      // Fetch only from 'content' collection
      const contentSnapshot = await getDocs(collection(db, 'content'))
      const contentItems = contentSnapshot.docs.map(doc => ({
        id: doc.id,
        firebaseId: doc.id, // Store the actual Firebase document ID
        source: 'content',
        ...doc.data()
      }))
      
      setGeneratedContent(contentItems)
    } catch (error) {
      console.error('Error refreshing content:', error)
    } finally {
      setLoadingContent(false)
    }
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
      // Use the actual Firebase document ID and determine collection
      const firebaseDocId = deleteDialog.content.firebaseId || deleteDialog.content.id
      const collectionName = 'content' // Always use content collection
      
      console.log(`Attempting to delete document with Firebase ID: ${firebaseDocId} from content collection`)
      console.log('Full content object:', deleteDialog.content)
      
      // Delete from content collection
      await deleteDoc(doc(db, collectionName, firebaseDocId))
      
      console.log(`Successfully deleted document ${firebaseDocId} from content collection`)
      
      // Update local state
      setGeneratedContent(prev => prev.filter(content => content.id !== deleteDialog.content.id))
      
      // Close dialog
      setDeleteDialog({ isOpen: false, content: null, loading: false })
      
      console.log('Content deleted successfully from database and UI updated')
    } catch (error) {
      console.error('Error deleting content:', error)
      console.error('Error details:', error.message)
      console.error('Firebase Document ID that failed:', deleteDialog.content.firebaseId || deleteDialog.content.id)
      alert('Failed to delete content. Please try again.')
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    } finally {
      // Ensure loading state is reset
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false })
  }

  // Filter content
  const allContent = generatedContent.map(content => ({
    ...content,
    company_id: content.brand_id,
    brand_name: content.brand_name || 'Unknown Brand'
  }))

  const filteredContent = allContent.filter(content => {
    const matchesCompany = !selectedCompany || content.company_id === selectedCompany
    const matchesStatus = filterStatus === 'all' || content.status === filterStatus
    const matchesType = filterType === 'all' || content.type === filterType
    const matchesSearch = !searchQuery || 
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.body.toLowerCase().includes(searchQuery.toLowerCase())
    
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
    ...firebaseBrands.map(brand => ({ value: brand.id, label: brand.name || 'Unnamed Brand' }))
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
                      <Badge variant="primary" className="ml-2 text-xs">
                        AI Generated
                      </Badge>
                      {content.strategy_id && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Strategy: {content.strategy_id.slice(-6)}
                        </Badge>
                      )}
                      {content.platform && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {content.platform}
                        </Badge>
                      )}
                    </p>
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