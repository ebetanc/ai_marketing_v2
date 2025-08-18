import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, FileText, Calendar, User, Target, Zap, ChevronDown, ChevronUp, Eye, Clipboard, Share2 } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { IconButton } from '../ui/IconButton'
import { useToast } from '../ui/Toast'
import type { Tables } from '../../lib/supabase'
import { useAsyncCallback } from '../../hooks/useAsync'

type CompanyRow = Tables<'companies'>
type StrategyRow = Tables<'strategies'>
type IdeaRow = Tables<'ideas'>
type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow }

type ContentSource = 'content'

type ModalContent = {
  id: number
  created_at: string
  post: boolean | null
  // body variants used across the app
  content_body?: string | null
  body?: string | null
  body_text?: string | null
  // UI/derived fields
  title?: string | null
  status?: string | null
  platform?: string | null
  type?: string | null
  brand_name?: string | null
  metadata?: Record<string, unknown> | null
  // Relations (when fetched with joins)
  idea?: IdeaJoined
  company?: CompanyRow
  strategy?: StrategyRow
  // Discriminator for source table
  source: ContentSource
  // Optional angles array when already transformed upstream
  angles?: unknown[]
}

interface ViewContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: ModalContent
  strategyId?: string | number
  onPosted?: (updated: ModalContent) => void
  deepLink?: string
  onApproved?: (updated: ModalContent) => void
}

import { supabase } from '../../lib/supabase'
// Helper: safely format a subset of markdown-like text without using innerHTML
const formatContentBody = (content: string) => {
  if (!content) return content

  const renderBoldSegments = (text: string) => {
    // Split on **bold** markers and render <strong> nodes safely
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4
      if (isBold) {
        const inner = part.slice(2, -2)
        return <strong key={i}>{inner}</strong>
      }
      return <React.Fragment key={i}>{part}</React.Fragment>
    })
  }

  return content
    .split('\n')
    .map((line, index) => {
      const trimmed = line.trim()

      // Main headers (# )
      if (trimmed.startsWith('# ')) {
        return (
          <h3 key={index} className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">
            {trimmed.substring(2)}
          </h3>
        )
      }

      // Sub headers (## )
      if (trimmed.startsWith('## ')) {
        return (
          <h4 key={index} className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
            {trimmed.substring(3)}
          </h4>
        )
      }

      // Horizontal rules (---)
      if (trimmed === '---') {
        return <hr key={index} className="my-3 border-gray-200" />
      }

      // Empty lines
      if (trimmed === '') {
        return <div key={index} className="h-2" />
      }

      // Regular paragraphs with safe bold formatting
      return (
        <p key={index} className="text-sm text-gray-700 mb-2 leading-relaxed">
          {renderBoldSegments(line)}
        </p>
      )
    })
}

export function ViewContentModal({ isOpen, onClose, content, strategyId, onPosted, deepLink, onApproved }: ViewContentModalProps) {
  const [expandedAngles, setExpandedAngles] = useState<{ [key: number]: boolean }>({})
  const { call: runPost, loading: posting } = useAsyncCallback(async () => {
    if (!content?.id || !content?.source) return
    console.log('Posting content:', content.id, 'from table:', content.source)
    const { error } = await supabase
      .from(content.source)
      .update({ post: true })
      .eq('id', content.id)

    if (error) {
      console.error('Error posting content:', error)
      push({ message: `Failed to post: ${error.message}`, variant: 'error' })
      return
    }

    console.log('Content posted successfully')
    push({ message: 'Content posted successfully!', variant: 'success' })
    onPosted?.({ ...content, post: true })
    onClose()
  })
  const { call: runApprove, loading: approving } = useAsyncCallback(async () => {
    if (!content?.id || !content?.source) return
    const { error } = await supabase
      .from(content.source)
      .update({ status: 'approved' })
      .eq('id', content.id)

    if (error) {
      push({ message: `Failed to approve: ${error.message}`, variant: 'error' })
      return
    }
    push({ message: 'Content approved', variant: 'success' })
    onApproved?.({ ...content, status: 'approved' })
  })
  const { push } = useToast()

  // Clipboard and share actions as hooks (must be before any early return)
  const { call: copyToClipboard, loading: copyingGeneric } = useAsyncCallback(async (text: string, successMsg: string) => {
    await navigator.clipboard.writeText(text)
    push({ message: successMsg, variant: 'success' })
  })
  const { call: shareCall, loading: sharing } = useAsyncCallback(async () => {
    const shareData = {
      title: content.title || 'Content',
      text: content.title || undefined,
      url: deepLink || undefined
    } as any
    if ((navigator as any).share) {
      await (navigator as any).share(shareData)
    } else {
      if (deepLink) {
        await copyToClipboard(deepLink, 'Link copied')
      } else {
        await copyToClipboard(content.title || 'Untitled', 'Title copied')
      }
    }
  })

  if (!isOpen || !content) return null

  // Helper function to parse and extract angles from content
  const extractAngles = (content: ModalContent) => {
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

  const handlePost = () => { void runPost() }

  const handleApprove = () => { void runApprove() }

  const renderAngleProperty = (key: string, value: unknown) => {
    if (!value) return null

    const displayKey = key.replace(/([A-Z])/g, ' $1').trim()
    const capitalizedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1)

    let displayValue: string
    if (typeof value === 'string') {
      displayValue = value.replace(/^["']|["']$/g, '').trim()
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      displayValue = String(value)
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value, null, 2)
    } else {
      displayValue = ''
    }

    return (
      <div key={key}>
        <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <FileText className="h-4 w-4 mr-1 text-brand-600" />
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
  const renderAngleContent = (angle: Record<string, unknown>, index: number) => {
    const isExpanded = expandedAngles[index]

    // Get angle title/header
    const angleTitle = (angle as any).header || (angle as any).title || (angle as any).topic || `Content Angle ${index + 1}`

    // Get main content preview
    const getPreviewContent = () => {
      if (angle.description) {
        const desc = typeof (angle as any).description === 'string'
          ? (angle as any).description.replace(/^["']|["']$/g, '').trim()
          : JSON.stringify((angle as any).description)
        return desc.length > 150 ? desc.substring(0, 150) + '...' : desc
      }
      if (angle.content) {
        const c = typeof (angle as any).content === 'string'
          ? (angle as any).content.replace(/^["']|["']$/g, '').trim()
          : JSON.stringify((angle as any).content)
        return c.length > 150 ? c.substring(0, 150) + '...' : c
      }
      return 'Click to view angle details...'
    }

    return (
      <Card key={index} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                <span className="text-brand-600 font-semibold text-sm">{index + 1}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-base">
                  {angleTitle}
                </h4>
                {Boolean((angle as any).platform) && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {String((angle as any).platform)}
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
                .map(key => renderAngleProperty(key, (angle as any)[key]))}
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const titleId = 'view-content-title'

  const handleCopyTitle = () => { void copyToClipboard(content.title || 'Untitled', 'Title copied') }

  const handleCopyBody = () => {
    const text = String(content.body_text || content.body || '')
    if (!text) {
      push({ message: 'No body to copy', variant: 'warning' })
      return
    }
    void copyToClipboard(text, 'Content copied')
  }



  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledById={titleId} size="lg">
      <div className="w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold text-gray-900">{content.title}</h2>
              <p className="text-sm text-gray-500">
                {content.brand_name || 'Unknown brand'} • {content.type?.replace('_', ' ') || 'Content'}
              </p>
            </div>
          </div>

          <IconButton onClick={onClose} aria-label="Close dialog" variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-brand-600" />
                Content info
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

                {typeof (content.metadata as any)?.word_count === 'number' && (
                  <div>
                    <p className="text-sm font-medium text-gray-900">Word count</p>
                    <p className="text-gray-700">{String((content.metadata as any).word_count)} words</p>
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
                    Content angles ({angles.length})
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={expandAllAngles}
                      className="text-xs"
                    >
                      Expand all
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={collapseAllAngles}
                      className="text-xs"
                    >
                      Collapse all
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
                  Content body
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="text-sm">
                    {formatContentBody(content.body_text || content.body || 'No content')}
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
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleCopyTitle}>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy title
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopyBody}>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy body
            </Button>
            <Button variant="outline" size="sm" onClick={() => deepLink ? void copyToClipboard(deepLink, 'Link copied') : push({ message: 'No link available', variant: 'warning' })} disabled={copyingGeneric}>
              <Share2 className="h-4 w-4 mr-2" />
              Copy link
            </Button>
            <Button variant="outline" size="sm" onClick={() => void shareCall()} disabled={sharing}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <div className="flex space-x-3">
            {content.status !== 'approved' && (
              <Button
                variant="outline"
                onClick={handleApprove}
                loading={approving}
                disabled={approving}
              >
                {approving ? 'Approving…' : 'Approve'}
              </Button>
            )}
            <Button
              onClick={handlePost}
              loading={posting}
              disabled={posting}
              variant="primary"
            >
              {posting ? 'Posting…' : 'Post'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={posting}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
