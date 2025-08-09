import React from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, Building2, Globe, Target, Zap, Calendar, User } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface ViewCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  company: any
}

export function ViewCompanyModal({ isOpen, onClose, company }: ViewCompanyModalProps) {
  if (!isOpen || !company) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500">Company Details</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {/* Basic Information */}
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
                <p className="text-gray-700">{company.name}</p>
              </div>
              
              {company.website && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Website</p>
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
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
                  {formatDate(company.created_at || company.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Brand Voice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                Brand Voice & Tone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Brand Tone</p>
                <p className="text-gray-700 leading-relaxed">{company.brand_voice?.tone || company.brandTone || 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-900">Key Offer / Style</p>
                <p className="text-gray-700 leading-relaxed">{company.brand_voice?.style || company.keyOffer || 'Not specified'}</p>
              </div>
              
              {company.brand_voice?.keywords && company.brand_voice.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {company.brand_voice.keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Target className="h-5 w-5 mr-2 text-teal-600" />
                Target Audience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Demographics</p>
                <p className="text-gray-700 leading-relaxed">
                  {company.target_audience?.demographics || company.targetAudience || 'Not specified'}
                </p>
              </div>
              
              {company.target_audience?.interests && company.target_audience.interests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {company.target_audience.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {company.target_audience?.pain_points && company.target_audience.pain_points.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Pain Points</p>
                  <div className="flex flex-wrap gap-2">
                    {company.target_audience.pain_points.map((point, index) => (
                      <Badge key={index} variant="warning">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          {company.additionalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {company.additionalInfo}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Image Guidelines */}
          {company.imageGuidelines && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Target className="h-5 w-5 mr-2 text-orange-600" />
                  Image Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {company.imageGuidelines}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}