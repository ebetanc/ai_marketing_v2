import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Building2, Home, MapPin as _MapPin, TrendingUp, Users as _Users, FileText, X, Link, Sparkles, RefreshCw, ExternalLink, Calendar } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import { postToN8n } from '../lib/n8n'
import { useToast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAsyncCallback } from '../hooks/useAsync'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'

interface RealEstateContent {
  id: number
  created_at: string
  link_origin: string | null
  link_final: string | null
}

export function RealEstateContent() {
  useDocumentTitle('Real estate — AI Marketing')
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [url, setUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [realEstateData, setRealEstateData] = useState<RealEstateContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    content: RealEstateContent | null
    loading: boolean
  }>({
    isOpen: false,
    content: null,
    loading: false
  })
  const { push } = useToast()

  const handleDeleteClick = (content: RealEstateContent) => {
    setDeleteDialog({ isOpen: true, content, loading: false })
  }

  const { call: deleteConfirmCall } = useAsyncCallback(async () => {
    if (!deleteDialog.content) return
    const { error } = await supabase
      .from('real_estate_content')
      .delete()
      .eq('id', deleteDialog.content.id)
    if (error) throw error
    setRealEstateData(prev => prev.filter(item => item.id !== deleteDialog.content!.id))
  })
  const handleDeleteConfirm = async () => {
    if (!deleteDialog.content) return
    setDeleteDialog(prev => ({ ...prev, loading: true }))
    try {
      const res = await deleteConfirmCall()
      if (res && 'error' in res && res.error) throw res.error
      setDeleteDialog({ isOpen: false, content: null, loading: false })
    } catch (error) {
      console.error('Error deleting real estate content:', error)
      push({ title: 'Delete failed', message: 'Try again.', variant: 'error' })
      setDeleteDialog(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, content: null, loading: false })
  }

  const fetchRealEstateContent = useCallback(async (showToast = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching real estate content from Supabase...')

      const { data: userRes } = await supabase.auth.getUser()
      const userId = userRes.user?.id
      let q = supabase
        .from('real_estate_content')
        .select('*')
        .order('created_at', { ascending: false })
      if (userId) q = q.eq('owner_id', userId)
      const { data, error } = await q

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Real estate content fetched successfully:', data?.length || 0, 'records')
      setRealEstateData(data || [])
      if (showToast) {
        push({ title: 'Refreshed', message: 'Real estate content updated', variant: 'success' })
      }
    } catch (error) {
      console.error('Error fetching real estate content from Supabase:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch real estate content')
      setRealEstateData([])
      if (showToast) {
        push({ title: 'Refresh failed', message: 'Could not update content', variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    fetchRealEstateContent()
  }, [fetchRealEstateContent])

  const { call: generateContentCall } = useAsyncCallback(async () => {
    if (!url.trim()) {
      push({ title: 'Missing URL', message: 'Please enter a URL', variant: 'warning' })
      return
    }
    const trimmed = url.trim()
    const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    console.log('Sending URL to n8n webhook:', normalizedUrl)
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id
    const response = await postToN8n('content_saas', {
      operation: 'real_estate_ingest',
      url: normalizedUrl,
      user_id: userId,
      meta: { user_id: userId, source: 'app', ts: new Date().toISOString() },
    }, { path: '1776dcc3-2b3e-4cfa-abfd-0ad9cabaf6ea' })
    console.log('Webhook response status:', response.status)
    if (!response.ok) throw new Error(`Webhook request failed with status: ${response.status}`)
    const result = await response.text()
    console.log('Webhook response:', result)
    push({ title: 'Generation started', message: 'Check back in a few minutes', variant: 'success' })
    setShowUrlModal(false)
    setUrl('')
    setTimeout(() => { fetchRealEstateContent() }, 2000)
  })
  const handleGenerateContent = async () => {
    setIsGenerating(true)
    try {
      const res = await generateContentCall()
      if (res && 'error' in res && res.error) throw res.error
    } catch (error) {
      console.error('Error generating content:', error)
      if (error instanceof Error) {
        push({ title: 'Generation failed', message: `${error.message || 'Please try again.'}`, variant: 'error' })
      } else {
        push({ title: 'Generation failed', message: 'Please try again', variant: 'error' })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCloseModal = () => {
    setShowUrlModal(false)
    setUrl('')
    setIsGenerating(false)
  }

  // --- Drag & Drop URL Support ---
  const extractFirstUrl = (text: string): string | null => {
    if (!text) return null
    // Basic URL regex (protocol optional)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/i
    const match = text.match(urlRegex)
    return match ? match[0] : null
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true)
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!isDragging) setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    // Only reset if leaving the drop area (relatedTarget null may indicate leaving window)
    if ((e.target as HTMLElement).id === 'realestate-dropzone') {
      setIsDragging(false)
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false)
    try {
      const dt = e.dataTransfer
      let droppedText = ''
      // Prioritize text/uri-list
      if (dt.getData('text/uri-list')) {
        droppedText = dt.getData('text/uri-list')
      } else if (dt.getData('text/plain')) {
        droppedText = dt.getData('text/plain')
      }
      // If files present, try reading first small text file (synchronously reading not possible; skip for now)
      const first = extractFirstUrl(droppedText)
      if (first) {
        setUrl(first)
        push({ title: 'URL captured', message: 'Dropped URL ready to generate.', variant: 'success' })
      } else {
        push({ title: 'No URL found', message: 'Drop a valid URL (starting with http/https).', variant: 'warning' })
      }
    } catch (err) {
      console.error('Drop handling failed', err)
      push({ title: 'Drop failed', message: 'Could not read dropped data.', variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Real estate content"
        description="Generate content for real estate pros."
        icon={<Building2 className="h-5 w-5" />}
        actions={(
          <>
            <Button onClick={() => fetchRealEstateContent(true)} loading={loading} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setShowUrlModal(true)}>
              <Building2 className="h-4 w-4" />
              Generate content
            </Button>
          </>
        )}
      />

      {/* URL Input Modal (shared) */}
      <Modal isOpen={showUrlModal} onClose={handleCloseModal} labelledById="realestate-url-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <Link className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="realestate-url-title" className="text-lg font-bold text-gray-900">Enter property URL</h2>
              <p className="text-sm text-gray-500">We’ll analyze it and generate content.</p>
            </div>
          </div>

          <IconButton onClick={handleCloseModal} aria-label="Close dialog" disabled={isGenerating} variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
          <div
            id="realestate-dropzone"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 rounded-xl p-4 transition-colors ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-dashed border-gray-300'}`}
            aria-label="Drag and drop a URL here or use the input field"
            role="group"
            tabIndex={0}
          >
            <div className="space-y-3">
              <Input
                label="Property URL"
                placeholder="https://example.com/property-listing"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isGenerating}
              />
              <div className="text-xs text-gray-500">
                <strong>Drag & Drop:</strong> Drop a link from another tab or app. We’ll grab the first URL we find.
              </div>
            </div>
            {isDragging && (
              <div className="absolute inset-0 rounded-xl bg-brand-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                <span className="text-sm font-medium text-brand-700">Release to capture URL</span>
              </div>
            )}
          </div>

          <div className="bg-brand-50 rounded-lg p-3 border border-brand-200">
            <p className="text-sm text-brand-800">
              <strong>Tip:</strong> Use a listing or real estate page URL.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCloseModal}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateContent}
            loading={isGenerating}
            disabled={!url.trim() || isGenerating}
            variant="primary"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Generating…' : 'Generate content'}
          </Button>
        </div>
      </Modal>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorState
          icon={<Building2 className="h-12 w-12 text-red-500" />}
          title="Error loading content"
          error={error}
          retry={<Button onClick={() => fetchRealEstateContent(true)} variant="outline" loading={loading} disabled={loading}>Try again</Button>}
        />
      )}

      {/* Real Estate Content Grid */}
      {!loading && !error && realEstateData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {realEstateData.map((content) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold leading-tight">
                        Real Estate Content #{content.id}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(content.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <IconButton
                    onClick={() => handleDeleteClick(content)}
                    variant="danger"
                    title="Delete content"
                    aria-label={`Delete content ${content.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Origin Link */}
                {content.link_origin && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Link aria-hidden className="h-4 w-4 mr-1 text-brand-600" />
                      Origin Link
                    </h4>
                    <div className="bg-brand-50 rounded-lg p-3 border border-brand-100">
                      <a
                        href={content.link_origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 hover:text-brand-900 text-sm break-all flex items-center"
                      >
                        <ExternalLink aria-hidden className="h-3 w-3 mr-1 flex-shrink-0" />
                        {content.link_origin}
                      </a>
                    </div>
                  </div>
                )}

                {/* Final Link */}
                {content.link_final && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <FileText aria-hidden className="h-4 w-4 mr-1 text-green-600" />
                      Final Link
                    </h4>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <a
                        href={content.link_final}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:text-green-900 text-sm break-all flex items-center"
                      >
                        <ExternalLink aria-hidden className="h-3 w-3 mr-1 flex-shrink-0" />
                        {content.link_final}
                      </a>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex justify-between items-center pt-2">
                  <Badge
                    variant={content.link_final ? 'success' : 'warning'}
                    className="text-xs"
                  >
                    {content.link_final ? 'Processed' : 'Processing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && realEstateData.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-white" />}
          title="No content"
          message={(
            <div>
              <p className="mb-8">Generate your first piece with a property URL.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Home className="h-6 w-6 text-brand-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Property analysis</h4>
                  <p className="text-sm text-gray-600">We extract key info from property URLs</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Content generation</h4>
                  <p className="text-sm text-gray-600">We create targeted real estate content</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Ready to use</h4>
                  <p className="text-sm text-gray-600">Use it in your campaigns</p>
                </div>
              </div>
            </div>
          )}
          variant="green"
          actions={<Button onClick={() => setShowUrlModal(true)} size="lg"><Building2 className="h-4 w-4" />Generate your first content</Button>}
        />
      )}

      {/* Delete Confirmation Dialog (shared) */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen && !!deleteDialog.content}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete content"
        message={`Delete Real estate content #${deleteDialog.content?.id}? This can’t be undone.`}
        confirmText={deleteDialog.loading ? 'Deleting…' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </div>
  )
}
