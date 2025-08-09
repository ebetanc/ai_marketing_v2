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


export function Strategies() {
  const { companies } = useCompanies()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loadingStrategies, setLoadingStrategies] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showBrandSelection, setShowBrandSelection] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [viewStrategyModal, setViewStrategyModal] = useState<{ isOpen: boolean; strategy: Strategy | null }>({
    isOpen: false,
    strategy: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    strategy: Strategy | null
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

    fetchStrategiesFromSupabase()
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
    } catch (error) {
      console.error('Error refreshing strategies:', error)
    } finally {
      setLoadingStrategies(false)
    }
  }
        
  const handleDeleteClick = (strategy: Strategy) => {
    setDeleteDialog({
      isOpen: true,
      strategy,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.strategy) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase
        .from('strategies')
        .delete()
        .eq('id', deleteDialog.strategy.id)
      
      if (error) {
        throw error
      }
      
      console.log('Successfully deleted strategy from Supabase:', deleteDialog.strategy.id)
      
      setStrategies(prev => prev.filter(strategy => strategy.id !== deleteDialog.strategy!.id))
      setDeleteDialog({ isOpen: false, strategy: null, loading: false })
      console.log('Strategy deleted successfully from database and UI updated')
    } catch (error) {
      console.error('Error deleting strategy:', error)
      alert('Failed to delete strategy. Please try again.')
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    } finally {
      // Ensure loading state is reset
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, strategy: null, loading: false })
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

  // Transform Supabase strategies to display format
  const transformedStrategies = strategies.map(strategy => ({
    ...strategy,
    title: `Strategy for ${strategy.brand || 'Unknown Brand'}`,
    brand_name: strategy.brand || 'Unknown Brand',
    company_id: strategy.brand || '',
    status: 'draft', // Default status since not in Supabase table
    type: 'content_strategy',
    // Convert angles to a structured format for display
    angles: [
      strategy.angle1_header && {
        header: strategy.angle1_header,
        description: strategy.angle1_description,
        objective: strategy.angle1_objective,
        tonality: strategy.angle1_tonality
      },
      strategy.angle2_header && {
        header: strategy.angle2_header,
        description: strategy.angle2_description,
        objective: strategy.angle2_objective,
        tonality: strategy.angle2_tonality
      },
      strategy.angle3_header && {
        header: strategy.angle3_header,
        description: strategy.angle3_description,
        objective: strategy.angle3_objective,
        tonality: strategy.angle3_tonality
      },
      strategy.angle4_header && {
        header: strategy.angle4_header,
        description: strategy.angle4_description,
        objective: strategy.angle4_objective,
        tonality: strategy.angle4_tonality
      },
      strategy.angle5_header && {
        header: strategy.angle5_header,
        description: strategy.angle5_description,
        objective: strategy.angle5_objective,
        tonality: strategy.angle5_tonality
      },
      strategy.angle6_header && {
        header: strategy.angle6_header,
        description: strategy.angle6_description,
        objective: strategy.angle6_objective,
        tonality: strategy.angle6_tonality
      },
      strategy.angle7_header && {
        header: strategy.angle7_header,
        description: strategy.angle7_description,
        objective: strategy.angle7_objective,
        tonality: strategy.angle7_tonality
      },
      strategy.angle8_header && {
        header: strategy.angle8_header,
        description: strategy.angle8_description,
        objective: strategy.angle8_objective,
        tonality: strategy.angle8_tonality
      },
      strategy.angle9_header && {
        header: strategy.angle9_header,
        description: strategy.angle9_description,
        objective: strategy.angle9_objective,
        tonality: strategy.angle9_tonality
      },
      strategy.angle10_header && {
        header: strategy.angle10_header,
        description: strategy.angle10_description,
        objective: strategy.angle10_objective,
        tonality: strategy.angle10_tonality
      }
    ].filter(Boolean) // Remove null/undefined angles
  }))

  const filteredStrategies = transformedStrategies.filter(strategy => {
    const matchesCompany = !selectedCompany || strategy.company_id === selectedCompany
    const matchesStatus = filterStatus === 'all' || strategy.status === filterStatus
    const matchesSearch = !searchQuery || 
      strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (strategy.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (strategy.platforms || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCompany && matchesStatus && matchesSearch
  })

  const handleViewStrategy = (strategy: any) => {
    setViewStrategyModal({ isOpen: true, strategy })
  }

  const handleCloseViewModal = () => {
    setViewStrategyModal({ isOpen: false, strategy: null })
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
        content={viewStrategyModal.strategy}
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
        message={`Are you sure you want to delete the strategy for "${deleteDialog.strategy?.brand}"? This action cannot be undone.`}
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
              {/* Strategy Overview */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-1 text-blue-600" />
                  Brand & Platforms
                </h4>
                <div className="space-y-2">
                  <p className="text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
                    {strategy.brand_name}
                  </p>
                  {strategy.platforms && (
                    <p className="text-sm text-gray-600">
                      <strong>Platforms:</strong> {strategy.platforms}
                    </p>
                  )}
                </div>
              </div>

              {/* Angles Preview */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Zap className="h-4 w-4 mr-1 text-purple-600" />
                  Content Angles ({strategy.angles?.length || 0})
                </h4>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {strategy.angles && strategy.angles.length > 0 ? (
                    <div className="space-y-2">
                      {strategy.angles.slice(0, 2).map((angle: any, index: number) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium text-gray-900">{index + 1}. {angle.header}</span>
                          {angle.description && (
                            <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                              {truncateText(angle.description, 100)}
                            </p>
                          )}
                        </div>
                      ))}
                      {strategy.angles.length > 2 && (
                        <p className="text-xs text-gray-500 italic">
                          +{strategy.angles.length - 2} more angles...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No angles available</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(strategy.created_at)}</span>
                <span>{strategy.angles?.length || 0} angles</span>
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
              {transformedStrategies.length === 0 ? 'No strategies yet' : 'No strategies match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {transformedStrategies.length === 0 
                ? 'Generate your first content strategy to see it here.'
                : 'Try adjusting your filters to see more strategies.'
              }
            </p>
            {transformedStrategies.length === 0 && (
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