import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { 
  Lightbulb, 
  Eye, 
  CheckCircle, 
  Clock,
  FileText,
  Target,
  Building2,
  Calendar,
  Zap,
  RefreshCw
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { supabase } from '../lib/supabase'

export function Ideas() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewIdeaModal, setViewIdeaModal] = useState<{
    isOpen: boolean
    idea: any
  }>({
    isOpen: false,
    idea: null
  })

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching ideas from Supabase...')
      
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('=== SUPABASE IDEAS DEBUG ===')
      console.log('Raw Supabase response:', { data, error })
      console.log('Data array length:', data?.length)
      console.log('First idea object:', data?.[0])
      console.log('All idea objects:', data)
      console.log('Available columns in first idea:', data?.[0] ? Object.keys(data[0]) : 'No data')
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Ideas fetched successfully:', data?.length || 0, 'records')
      console.log('Setting ideas state with:', data)
      setIdeas(data || [])
    } catch (error) {
      console.error('Error fetching ideas from Supabase:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch ideas')
      setIdeas([])
    } finally {
      setLoading(false)
    }
  }

  const handleViewIdea = (idea: any) => {
    setViewIdeaModal({
      isOpen: true,
      idea
    })
  }

  const handleCloseViewModal = () => {
    setViewIdeaModal({
      isOpen: false,
      idea: null
    })
  }

  // Group ideas by brand
  const ideasByBrand = ideas.reduce((acc, idea) => {
    const brand = idea.brand || 'Unknown Brand'
    if (!acc[brand]) {
      acc[brand] = []
    }
    acc[brand].push(idea)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="mt-2 text-gray-600">
            AI-generated content ideas organized by brand.
          </p>
        </div>
        <Button onClick={fetchIdeas} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* View Idea Modal */}
      {viewIdeaModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewIdeaModal.idea?.topic || viewIdeaModal.idea?.header || 'Content Idea'}</h2>
                  <p className="text-sm text-gray-500">{viewIdeaModal.idea?.brand || 'Unknown Brand'}</p>
                </div>
              </div>
              
              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Eye className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {/* Topic/Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {viewIdeaModal.idea?.topic || viewIdeaModal.idea?.header || 'No topic specified'}
                  </p>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {viewIdeaModal.idea?.description || 'No description available'}
                  </p>
                </CardContent>
              </Card>

              {/* Image Prompt */}
              {viewIdeaModal.idea?.image_prompt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2 text-purple-600" />
                      Image Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewIdeaModal.idea.image_prompt}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Additional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-orange-600" />
                    Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {viewIdeaModal.idea?.objective && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Objective</p>
                      <p className="text-gray-700">{viewIdeaModal.idea.objective}</p>
                    </div>
                  )}
                  {viewIdeaModal.idea?.tonality && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tonality</p>
                      <p className="text-gray-700">{viewIdeaModal.idea.tonality}</p>
                    </div>
                  )}
                  {viewIdeaModal.idea?.content_type && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Content Type</p>
                      <p className="text-gray-700">{viewIdeaModal.idea.content_type}</p>
                    </div>
                  )}
                  {viewIdeaModal.idea?.platforms && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Platforms</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(viewIdeaModal.idea.platforms) ? viewIdeaModal.idea.platforms : [viewIdeaModal.idea.platforms]).map((platform, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewIdeaModal.idea?.strategy_id && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Strategy ID</p>
                      <p className="text-gray-700">#{viewIdeaModal.idea.strategy_id}</p>
                    </div>
                  )}
                  {viewIdeaModal.idea?.angle_number && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Angle Number</p>
                      <p className="text-gray-700">{viewIdeaModal.idea.angle_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={handleCloseViewModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ideas...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ideas</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchIdeas} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ideas by Brand */}
      {!loading && !error && ideas.length > 0 && (
        <div className="space-y-12">
          {Object.entries(ideasByBrand).map(([brandName, brandIdeas]) => (
            <div key={brandName} className="space-y-6">
              {/* Brand Header */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{brandName}</h2>
                      <p className="text-blue-600 font-medium">{brandIdeas.length} content idea{brandIdeas.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="primary" className="text-lg px-6 py-3 font-semibold">
                      {brandIdeas.length} Ideas
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Ideas Grid for this Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brandIdeas.map((idea) => (
                  <Card key={idea.id} className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {idea.topic || idea.header || 'Content Idea'}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-3 pt-0 pb-4">
                      {/* Description */}
                      <div>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-gray-50 p-2 rounded-lg">
                          {truncateText(idea.description || 'No description available', 150)}
                        </p>
                      </div>
                      
                      {/* Image Prompt */}
                      {idea.image_prompt && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">Image Prompt:</p>
                          <p className="text-xs text-purple-600 line-clamp-2 bg-purple-50 p-2 rounded-lg">
                            {truncateText(idea.image_prompt, 100)}
                          </p>
                        </div>
                      )}
                      
                      {/* Platforms & Details */}
                      <div className="flex items-center justify-between">
                        {idea.platforms && (
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(idea.platforms) ? idea.platforms.slice(0, 2) : [idea.platforms]).map((platform, index) => (
                              <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {idea.status && (
                          <Badge variant={idea.status === 'approved' ? 'success' : 'warning'} className="text-xs">
                            {idea.status}
                          </Badge>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {idea.strategy_id && (
                          <div className="flex items-center">
                            <Target className="h-3 w-3 mr-1" />
                            <span>Strategy #{idea.strategy_id}</span>
                          </div>
                        )}
                        {idea.angle_number && (
                          <div className="flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            <span>Angle {idea.angle_number}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(idea.created_at)}</span>
                        </div>
                      </div>

                      {/* View Button */}
                      <div className="pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs py-1.5 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                          onClick={() => handleViewIdea(idea)}
                        >
                          <Eye className="h-3 w-3 mr-1.5" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Empty State */}
      {!loading && !error && ideas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas found</h3>
            <p className="text-gray-500 mb-6">
              The ideas table in your Supabase database is empty.
            </p>
            <Button onClick={fetchIdeas}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}