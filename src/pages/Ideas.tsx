import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ViewContentModal } from '../components/content/ViewContentModal'
import { 
  Lightbulb, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock,
  Sparkles,
  Filter,
  Search,
  MoreVertical,
  Trash2,
  FileText,
  Target,
  Users,
  Calendar
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { supabase } from '../lib/supabase'

// Helper function to extract and format idea content
const extractIdeaContent = (idea: any) => {
  return idea.description || 'No description available'
}

export function Ideas() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="mt-2 text-gray-600">
            Ideas from Supabase database.
          </p>
        </div>
        <Button onClick={fetchIdeas} disabled={loading}>
          <Lightbulb className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

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

      {/* Ideas Table */}
      {!loading && !error && ideas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
              Ideas Table ({ideas.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-900">ID</th>
                    <th className="text-left p-3 font-medium text-gray-900">Brand</th>
                    <th className="text-left p-3 font-medium text-gray-900">Topic</th>
                    <th className="text-left p-3 font-medium text-gray-900">Header</th>
                    <th className="text-left p-3 font-medium text-gray-900">Description</th>
                    <th className="text-left p-3 font-medium text-gray-900">Image Prompt</th>
                    <th className="text-left p-3 font-medium text-gray-900">Platforms</th>
                    <th className="text-left p-3 font-medium text-gray-900">Strategy ID</th>
                    <th className="text-left p-3 font-medium text-gray-900">Angle Number</th>
                    <th className="text-left p-3 font-medium text-gray-900">Objective</th>
                    <th className="text-left p-3 font-medium text-gray-900">Tonality</th>
                    <th className="text-left p-3 font-medium text-gray-900">Content Type</th>
                    <th className="text-left p-3 font-medium text-gray-900">Status</th>
                    <th className="text-left p-3 font-medium text-gray-900">All Columns</th>
                    <th className="text-left p-3 font-medium text-gray-900">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-900">{idea.id}</td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.brand)}
                        </div>
                        {idea.brand || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.topic)}
                        </div>
                        {idea.topic || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900 max-w-xs">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.header)}
                        </div>
                        <div className="truncate" title={idea.header}>
                          {idea.header || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-900 max-w-xs">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.description)}
                        </div>
                        <div className="truncate" title={idea.description}>
                          {idea.description || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-900 max-w-xs">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.image_prompt)}
                        </div>
                        <div className="truncate" title={idea.image_prompt}>
                          {idea.image_prompt || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.platforms)}
                        </div>
                        {idea.platforms ? (
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(idea.platforms) ? idea.platforms : [idea.platforms]).map((platform, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.strategy_id)}
                        </div>
                        {idea.strategy_id || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.angle_number)}
                        </div>
                        {idea.angle_number || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900 max-w-xs">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.objective)}
                        </div>
                        <div className="truncate" title={idea.objective}>
                          {idea.objective || 'N/A'}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.tonality)}
                        </div>
                        {idea.tonality || 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-gray-900">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.content_type)}
                        </div>
                        {idea.content_type || 'N/A'}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="font-mono text-xs bg-gray-100 p-1 rounded mb-1">
                          Raw: {JSON.stringify(idea.status)}
                        </div>
                        {idea.status ? (
                          <Badge variant={idea.status === 'approved' ? 'success' : 'warning'}>
                            {idea.status}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        <div className="font-mono text-xs bg-blue-50 p-2 rounded max-w-xs overflow-auto">
                          <pre>{JSON.stringify(idea, null, 2)}</pre>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {idea.created_at ? formatDate(idea.created_at) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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
              <Lightbulb className="h-4 w-4 mr-2" />
              Refresh
            </Button>
        </CardContent>
      </Card>
      )}
    </div>
  )
}