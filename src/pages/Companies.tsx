import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CreateBrandModal } from '../components/companies/CreateBrandModal'
import { ViewCompanyModal } from '../components/companies/ViewCompanyModal'
import { supabase } from '../lib/supabase'
import { 
  Plus, 
  Building2, 
  Users, 
  Calendar,
  Eye,
  MoreVertical,
  Target,
  Zap,
  Trash2,
  RefreshCw,
  Database,
  FileText
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'

export function Companies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewCompanyModal, setViewCompanyModal] = useState<{ isOpen: boolean; company: any }>({
    isOpen: false,
    company: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; company: any; loading: boolean }>({
    isOpen: false,
    company: null,
    loading: false
  })

  React.useEffect(() => {
    fetchCompaniesFromSupabase()
  }, [])

  const fetchCompaniesFromSupabase = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching companies from Supabase companies table...')
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Companies fetched successfully:', data?.length || 0, 'records')
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch companies'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBrand = async () => {
    setShowCreateModal(false)
    // Refresh companies list after creation
    await fetchCompaniesFromSupabase()
  }

  const handleViewClick = (company: any) => {
    setViewCompanyModal({
      isOpen: true,
      company
    })
  }

  const handleCloseViewModal = () => {
    setViewCompanyModal({
      isOpen: false,
      company: null
    })
  }

  const handleDeleteClick = (company: any) => {
    setDeleteDialog({
      isOpen: true,
      company,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.company) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', deleteDialog.company.id)
      
      if (error) {
        alert(error.message)
      } else {
        // Close dialog and refresh
        setDeleteDialog({ isOpen: false, company: null, loading: false })
        await fetchCompaniesFromSupabase()
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Failed to delete company. Please try again.')
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, company: null, loading: false })
  }

  // Group companies by brand name for better organization
  const companiesByBrand = companies.reduce((acc, company) => {
    const brandName = company.brand_name || 'Unknown Brand'
    if (!acc[brandName]) {
      acc[brandName] = []
    }
    acc[brandName].push(company)
    return acc
  }, {} as Record<string, any[]>)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">
            Manage your client companies and their brand profiles.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={fetchCompaniesFromSupabase} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBrand}
        loading={false}
        createCompany={() => Promise.resolve({ data: null, error: null })}
        refetchCompanies={fetchCompaniesFromSupabase}
      />

      {/* View Company Modal */}
      <ViewCompanyModal
        isOpen={viewCompanyModal.isOpen}
        onClose={handleCloseViewModal}
        company={viewCompanyModal.company}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteDialog.company?.name}"? This action cannot be undone and will remove all associated content and data.`}
        confirmText="Delete Company"
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />



      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading companies...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Companies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCompaniesFromSupabase} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Companies Table */}
      {!loading && !error && companies.length > 0 && (
        <div className="space-y-12">
          {Object.entries(companiesByBrand).map(([brandName, brandCompanies]) => (
            <div key={brandName} className="space-y-6">
              {/* Brand Header */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{brandName}</CardTitle>
                      <p className="text-blue-600 font-medium">{brandCompanies.length} compan{brandCompanies.length === 1 ? 'y' : 'ies'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="primary" className="text-lg px-6 py-3 font-semibold">
                      {brandCompanies.length} Total
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Company Cards for this Brand */}
              <div className="space-y-8">
                {brandCompanies.map((company) => (
                  <Card key={company.id} className="border-l-4 border-l-blue-500 shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{company.name}</CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(company.created_at)}
                              </span>
                              {company.website && (
                                <span className="font-medium">{company.website}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleDeleteClick(company)}
                            className="p-1 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Delete company"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Brand Tone */}
                        {company.brand_tone && (
                          <Card className="bg-white border border-gray-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                                Brand Tone
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                {truncateText(company.brand_tone, 100)}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Target Audience */}
                        {company.target_audience && (
                          <Card className="bg-white border border-gray-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                                <Target className="h-4 w-4 mr-2 text-teal-600" />
                                Target Audience
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                {truncateText(company.target_audience, 100)}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Key Offer */}
                        {company.key_offer && (
                          <Card className="bg-white border border-gray-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-green-600" />
                                Key Offer
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                {truncateText(company.key_offer, 100)}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Additional Information */}
                        {company.additional_information && (
                          <Card className="bg-white border border-gray-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                                Additional Info
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                {truncateText(company.additional_information, 100)}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      <div className="mt-4 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewClick(company)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && companies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-500 mb-6">
              The companies table in your Supabase database is empty.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}