import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CreateBrandModal } from '../components/companies/CreateBrandModal'
import { ViewCompanyModal } from '../components/companies/ViewCompanyModal'
import { 
  Plus, 
  Building2, 
  Users, 
  Calendar,
  Eye,
  MoreVertical,
  Target,
  Zap,
  Trash2
} from 'lucide-react'
import { useCompanies } from '../hooks/useCompanies'
import { useContentPieces } from '../hooks/useContentPieces'
import { formatDate, truncateText } from '../lib/utils'
import type { Company } from '../lib/supabase'

export function Companies() {
  const { companies, createCompany, deleteCompany, refetch } = useCompanies()
  const { contentPieces } = useContentPieces()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewCompanyModal, setViewCompanyModal] = useState<{
    isOpen: boolean
    company: Company | null
  }>({
    isOpen: false,
    company: null
  })
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    company: Company | null
    loading: boolean
  }>({
    isOpen: false,
    company: null,
    loading: false
  })

  const handleCreateBrand = async () => {
    setShowCreateModal(false)
    // The companies list will automatically update due to React state
  }

  const handleViewClick = (company: Company) => {
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

  const handleDeleteClick = (company: Company) => {
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
      const result = await deleteCompany(deleteDialog.company.id)
      
      if (result.error) {
        alert(result.error)
      } else {
        // Close dialog and refresh
        setDeleteDialog({ isOpen: false, company: null, loading: false })
        refetch()
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
  const getCompanyStats = (companyId: string) => {
    const companyContent = contentPieces.filter(c => c.company_id === companyId)
    return {
      totalContent: companyContent.length,
      approvedContent: companyContent.filter(c => c.status === 'approved').length,
      draftContent: companyContent.filter(c => c.status === 'draft').length
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">
            Manage your client companies and their brand profiles.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBrand}
        loading={false}
        createCompany={createCompany}
        refetchCompanies={refetch}
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
      {/* Companies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {companies.map((company) => {
          const stats = getCompanyStats(company.id)
          return (
            <Card key={company.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg">{company.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {formatDate(company.created_at)}
                      </p>
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
              
              <CardContent className="space-y-4">
                {/* Brand Voice */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-blue-600" />
                    Brand Voice
                  </h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{truncateText(company.brand_voice.tone, 80)}</p>
                  <div className="flex flex-wrap gap-1">
                    {company.brand_voice.keywords.slice(0, 3).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {company.brand_voice.keywords.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{company.brand_voice.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-1 text-teal-600" />
                    Target Audience
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{truncateText(company.target_audience.demographics, 80)}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-gray-900">{stats.totalContent}</p>
                    <p className="text-xs text-gray-500">Total Content</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-green-600">{stats.approvedContent}</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base sm:text-lg font-bold text-yellow-600">{stats.draftContent}</p>
                    <p className="text-xs text-gray-500">Drafts</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleViewClick(company)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {companies.length === 0 && !showCreateModal && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first company profile to start generating targeted content.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}