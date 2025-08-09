import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { GenerateStrategyModal } from '../components/content/GenerateStrategyModal'
import { 
  FileText, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Download,
  Share2,
  Zap,
  Plus,
  Target
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { db } from '../lib/firebase'
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore'
import { useCompanies } from '../hooks/useCompanies'
import { supabase } from '../lib/supabase'

// Brand Selection Modal Component
interface BrandSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  brands: any[]
  onSelectBrand: (brand: any) => void
}

function BrandSelectionModal({ isOpen, onClose, brands, onSelectBrand }: BrandSelectionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Select Brand</h2>
          <p className="text-sm text-gray-600 mt-1">Choose which brand to generate a strategy for</p>
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => onSelectBrand(brand)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {brand.name?.charAt(0) || 'B'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-900">
                      {brand.name || 'Unnamed Brand'}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {brand.brand_voice?.tone || brand.brandTone || 'No tone specified'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function to extract and format strategy content from JSON
const extractStrategyContent = (strategy: any) => {
  // Try to parse the body if it's JSON
  let parsedContent = null
  try {
    if (typeof strategy.body === 'string' && (strategy.body.startsWith('[') || strategy.body.startsWith('{'))) {
      parsedContent = JSON.parse(strategy.body)
    }
  } catch (error) {
    // If parsing fails, use the raw body
  }

  // Extract meaningful content from parsed JSON
  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstStrategy = parsedContent[0]
      if (firstStrategy.description) {
        return firstStrategy.description.replace(/^["']|["']$/g, '').trim()
      }
      if (firstStrategy.content) {
        return firstStrategy.content.replace(/^["']|["']$/g, '').trim()
      }
      if (firstStrategy.header) {
        return firstStrategy.header.replace(/^["']|["']$/g, '').trim()
      }
      // If it's an array of strategies, try to extract a meaningful summary
      if (typeof firstStrategy === 'string') {
        return firstStrategy.replace(/^["']|["']$/g, '').trim()
      }
    }
    
    if (parsedContent.description) {
      return parsedContent.description.replace(/^["']|["']$/g, '').trim()
    }
    
    if (parsedContent.content) {
      return parsedContent.content.replace(/^["']|["']$/g, '').trim()
    }
    
    if (parsedContent.header) {
      return parsedContent.header.replace(/^["']|["']$/g, '').trim()
    }
  }

  // Fallback to original body or a default message
  const fallbackContent = strategy.body || 'AI-generated content strategy with multiple angles and approaches.'
  
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
    
    return cleanContent || 'AI-generated content strategy with multiple angles and approaches.'
  }
  
  return fallbackContent
}

// Helper function to extract strategy focus/header
const extractStrategyFocus = (strategy: any) => {
  let parsedContent = null
  try {
    if (typeof strategy.body === 'string' && (strategy.body.startsWith('[') || strategy.body.startsWith('{'))) {
      parsedContent = JSON.parse(strategy.body)
    }
  } catch (error) {
    // If parsing fails, return null
  }

  if (parsedContent) {
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      const firstStrategy = parsedContent[0]
      if (firstStrategy.header) {
        return firstStrategy.header
      }
      if (firstStrategy.brandId) {
        return `Strategy for ${firstStrategy.brandId}`
      }
      if (firstStrategy.topic) {
        return firstStrategy.topic
      }
    }
    
    if (parsedContent.header) {
      return parsedContent.header
    }
    
    if (parsedContent.topic) {
      return parsedContent.topic
    }
  }

  return null
}

interface Strategy {
  id: string
  title: string
  body: string
  status: string
  created_at: string
  brand_id?: string
  brand_name?: string
  company_id?: string
  type?: string
  firebaseId?: string
  metadata?: {
    word_count?: number
  }
}

export function Strategies() {
  const { companies } = useCompanies()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [generatedStrategies, setGeneratedStrategies] = useState<Strategy[]>([])
  const [loadingStrategies, setLoadingStrategies] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrandSelection, setShowBrandSelection] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [viewStrategyModal, setViewStrategyModal] = useState<{ isOpen: boolean; strategy: Strategy | null; content?: any }>({
    isOpen: false,
    strategy: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    strategy: Strategy | null
    content?: any
    loading: boolean
  }>({
    isOpen: false,
    strategy: null,
    loading: false
  })

  useEffect(() => {
    const fetchStrategiesFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('strategies')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching strategies from Supabase:', error)
          setStrategies([])
        } else {
          console.log('Fetched strategies from Supabase:', data)
          setStrategies(data || [])
        }
      } catch (error) {
        console.error('Error fetching strategies from Supabase:', error)
        setStrategies([])
      } finally {
        setLoadingStrategies(false)
      }
    }

    const fetchGeneratedStrategiesFromFirebase = async () => {
      try {
        const strategyCollection = collection(db, 'strategy')
        const strategySnapshot = await getDocs(strategyCollection)
        
        const strategies = strategySnapshot.docs.map(doc => ({
          id: doc.id,
          firebaseId: doc.id, // Store the actual Firebase document ID
          ...doc.data()
        }))
        
        // Filter to only show content strategies
        const actualStrategies = strategies.filter(item => 
          item.type === 'content_strategy'
        )
        
        setGeneratedStrategies(actualStrategies)
      } catch (error) {
        console.error('Error fetching strategies from Firebase:', error)
        setGeneratedStrategies([])
      } finally {
        setLoadingStrategies(false)
      }
    }

    fetchStrategiesFromSupabase()
    fetchGeneratedStrategiesFromFirebase()
  }, [])

  const refreshStrategies = async () => {
    setLoadingStrategies(true)
    try {
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error refreshing strategies from Supabase:', error)
        setStrategies([])
      } else {
        setStrategies(data || [])
      }

      const strategyCollection = collection(db, 'strategy')
      const strategySnapshot = await getDocs(strategyCollection)
      
      const strategies = strategySnapshot.docs.map(doc => ({
        id: doc.id,
        firebaseId: doc.id, // Store the actual Firebase document ID
        ...doc.data()
      }))
      
      const actualStrategies = strategies.filter(item => 
        item.type === 'content_strategy'
      )
      
      setGeneratedStrategies(actualStrategies)
    } catch (error) {
      console.error('Error refreshing strategies:', error)
    } finally {
      setLoadingStrategies(false)
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
      // Use the actual Firebase document ID
      const firebaseDocId = deleteDialog.content.firebaseId || deleteDialog.content.id
      console.log('Attempting to delete strategy with Firebase ID:', firebaseDocId)
      console.log('Full strategy object:', deleteDialog.content)
      
      await deleteDoc(doc(db, 'strategy', firebaseDocId))
      console.log('Successfully deleted strategy from Firebase:', firebaseDocId)
      
      setGeneratedStrategies(prev => prev.filter(content => content.id !== deleteDialog.content.id))
      setDeleteDialog({ isOpen: false, content: null, loading: false })
      console.log('Strategy deleted successfully from database and UI updated')
    } catch (error) {
      console.error('Error deleting strategy:', error)
      console.error('Error details:', error.message)
      console.error('Firebase Document ID that failed:', deleteDialog.content.firebaseId || deleteDialog.content.id)
      alert('Failed to delete strategy. Please try again.')
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    } finally {
      // Ensure loading state is reset
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false })
  }

  const handleGenerateStrategyClick = () => {
    if (companies.length === 0) {
      alert('Please add a company first before generating strategies.')
      return
    }
    
    if (companies.length === 1) {
      // If only one company, use it directly
      setSelectedBrand(companies[0])
      setShowGenerateModal(true)
    } else {
      // If multiple companies, show selection modal
      setShowBrandSelection(true)
    }
  }

  const handleBrandSelect = (brand: any) => {
    setSelectedBrand(brand)
    setShowBrandSelection(false)
    setShowGenerateModal(true)
  }

  const allStrategies = generatedStrategies.map(strategy => ({
    ...strategy,
    source: 'generated',
    company_id: strategy.brand_id,
    brand_name: strategy.brand_name || 'Unknown Brand'
  }))

  const filteredStrategies = allStrategies.filter(strategy => {
    const matchesCompany = !selectedCompany || strategy.company_id === selectedCompany
    const matchesStatus = filterStatus === 'all' || strategy.status === filterStatus
    const matchesSearch = !searchQuery || 
      strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.body.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCompany && matchesStatus && matchesSearch
  })

  const handleViewStrategy = (content: any) => {
    setViewStrategyModal({ isOpen: true, content })
  }

  const handleCloseViewModal = () => {
    setViewStrategyModal({ isOpen: false, content: null })
  }

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Approved' }
  ]

  const brandOptions = [
    { value: '', label: 'All Companies' },
    ...companies.map(brand => ({ value: brand.id, label: brand.name || 'Unnamed Brand' }))
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
          <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
          <p className="mt-2 text-gray-600">
            View and manage your AI-generated content strategies.
          </p>
        </div>
        <Button onClick={handleGenerateStrategyClick}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Strategy
        </Button>
      </div>

      <ViewContentModal
        isOpen={viewStrategyModal.isOpen}
        onClose={handleCloseViewModal}
        content={viewStrategyModal.content}
      />

      <BrandSelectionModal
        isOpen={showBrandSelection}
        onClose={() => setShowBrandSelection(false)}
        brands={companies}
        onSelectBrand={handleBrandSelect}
      />

      <GenerateStrategyModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        selectedBrand={selectedBrand}
      />

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Strategy"
        message={`Are you sure you want to delete "${deleteDialog.content?.title}"? This action cannot be undone.`}
        confirmText="Delete Strategy"
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
                placeholder="Search strategies..."
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
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredStrategies.map((strategy) => (
          <Card key={strategy.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">⚡</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base line-clamp-2">
                      {strategy.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {strategy.brand_name}
                      <Badge variant="primary" className="ml-2 text-xs">
                        AI Generated
                      </Badge>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleDeleteClick(strategy)}
                    className="p-1 hover:bg-red-50 rounded-lg transition-colors group"
                    title="Delete strategy"
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
              {/* Strategy Focus */}
              {extractStrategyFocus(strategy) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-1 text-blue-600" />
                    Strategy Focus
                  </h4>
                  <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                    {extractStrategyFocus(strategy)}
                  </p>
                </div>
              )}

              {/* Strategy Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-purple-600" />
                  Strategy Overview
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                    {truncateText(extractStrategyContent(strategy), 200)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(strategy.created_at)}</span>
                <span>{strategy.metadata?.word_count || 0} words</span>
              </div>

              <div className="flex items-center justify-between">
                {getStatusBadge(strategy.status)}
                <Badge variant="secondary" className="text-xs capitalize">
                  Content Strategy
                </Badge>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewStrategy(strategy)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStrategies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allStrategies.length === 0 ? 'No strategies yet' : 'No strategies match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {allStrategies.length === 0 
                ? 'Generate your first content strategy to see it here.'
                : 'Try adjusting your filters to see more strategies.'
              }
            </p>
            {allStrategies.length === 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Go to <strong>Companies</strong> → View a company → Click <strong>Generate Strategy</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}