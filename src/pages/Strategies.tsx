import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { GenerateStrategyModal } from '../components/content/GenerateStrategyModal'
import { supabase, type Tables } from '../lib/supabase'
import {
  FileText,
  Building2,
  Eye,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  Plus,
  HelpCircle,
  X,

  Lightbulb
} from 'lucide-react'
import { formatDate } from '../lib/utils'
import { IconButton } from '../components/ui/IconButton'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

type Strategy = Tables<'strategies'> & {
  company?: { id: number; brand_name: string; created_at: string }
}

interface Company {
  id: number
  brand_name: string
  created_at: string
  strategies: Strategy[]
}

export function Strategies() {
  useDocumentTitle('Strategies — AI Marketing')
  const [companiesWithStrategies, setCompaniesWithStrategies] = useState<Company[]>([])
  const [companiesForModal, setCompaniesForModal] = useState<{ id: number; brand_name: string; created_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generatingIdeas, setGeneratingIdeas] = useState<number | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean
    strategy: Strategy | null
    company: Company | null
  }>({
    isOpen: false,
    strategy: null,
    company: null
  })

  useEffect(() => {
    fetchStrategies()
    fetchCompanies()
  }, [])

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching strategies from Supabase...')

      // Fetch strategies with company information
      const { data: strategies, error: strategiesError } = await supabase
        .from('strategies')
        .select(`
          *,
          company:companies (
            id,
            brand_name,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (strategiesError) {
        console.error('Supabase error:', strategiesError)
        throw strategiesError
      }

      console.log('Strategies fetched successfully:', strategies?.length || 0, 'records')

      // Group strategies by company
      const companiesMap = new Map<number, Company>()

      strategies?.forEach((strategy: any) => {
        const companyId = strategy.company?.id || strategy.company_id
        const companyName = strategy.company?.brand_name || 'Unknown Company'
        const companyCreatedAt = strategy.company?.created_at || strategy.created_at

        if (!companiesMap.has(companyId)) {
          companiesMap.set(companyId, {
            id: companyId,
            brand_name: companyName,
            created_at: companyCreatedAt,
            strategies: []
          })
        }

        companiesMap.get(companyId)?.strategies.push(strategy)
      })

      const companiesArray = Array.from(companiesMap.values())
      console.log('Companies with strategies:', companiesArray)
      setCompaniesWithStrategies(companiesArray)

    } catch (error) {
      console.error('Error fetching strategies from Supabase:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch strategies')
      setCompaniesWithStrategies([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      console.log('Fetching companies for strategy generation...')
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching companies:', error)
        return
      }

      console.log('Companies fetched for modal:', data?.length || 0, 'records')
      setCompaniesForModal(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }
  const countAngles = (strategy: Strategy): number => {
    let count = 0
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as string | null
      if (header && header.trim()) {
        count++
      }
    }
    return count
  }

  const getPlatformBadges = (platforms: string | null) => {
    if (!platforms) return []

    try {
      // Try to parse as JSON array first
      const parsed = JSON.parse(platforms)
      if (Array.isArray(parsed)) {
        return parsed.filter(p => p && p.trim())
      }
    } catch {
      // If not JSON, split by comma
      return platforms.split(',').map(p => p.trim()).filter(p => p)
    }

    return []
  }

  const handleViewStrategy = (strategy: Strategy, company: Company) => {
    console.log('Opening modal for strategy:', strategy.id, 'company:', company.brand_name)
    setViewModal({
      isOpen: true,
      strategy,
      company
    })
  }

  const handleCloseModal = () => {
    setViewModal({
      isOpen: false,
      strategy: null,
      company: null
    })
  }

  const handleGenerateIdeas = async (angle: any) => {
    if (!viewModal.strategy || !viewModal.company) return

    try {
      setGeneratingIdeas(angle.number)

      const payload = {
        company: {
          id: viewModal.company.id,
          brand_name: viewModal.company.brand_name
        },
        strategy: {
          id: viewModal.strategy.id,
          platforms: viewModal.strategy.platforms,
          created_at: viewModal.strategy.created_at
        },
        angle: {
          number: angle.number,
          header: angle.header,
          description: angle.description,
          objective: angle.objective,
          tonality: angle.tonality
        }
      }

      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to generate ideas')
      }

      console.log('Ideas generation started successfully')
    } catch (error) {
      console.error('Error generating ideas:', error)
    } finally {
      setGeneratingIdeas(null)
    }
  }

  const handleGenerateStrategy = () => {
    if (companiesForModal.length === 0) {
      return
    }
    setShowGenerateModal(true)
  }

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false)
  }

  const handleStrategyGenerated = () => {
    setShowGenerateModal(false)
    // Refresh strategies after generation
    fetchStrategies()
    fetchCompanies()
  }

  const getAnglesFromStrategy = (strategy: Strategy) => {
    const angles = []
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as string | null
      const description = strategy[`angle${i}_description` as keyof Strategy] as string | null
      const objective = strategy[`angle${i}_objective` as keyof Strategy] as string | null
      const tonality = strategy[`angle${i}_tonality` as keyof Strategy] as string | null

      if (header && header.trim()) {
        angles.push({
          number: i,
          header: header.trim(),
          description: description?.trim() || '',
          objective: objective?.trim() || '',
          tonality: tonality?.trim() || ''
        })
      }
    }
    return angles
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
            <p className="mt-2 text-gray-600">
              AI-generated content strategies organized by company.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center space-x-3 mb-4">
              <Skeleton className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
            <p className="mt-2 text-gray-600">
              AI-generated content strategies organized by company.
            </p>
          </div>
          <Button onClick={fetchStrategies} loading={loading} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Strategies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStrategies} variant="outline" loading={loading} disabled={loading}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
          <p className="mt-2 text-gray-600">
            AI-generated content strategies organized by company.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={fetchStrategies} variant="outline" loading={loading} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleGenerateStrategy}>
            <Plus className="h-4 w-4" />
            Generate Strategy
          </Button>
        </div>
      </div>

      {/* Generate Strategy Modal */}
      <GenerateStrategyModal
        isOpen={showGenerateModal}
        onClose={handleCloseGenerateModal}
        companies={companiesForModal}
        onStrategyGenerated={handleStrategyGenerated}
      />

      {/* Strategy Details Modal */}
      {viewModal.isOpen && viewModal.strategy && viewModal.company && (
        <Modal isOpen={viewModal.isOpen} onClose={handleCloseModal} labelledById="view-strategy-title">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 id="view-strategy-title" className="text-xl font-bold text-gray-900">
                    Strategy #{viewModal.strategy.id}
                  </h2>
                  <p className="text-sm text-gray-500">{viewModal.company.brand_name}</p>
                </div>
              </div>

              <IconButton onClick={handleCloseModal} aria-label="Close dialog" variant="ghost">
                <X className="h-5 w-5 text-gray-400" />
              </IconButton>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {/* Strategy Info Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="font-semibold text-gray-900">{formatDate(viewModal.strategy.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Platforms</p>
                    <p className="font-semibold text-gray-900">{getPlatformBadges(viewModal.strategy.platforms).join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Angles</p>
                    <p className="font-semibold text-gray-900">{countAngles(viewModal.strategy)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                    <p className="font-semibold text-gray-900">{viewModal.company.brand_name}</p>
                  </div>
                </div>
              </div>

              {/* Content Angles Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Content Angles ({countAngles(viewModal.strategy)})
                </h3>
                <div className="space-y-4">
                  {getAnglesFromStrategy(viewModal.strategy).map((angle, index) => (
                    <div
                      key={index}
                      className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      {/* Angle Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">{angle.number}</span>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {angle.header}
                            </h4>
                            <p className="text-sm text-gray-500">Click to expand details</p>
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGenerateIdeas(angle)
                          }}
                          loading={generatingIdeas === angle.number}
                          disabled={generatingIdeas !== null}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <Lightbulb className="h-4 w-4" />
                          {generatingIdeas === angle.number ? 'Generating...' : 'Generate Ideas'}
                        </Button>
                      </div>

                      {/* Angle Details */}
                      <div className="space-y-4">
                        {angle.description && (
                          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                            <div className="flex items-center mb-2">
                              <FileText className="h-4 w-4 text-blue-600 mr-2" />
                              <h5 className="font-semibold text-blue-900">Description</h5>
                            </div>
                            <p className="text-blue-800 leading-relaxed">{angle.description}</p>
                          </div>
                        )}

                        {angle.objective && (
                          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                            <div className="flex items-center mb-2">
                              <Target className="h-4 w-4 text-green-600 mr-2" />
                              <h5 className="font-semibold text-green-900">Objective</h5>
                            </div>
                            <p className="text-green-800 leading-relaxed">{angle.objective}</p>
                          </div>
                        )}

                        {angle.tonality && (
                          <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                            <div className="flex items-center mb-2">
                              <Zap className="h-4 w-4 text-purple-600 mr-2" />
                              <h5 className="font-semibold text-purple-900">Tonality</h5>
                            </div>
                            <p className="text-purple-800 leading-relaxed">{angle.tonality}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={handleCloseModal}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Companies with Strategies */}
      {companiesWithStrategies.length > 0 ? (
        <div className="space-y-6">
          {companiesWithStrategies.map((company) => (
            <div key={company.id} className="w-full max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Company Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h5 className="text-xl font-semibold text-gray-900">
                      {company.brand_name}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {company.strategies.length} content strateg{company.strategies.length === 1 ? 'y' : 'ies'} available
                    </p>
                  </div>
                </div>
                <Badge variant="primary" className="text-sm px-3 py-1">
                  {company.strategies.length} Strategies
                </Badge>
              </div>

              <p className="text-sm font-normal text-gray-500 mb-4">
                Choose from available content strategies to generate targeted content ideas and campaigns.
              </p>

              {/* Strategies List */}
              <ul className="space-y-3">
                {company.strategies.map((strategy) => {
                  const angleCount = countAngles(strategy)
                  const platformBadges = getPlatformBadges(strategy.platforms)

                  return (
                    <li key={strategy.id}>
                      <div className="flex items-center justify-between p-4 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow transition-all duration-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-gray-900">
                                Strategy #{strategy.id}
                              </span>
                              {angleCount > 0 && (
                                <Badge variant="success" className="text-xs">
                                  {angleCount} Angles
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(strategy.created_at)}
                              </span>

                              {platformBadges.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Target className="h-3 w-3" />
                                  <span>{platformBadges.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStrategy(strategy, company)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline hover:text-gray-700 transition-colors">
                  <HelpCircle className="w-3 h-3 me-2" />
                  How do content strategies work?
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Strategies Found</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8">
              No content strategies have been generated yet. Create your first strategy to get started with AI-powered content planning.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Multi-Platform</h4>
                <p className="text-sm text-gray-600">Strategies for all your marketing channels</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">AI-Powered</h4>
                <p className="text-sm text-gray-600">Generated using advanced AI algorithms</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-6 w-6 text-teal-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Brand-Specific</h4>
                <p className="text-sm text-gray-600">Tailored to your company's voice and goals</p>
              </div>
            </div>

            <Button onClick={handleGenerateStrategy} size="lg">
              <Plus className="h-4 w-4" />
              Generate Your First Strategy
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
