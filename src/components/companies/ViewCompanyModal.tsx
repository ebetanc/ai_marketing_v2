import React from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, Building2, Globe, Target, Zap, Calendar, User, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'

interface ViewCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company: any
  onDelete?: () => void
}

export function ViewCompanyModal({ isOpen, onClose, company, onDelete }: ViewCompanyModalProps) {
  const [deleting, setDeleting] = React.useState(false)

  if (!isOpen || !company) return null

  const handleDelete = async () => {
    if (!company?.id) return

    const confirmed = window.confirm(`Are you sure you want to delete "${company.brand_name}"? This action cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id)

      if (error) {
        alert(`Failed to delete company: ${error.message}`)
        return
      }

      alert('Company deleted successfully!')
      onDelete?.()
      onClose()
    } catch (error) {
      alert('Failed to delete company. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{company.brand_name}</h2>
              <p className="text-sm text-gray-500">Company Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Company Name</p>
                <p className="text-gray-700">{company.brand_name}</p>
              </div>

              {company.website && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Website</p>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <Globe className="h-4 w-4 mr-1" />
                    {company.website}
                  </a>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {formatDate(company.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>

          {company.brand_tone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  Brand Tone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.brand_tone}</p>
              </CardContent>
            </Card>
          )}

          {company.target_audience && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-teal-600" />
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.target_audience}</p>
              </CardContent>
            </Card>
          )}

          {company.key_offer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Key Offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.key_offer}</p>
              </CardContent>
            </Card>
          )}

          {company.additional_information && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {company.additional_information}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDelete}
              loading={deleting}
              disabled={deleting}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Company'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={deleting}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}