import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import { 
  RefreshCw,
  Database,
  Building2,
  Target,
  Zap,
  FileText,
  Calendar
} from 'lucide-react'
import type { Strategy } from '../lib/supabase'
import { formatDate } from '../lib/utils'

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
      
      console.log('Fetching strategies from Supabase...')
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase client:', supabase)
      
      // First, let's try to get the current user/session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      console.log('Auth error:', authError)
      
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Supabase response:', { data, error })
      console.log('Data length:', data?.length)
      console.log('Error details:', error)
      
      if (error) {
        console.error('Supabase error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }
      
      console.log('Strategies fetched successfully:', data?.length || 0, 'records')
      console.log('First strategy (if any):', data?.[0])
      setStrategies(data || [])
    } catch (error) {
      console.error('Error fetching strategies:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch strategies'
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to extract all angles from a strategy
  const extractAnglesFromStrategy = (strategy: Strategy) => {
    const angles = []
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as string
      const description = strategy[`angle${i}_description` as keyof Strategy] as string
      const objective = strategy[`angle${i}_objective` as keyof Strategy] as string
      const tonality = strategy[`angle${i}_tonality` as keyof Strategy] as string
      
      if (header || description || objective || tonality) {
        angles.push({
          number: i,
          header: header || `Angle ${i}`,
          description: description || 'No description provided',
          objective: objective || 'No objective specified',
          tonality: tonality || 'No tonality defined'
        })
      }
    }
    return angles
  }

  // Group strategies by brand
  const strategiesByBrand = strategies.reduce((acc, strategy) => {
    const brand = strategy.brand || 'Unknown Brand'
    if (!acc[brand]) {
      acc[brand] = []
    }
    acc[brand].push(strategy)
    return acc
  }, {} as Record<string, Strategy[]>)

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
        <div className="space-y-8">
          {Object.entries(strategiesByBrand).map(([brandName, brandStrategies]) => (
            <div key={brandName} className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{brandName}</h2>
                    <p className="text-gray-600">{brandStrategies.length} strateg{brandStrategies.length === 1 ? 'y' : 'ies'}</p>
                  </div>
                </div>
                <Badge variant="primary" className="text-sm">
                  {brandStrategies.reduce((total, strategy) => total + extractAnglesFromStrategy(strategy).length, 0)} angles total
                </Badge>
              </div>

              {/* Strategy Cards for this Brand */}
              <div className="space-y-6">
                {brandStrategies.map((strategy) => {
                  const angles = extractAnglesFromStrategy(strategy)
                  const platforms = strategy.platforms ? strategy.platforms.split(',').map(p => p.trim()) : []
                  
                  return (
                    <Card key={strategy.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Database className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">Strategy #{strategy.id}</CardTitle>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(strategy.created_at)}
                                </span>
                                <span>{angles.length} angle{angles.length === 1 ? '' : 's'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Platform Badges */}
                          {platforms.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {platforms.slice(0, 3).map((platform, index) => (
                                <Badge key={index} variant="secondary" className="text-xs capitalize">
                                  {platform}
                                </Badge>
                              ))}
                              {platforms.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{platforms.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Individual Angle Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {angles.map((angle) => (
                            <Card key={angle.number} className="bg-gray-50 border border-gray-200 hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {angle.number}
                                  </div>
                                  <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-1">
                                    {angle.header}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              
                              <CardContent className="space-y-3 pt-0">
                                {/* Description */}
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                                    <FileText className="h-3 w-3 mr-1 text-blue-500" />
                                    Description
                                  </h5>
                                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                                    {angle.description}
                                  </p>
                                </div>
                                
                                {/* Objective */}
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                                    <Target className="h-3 w-3 mr-1 text-green-500" />
                                    Objective
                                  </h5>
                                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                    {angle.objective}
                                  </p>
                                </div>
                                
                                {/* Tonality */}
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                                    <Zap className="h-3 w-3 mr-1 text-purple-500" />
                                    Tonality
                                  </h5>
                                  <Badge variant="secondary" className="text-xs">
                                    {angle.tonality}
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
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