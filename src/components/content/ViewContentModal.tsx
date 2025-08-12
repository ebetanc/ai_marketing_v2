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
  if (!isOpen || !content) return null

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

          {/* Content Body */}
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
