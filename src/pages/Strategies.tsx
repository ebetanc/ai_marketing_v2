import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { 
  RefreshCw,
  Database
} from 'lucide-react'
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
            Strategies table data from Supabase database.
          </p>
        </div>
        <Button onClick={fetchStrategies} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
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
            <Database className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Strategies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStrategies} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Strategies Table */}
      {!loading && !error && strategies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-600" />
              Strategies Table ({strategies.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Created At</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Platforms</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Brand</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Angle 1 Header</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Angle 1 Description</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Angle 2 Header</th>
                    <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-900">Angle 3 Header</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strategy) => (
                    <tr key={strategy.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{strategy.id}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                        {new Date(strategy.created_at).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{strategy.platforms || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{strategy.brand || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {strategy.angle1_header || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {strategy.angle1_description || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {strategy.angle2_header || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                        {strategy.angle3_header || '-'}
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
      {!loading && !error && strategies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No strategies found
            </h3>
            <p className="text-gray-500 mb-6">
              The strategies table in your Supabase database is empty.
            </p>
            <Button onClick={fetchStrategies}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}