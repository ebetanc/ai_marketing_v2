import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, FileText, Calendar, User, Target, Zap, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { formatDate } from '../../lib/utils'

interface ViewContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: any
  strategyId?: string
}

// Helper function to format markdown-like text
const formatContentBody = (content: string) => {
  if (!content) return content

  return content
    .split('\n')
    .map((line, index) => {
      // Main headers (# )
      if (line.startsWith('# ')) {
        return (
          <h3 key={index} className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">
            {line.substring(2)}
          </h3>
        )
      }
      
      // Sub headers (## )
      if (line.startsWith('## ')) {
        return (
          <h4 key={index} className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
            {line.substring(3)}
          </h4>
        )
      }
      
      // Horizontal rules (---)
      if (line.trim() === '---') {
        return <hr key={index} className="my-3 border-gray-200" />
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2" />
      }
      
      // Regular paragraphs with bold text formatting
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      return (
        <p 
          key={index} 
          className="text-sm text-gray-700 mb-2 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      )
    })
}

export function ViewContentModal({ isOpen, onClose, content, strategyId }: ViewContentModalProps) {
  const [expandedAngles, setExpandedAngles] = useState<{ [key: number]: boolean }>({})

  if (!isOpen || !content) return null

  // Helper function to parse and extract angles from content
  const extractAngles = (content: any) => {
    // If content already has angles array (from Supabase transformation)
    if (content?.angles && Array.isArray(content.angles)) {
      return content.angles
    }

    let parsedContent = null
    try {
      if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
        parsedContent = JSON.parse(content.body)
      }
    } catch (error) {
      console.error('Error parsing content body:', error)
      return []
    }

    if (parsedContent) {
      // If it's an array, return it directly
      if (Array.isArray(parsedContent)) {
        return parsedContent
      }

      // If it has an angles property
      if (parsedContent.angles && Array.isArray(parsedContent.angles)) {
        return parsedContent.angles
      }

      // If it's a single object, wrap it in an array
      if (typeof parsedContent === 'object') {
        return [parsedContent]
      }
    }

    return []
  }

  const angles = extractAngles(content)
  const hasAngles = angles.length > 0

  const toggleAngleExpansion = (index: number) => {
    setExpandedAngles(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  const expandAllAngles = () => {
    const newExpandedState: { [key: number]: boolean } = {}
    angles.forEach((_: unknown, index: number) => {
      newExpandedState[index] = true
    })
    setExpandedAngles(newExpandedState)
  }

  const collapseAllAngles = () => {
    setExpandedAngles({})
  }

  const renderAngleProperty = (key: string, value: any) => {
    if (!value) return null

    const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
    const capitalizedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1)

    let displayValue = value
    if (typeof value === 'string') {
      displayValue = value.replace(/^["']|["']$/g, '').trim()
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value, null, 2)
    }

    return (
      <div key={key}>
        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-1 text-blue-600" />
          {capitalizedKey}
        </h5>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayValue}
          </p>
        </div>
      </div>
    )
  }
  const renderAngleContent = (angle: any, index: number) => {
    const isExpanded = expandedAngles[index]

    // Get angle title/header
    const angleTitle = angle.header || angle.title || angle.topic || `Content Angle ${index + 1}`

    // Get main content preview
    const getPreviewContent = () => {
      if (angle.description) {
        const desc = typeof angle.description === 'string'
          ? angle.description.replace(/^["']|["']$/g, '').trim()
          : JSON.stringify(angle.description)
        return desc.length > 150 ? desc.substring(0, 150) + '...' : desc
      }
      if (angle.content) {
        const content = typeof angle.content === 'string'
          ? angle.content.replace(/^["']|["']$/g, '').trim()
          : JSON.stringify(angle.content)
        return content.length > 150 ? content.substring(0, 150) + '...' : content
      }
      return 'Click to view angle details...'
    }

    return (
      <Card key={index} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-base">
                  {angleTitle}
                </h4>
                {angle.platform && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {angle.platform}
                  </Badge>
                )}
                {!isExpanded && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {getPreviewContent()}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAngleExpansion(index)}
              className="flex items-center space-x-1"
            >
              <Eye className="h-3 w-3" />
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Render all angle properties dynamically */}
              {Object.keys(angle)
                .filter(key => !['header', 'title', 'topic', 'platform'].includes(key))
                .map(key => renderAngleProperty(key, angle[key]))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
              <p className="text-sm text-gray-500">
                {content.brand_name || 'Unknown Brand'} • {content.type?.replace('_', ' ') || 'Content'}
              </p>
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
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Content Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status</p>
                  <Badge variant={content.status === 'approved' ? 'success' : 'warning'}>
                    {content.status || 'draft'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Type</p>
                  <p className="text-gray-700 capitalize">{content.type?.replace('_', ' ') || 'Content'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(content.created_at)}
                  </p>
                </div>

                {content.metadata?.word_count && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Word Count</p>
                    <p className="text-gray-700">{content.metadata.word_count} words</p>
                  </div>
                )}
              </div>

              {strategyId && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Strategy ID</p>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {strategyId}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Angles Section */}
          {hasAngles ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    Content Angles ({angles.length})
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={expandAllAngles}
                      className="text-xs"
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={collapseAllAngles}
                      className="text-xs"
                    >
                      Collapse All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {angles.map((angle: any, index: number) => renderAngleContent(angle, index))}
              </CardContent>
            </Card>
          ) : (
            /* Raw Content */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="h-5 w-5 mr-2 text-green-600" />
                  Content Body
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm">
                    {formatContentBody(content.body_text || content.body || 'No content available')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {content.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(content.metadata, null, 2)}
                  </pre>
                </div>
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
