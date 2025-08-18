import React, { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CreateBrandModal } from '../components/companies/CreateBrandModal'
import { ViewCompanyModal } from '../components/companies/ViewCompanyModal'
import { useCompanies } from '../hooks/useCompanies'
import {
  Plus,
  Building2,
  Calendar,
  Eye,
  Target,
  RefreshCw,
  Database,
  FileText
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { useToast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Companies() {
  useDocumentTitle('Companies — AI Marketing')
  const { companies: hookCompanies, loading, error, refetch } = useCompanies()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewCompanyModal, setViewCompanyModal] = useState<{ isOpen: boolean; company: any | null }>({
    isOpen: false,
    company: null
  })
  const { push } = useToast()
  const companies = hookCompanies

  const fetchCompaniesFromSupabase = useCallback(async (showToast = false) => {
    refetch()
    if (showToast) {
      push({ title: 'Refreshed', message: 'Companies updated', variant: 'success' })
    }
  }, [refetch, push])

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

  // const handleDeleteClick = (company: any) => {
  //   setDeleteDialog({
  //     isOpen: true,
  //     company,
  //     loading: false
  //   })
  // }

  // Deletion is handled inside ViewCompanyModal with its own ConfirmDialog

  // Group companies by brand name for better organization
  // const companiesByBrand = companies.reduce((acc, company) => {
  //   const brandName = company.brand_name || 'Unknown Brand'
  //   if (!acc[brandName]) {
  //     acc[brandName] = []
  //   }
  //   acc[brandName].push(company)
  //   return acc
  // }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-gray-600">Manage brands and profiles.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => fetchCompaniesFromSupabase(true)} loading={loading} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Add company
          </Button>
        </div>
      </div>

      {/* Create Brand Modal */}
      <CreateBrandModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBrand}
        refetchCompanies={fetchCompaniesFromSupabase}
      />

      {/* View Company Modal */}
      <ViewCompanyModal
        isOpen={viewCompanyModal.isOpen}
        onClose={handleCloseViewModal}
        company={viewCompanyModal.company}
        onDelete={fetchCompaniesFromSupabase}
      />

      {/* Delete Confirmation handled by ViewCompanyModal */}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading companies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchCompaniesFromSupabase(true)} variant="outline" loading={loading} disabled={loading}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Companies Table */}
      {!loading && !error && companies.length > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Card key={company.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold leading-tight">{company.brand_name || company.name}</CardTitle>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(company.created_at)}
                          </span>
                          {company.website && (
                            <span className="text-blue-600 truncate">
                              {company.website.replace(/^https?:\/\//, '')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Company Summary */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {company.brand_tone
                          ? truncateText(company.brand_tone, 150)
                          : company.brand_voice?.tone
                            ? truncateText(company.brand_voice.tone, 150)
                            : 'No brand description available'}
                      </p>
                    </div>

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-1">
                      {company.target_audience && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Target className="h-2.5 w-2.5 mr-1" />
                          Target Audience Defined
                        </span>
                      )}
                      {(company.key_offer || company.brand_voice?.style) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Building2 className="h-2.5 w-2.5 mr-1" />
                          Key Offer Defined
                        </span>
                      )}
                      {company.additional_information && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <FileText className="h-2.5 w-2.5 mr-1" />
                          Additional info
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewClick(company)}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && companies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies</h3>
            <p className="text-gray-500 mb-6">
              No companies yet.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Add company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
