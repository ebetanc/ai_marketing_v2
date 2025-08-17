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
import { useToast } from '../components/ui/Toast'
import { Skeleton } from '../components/ui/Skeleton'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

interface RealEstateContent {
  id: number
  created_at: string
  link_origin: string | null
  link_final: string | null
}

export function RealEstateContent() {
  useDocumentTitle('Real Estate Agent — AI Marketing')
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [url, setUrl] = useState('')
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

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.content) return

    setDeleteDialog(prev => ({ ...prev, loading: true }))

    try {
      const { error } = await supabase
        .from('real_estate_content')
        .delete()
        .eq('id', deleteDialog.content.id)

      if (error) throw error

      // Remove from local state
      setRealEstateData(prev => prev.filter(item => item.id !== deleteDialog.content!.id))

      // Close dialog
      setDeleteDialog({ isOpen: false, content: null, loading: false })
    } catch (error) {
      console.error('Error deleting real estate content:', error)
      push({ title: 'Delete failed', message: 'Please try again', variant: 'error' })
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

  const handleGenerateContent = async () => {
    if (!url.trim()) {
      push({ title: 'Missing URL', message: 'Please enter a URL', variant: 'warning' })
      return
    }

    setIsGenerating(true)

    try {
      console.log('Sending URL to webhook:', url)

      const webhookUrl = 'https://n8n.srv856940.hstgr.cloud/webhook/1776dcc3-2b3e-4cfa-abfd-0ad9cabaf6ea'

      // Include user id so the webhook can associate the created records to this user
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user.id

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'content_saas',
          operation: 'real_estate_ingest',
          url: url.trim(),
          user_id: userId,
          meta: { user_id: userId, source: 'app', ts: new Date().toISOString() },
        })
      })

      console.log('Webhook response status:', response.status)

      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`)
      }

      const result = await response.text()
      console.log('Webhook response:', result)

      push({ title: 'Generation started', message: 'Check back in a few minutes', variant: 'success' })
      setShowUrlModal(false)
      setUrl('')

      // Refresh the data after successful generation
      setTimeout(() => { fetchRealEstateContent() }, 2000)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Content Agent</h1>
          <p className="mt-2 text-gray-600">
            Generate specialized content for real estate professionals, agents, and property businesses.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => fetchRealEstateContent(true)} loading={loading} disabled={loading} variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowUrlModal(true)}>
            <Building2 className="h-4 w-4" />
            Generate Real Estate Content
          </Button>
        </div>
      </div>

      {/* URL Input Modal (shared) */}
      <Modal isOpen={showUrlModal} onClose={handleCloseModal} labelledById="realestate-url-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
              <Link className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="realestate-url-title" className="text-lg font-bold text-gray-900">Enter Property URL</h2>
              <p className="text-sm text-gray-500">Provide a URL to analyze and generate content</p>
            </div>
          </div>

          <IconButton onClick={handleCloseModal} aria-label="Close dialog" disabled={isGenerating} variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
          <Input
            label="Property or Real Estate URL"
            placeholder="https://example.com/property-listing"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isGenerating}
          />

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You can enter URLs for property listings, real estate websites,
              or any real estate-related page to generate targeted content.
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
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Content'}
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
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Real Estate Content</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchRealEstateContent(true)} variant="outline" loading={loading} disabled={loading}>
              Try Again
            </Button>
          </CardContent>
        </Card>
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
                      <Link className="h-4 w-4 mr-1 text-blue-600" />
                      Origin Link
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <a
                        href={content.link_origin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900 text-sm break-all flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
                        {content.link_origin}
                      </a>
                    </div>
                  </div>
                )}

                {/* Final Link */}
                {content.link_final && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-green-600" />
                      Final Link
                    </h4>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <a
                        href={content.link_final}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:text-green-900 text-sm break-all flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
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
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Real Estate Content Yet</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              Generate your first real estate content by providing a property URL.
              The AI will analyze the content and create specialized real estate materials.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Property Analysis</h4>
                <p className="text-sm text-gray-600">AI analyzes property URLs and extracts key information</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Content Generation</h4>
                <p className="text-sm text-gray-600">Creates specialized real estate marketing content</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Ready to Use</h4>
                <p className="text-sm text-gray-600">Get professional content ready for your campaigns</p>
              </div>
            </div>

            <Button onClick={() => setShowUrlModal(true)} size="lg">
              <Building2 className="h-4 w-4" />
              Generate Your First Content
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog (shared) */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen && !!deleteDialog.content}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Content"
        message={`Are you sure you want to delete Real Estate Content #${deleteDialog.content?.id}? This action cannot be undone.`}
        confirmText={deleteDialog.loading ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        variant="danger"
        loading={deleteDialog.loading}
      />
    </div>
  )
}
