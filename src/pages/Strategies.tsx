import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import { 
  FileText, 
  Plus,
  Zap,
  Calendar,
  Building2
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import type { Strategy } from '../lib/supabase'

export function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setStrategies(data || [])
    } catch (error) {
      console.error('Error fetching strategies:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch strategies')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
          <p className="mt-2 text-gray-600">
            View and manage your AI-generated content strategies from Supabase.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Strategy
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading strategies...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Strategies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStrategies} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Strategies Grid */}
      {!loading && !error && strategies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {strategies.map((strategy) => (
            <Card key={strategy.id} className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base line-clamp-2">
                        Strategy #{strategy.id}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {strategy.brand && (
                          <Badge variant="secondary" className="mr-2 text-xs">
                            <Building2 className="h-3 w-3 mr-1" />
                            {strategy.brand}
                          </Badge>
                        )}
                        <span className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(strategy.created_at)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Platforms */}
                {strategy.platforms && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Platforms</h4>
                    <Badge variant="primary" className="text-xs">
                      {strategy.platforms}
                    </Badge>
                  </div>
                )}

                {/* Sample Angles Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Content Angles</h4>
                  <div className="space-y-2">
                    {strategy.angle1_header && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium text-gray-900">{strategy.angle1_header}</p>
                        {strategy.angle1_description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {strategy.angle1_description.substring(0, 80)}...
                          </p>
                        )}
                      </div>
                    )}
                    {strategy.angle2_header && (
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs font-medium text-gray-900">{strategy.angle2_header}</p>
                        {strategy.angle2_description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {strategy.angle2_description.substring(0, 80)}...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {/* TODO: Open modal */}}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View All Angles
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && strategies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No strategies found
            </h3>
            <p className="text-gray-500 mb-6">
              No strategies were found in your Supabase database.
            </p>
            <Button onClick={fetchStrategies}>
              <Plus className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}