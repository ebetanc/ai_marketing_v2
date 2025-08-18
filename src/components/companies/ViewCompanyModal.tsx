import React from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, Building2, Globe, Target, Zap, Calendar, User, Trash2 } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { IconButton } from '../ui/IconButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'
import type { CompanyUI } from '../../hooks/useCompanies'
import { useAsyncCallback } from '../../hooks/useAsync'

interface ViewCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company: CompanyUI | null
  onDelete?: () => void
}

export function ViewCompanyModal({ isOpen, onClose, company, onDelete }: ViewCompanyModalProps) {
  const { call: runDelete, loading: deleting } = useAsyncCallback(async () => {
    if (!company?.id) return
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', company.id)

    if (error) {
      console.error('Error deleting company:', error)
      push({ title: 'Delete failed', message: `Failed to delete company: ${error.message}`, variant: 'error' })
      return
    }

    onDelete?.()
    push({ title: 'Deleted', message: 'Company removed', variant: 'success' })
    onClose()
  })
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const { push } = useToast()

  if (!isOpen || !company) return null

  const handleDelete = () => { void runDelete() }

  const titleId = 'view-company-title'

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledById={titleId} size="md">
      <div className="w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500">Company details</p>
            </div>
          </div>

          <IconButton
            onClick={onClose}
            aria-label="Close dialog"
            variant="ghost"
          >
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building2 className="h-5 w-5 mr-2 text-brand-600" />
                Basics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Company name</p>
                <p className="text-gray-700">{company.brand_name || company.name}</p>
              </div>

              {company.website && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Website</p>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-800 flex items-center"
                  >
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

          {/* Brand Tone */}
          {company.brand_tone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                  Brand tone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.brand_tone}</p>
              </CardContent>
            </Card>
          )}

          {/* Target Audience (string) */}
          {company.target_audience && typeof company.target_audience === 'string' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-teal-600" />
                  Target audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.target_audience}</p>
              </CardContent>
            </Card>
          )}

          {/* Key Offer */}
          {company.key_offer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Key offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{company.key_offer}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {company.additional_information && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Additional info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {company.additional_information}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legacy Brand Voice Support */}
          {company.brand_voice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-orange-600" />
                  Brand voice & tone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Brand tone</p>
                  <p className="text-gray-700 leading-relaxed">{company.brand_voice?.tone || company.brand_tone || 'Not specified'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Key offer / style</p>
                  <p className="text-gray-700 leading-relaxed">{company.brand_voice?.style || company.key_offer || 'Not specified'}</p>
                </div>

                {company.brand_voice?.keywords && company.brand_voice.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {company.brand_voice.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Target Audience (normalized object) - reserved for future structured field */}
          {false && !!company && company!.target_audience && typeof company!.target_audience === 'object' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-pink-600" />
                  Target audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Demographics</p>
                  <p className="text-gray-700 leading-relaxed">
                    {(company!.target_audience as any)?.demographics || 'Not specified'}
                  </p>
                </div>

                {(company!.target_audience as any)?.interests && (company!.target_audience as any).interests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {(company!.target_audience as any).interests.map((interest: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(company!.target_audience as any)?.pain_points && (company!.target_audience as any).pain_points.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Pain points</p>
                    <div className="flex flex-wrap gap-2">
                      {(company!.target_audience as any).pain_points.map((point: string, index: number) => (
                        <Badge key={index} variant="warning">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legacy Additional Information Support */}
          {false && (company as any).additionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Additional info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {(company as any).additionalInfo}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legacy Image Guidelines Support */}
          {false && (company as any).imageGuidelines && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-orange-600" />
                  Image guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {(company as any).imageGuidelines}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-3">
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              loading={deleting}
              disabled={deleting}
              className=""
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting…' : 'Delete company'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={deleting}>
              Close
            </Button>
          </div>
        </div>
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            handleDelete()
          }}
          title="Delete company"
          message={`Delete "${company.brand_name || company.name}"? This can’t be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
        />
      </div>
    </Modal>
  )
}
