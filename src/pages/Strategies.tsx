import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { GenerateStrategyModal } from '../components/content/GenerateStrategyModal'
import { supabase, type Tables } from '../lib/supabase'
import { FileText, Building2, RefreshCw, Target, Zap, Plus, HelpCircle, X, Lightbulb, ChevronDown, ChevronRight, Search } from 'lucide-react'
import { formatDate } from '../lib/utils'
import StrategyListItem from '../components/strategies/StrategyListItem'
import { IconButton } from '../components/ui/IconButton'
import { Modal } from '../components/ui/Modal'
import { Skeleton } from '../components/ui/Skeleton'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { postToN8n } from '../lib/n8n'
import { useAsyncCallback } from '../hooks/useAsync'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'

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
  const [collapsedCompanies, setCollapsedCompanies] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')
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
  // Angles that already have ideas generated for the currently viewed strategy
  const [existingIdeaAngles, setExistingIdeaAngles] = useState<number[]>([])
  const [loadingIdeaAngles, setLoadingIdeaAngles] = useState(false)
  // Angle editing state
  const [editingAngle, setEditingAngle] = useState<number | null>(null)
  const [angleForm, setAngleForm] = useState({
    header: '',
    description: '',
    objective: '',
    tonality: ''
  })
  const [angleErrors, setAngleErrors] = useState<{ header?: string }>({})
  const [savingAngle, setSavingAngle] = useState(false)
  const [expandedAngles, setExpandedAngles] = useState<Record<number, boolean>>({})

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
      const { data: userRes } = await supabase.auth.getUser()
      const userId = userRes.user?.id
      let q = supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      if (userId) q = q.eq('owner_id', userId)
      const { data, error } = await q

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
      const parsed = JSON.parse(platforms)
      if (Array.isArray(parsed)) return parsed.filter(p => p && p.trim())
    } catch {
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
    // Load existing idea sets for this strategy to prevent duplicates
    setExistingIdeaAngles([])
    setLoadingIdeaAngles(true)
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('ideas')
          .select('angle_number')
          .eq('strategy_id', strategy.id)
        if (error) {
          console.warn('Unable to fetch existing ideas for strategy', strategy.id, error)
          return
        }
        const usedAngles: number[] = (data || [])
          .map((r: { angle_number: number | null }) => r.angle_number)
          .filter((n: number | null): n is number => typeof n === 'number' && n !== null)
        const uniqueSorted = Array.from(new Set<number>(usedAngles)).sort((a: number, b: number) => a - b)
        setExistingIdeaAngles(uniqueSorted)
      } finally {
        setLoadingIdeaAngles(false)
      }
    })()
  }

  const handleCloseModal = () => {
    setViewModal({
      isOpen: false,
      strategy: null,
      company: null
    })
    setExistingIdeaAngles([])
    setLoadingIdeaAngles(false)
    setEditingAngle(null)
  }

  const { call: runGenerateIdeas } = useAsyncCallback(async (angle: any) => {
    if (!viewModal.strategy || !viewModal.company) return
    // Attach user identity for RLS-locked inserts
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id || null
    // Normalize platforms into lowercase string ids
    const normalizedPlatforms = getPlatformBadges(viewModal.strategy.platforms)
      .map((p: string) => String(p).trim().toLowerCase())
      .filter(Boolean)
    // Fixed index map so each platform always occupies the same slot
    const PLATFORM_ORDER = ['twitter', 'linkedin', 'newsletter', 'facebook', 'instagram', 'youtube', 'tiktok', 'blog']
    const platformsSlotted: string[] = PLATFORM_ORDER.map(() => '')
    normalizedPlatforms.forEach((p) => {
      const idx = PLATFORM_ORDER.indexOf(p)
      if (idx !== -1) platformsSlotted[idx] = p
    })

    // Build payload to match n8n content-saas workflow expectations
    const payload = {
      identifier: 'generateIdeas',
      operation: 'create_ideas_from_angle',
      company_id: viewModal.company.id,
      strategy_id: viewModal.strategy.id,
      strategyIndex: angle.number,
      angle_number: angle.number,
      platforms: platformsSlotted,
      meta: { user_id: userId, source: 'app', ts: new Date().toISOString() },
      user_id: userId,
      brand: { id: viewModal.company.id, name: viewModal.company.brand_name },
      brandDetails: { id: viewModal.company.id, name: viewModal.company.brand_name },
      data: { brandData: { id: viewModal.company.id, name: viewModal.company.brand_name } },
      company: { id: viewModal.company.id, brand_name: viewModal.company.brand_name },
      strategy: { id: viewModal.strategy.id, platforms: viewModal.strategy.platforms, created_at: viewModal.strategy.created_at },
      angle: {
        angleNumber: angle.number,
        number: angle.number,
        header: angle.header,
        description: angle.description,
        objective: angle.objective,
        tonality: angle.tonality,
        strategy: { id: viewModal.strategy.id, platforms: viewModal.strategy.platforms },
      },
    }

    const response = await postToN8n('generateIdeas', payload)
    if (!response.ok) throw new Error('Failed to generate ideas')
    console.log('Ideas generation started successfully')
  })

  const handleGenerateIdeas = async (angle: any) => {
    if (!viewModal.strategy || !viewModal.company) return
    setGeneratingIdeas(angle.number)
    try {
      await runGenerateIdeas(angle)
      // Optimistically mark this angle as generated to block re-generation
      setExistingIdeaAngles(prev => prev.includes(angle.number) ? prev : [...prev, angle.number].sort((a, b) => a - b))
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

  const beginEditAngle = (angle: { number: number; header: string; description: string; objective: string; tonality: string }) => {
    setEditingAngle(angle.number)
    setAngleForm({
      header: angle.header,
      description: angle.description,
      objective: angle.objective,
      tonality: angle.tonality
    })
    setAngleErrors({})
  }

  const cancelEditAngle = () => {
    setEditingAngle(null)
    setAngleErrors({})
  }

  const saveAngle = async () => {
    if (!viewModal.strategy || editingAngle == null) return
    if (!angleForm.header.trim()) {
      setAngleErrors({ header: 'Header is required.' })
      return
    }
    setSavingAngle(true)
    try {
      const update: Record<string, any> = {
        [`angle${editingAngle}_header`]: angleForm.header.trim(),
        [`angle${editingAngle}_description`]: angleForm.description.trim(),
        [`angle${editingAngle}_objective`]: angleForm.objective.trim(),
        [`angle${editingAngle}_tonality`]: angleForm.tonality.trim()
      }
      const { error } = await supabase
        .from('strategies')
        .update(update)
        .eq('id', viewModal.strategy.id)
      if (error) throw error
      // Optimistically update local strategy in modal
      setViewModal(prev => prev.strategy ? ({
        ...prev,
        strategy: { ...prev.strategy, ...update }
      }) : prev)
      setEditingAngle(null)
    } catch (e) {
      console.error('Failed to save angle', e)
      setAngleErrors({ header: e instanceof Error ? e.message : 'Save failed' })
    } finally {
      setSavingAngle(false)
    }
  }

  const toggleAngle = (num: number) => {
    setExpandedAngles(prev => ({ ...prev, [num]: !prev[num] }))
  }
  const isAngleExpanded = (num: number) => !!expandedAngles[num]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Strategies" description="AI strategies by company." icon={<FileText className="h-5 w-5" />} />
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
        <PageHeader
          title="Strategies"
          description="AI strategies by company."
          icon={<FileText className="h-5 w-5" />}
          actions={(
            <Button onClick={fetchStrategies} loading={loading} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
        />
        <ErrorState
          icon={<FileText className="h-12 w-12 text-red-500" />}
          title="Error Loading Strategies"
          error={error}
          retry={<Button onClick={fetchStrategies} variant="outline" loading={loading} disabled={loading}>Try Again</Button>}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Strategies"
        description="AI strategies by company."
        icon={<FileText className="h-5 w-5" />}
        actions={(
          <>
            <Button onClick={fetchStrategies} variant="outline" loading={loading} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleGenerateStrategy}>
              <Plus className="h-4 w-4" />
              Generate strategy
            </Button>
          </>
        )}
      />

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
              <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-xl p-4 border border-brand-100">
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

              {/* Substrategies Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Substrategies ({countAngles(viewModal.strategy)})
                  {loadingIdeaAngles && (
                    <span className="ml-3 text-xs text-gray-500">Loading existing ideas…</span>
                  )}
                </h3>
                <div className="space-y-4">
                  {getAnglesFromStrategy(viewModal.strategy).map((angle, index) => (
                    <div
                      key={index}
                      className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-brand-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => { if (editingAngle !== angle.number) toggleAngle(angle.number) }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isAngleExpanded(angle.number)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (editingAngle !== angle.number) toggleAngle(angle.number) } }}
                    >
                      {/* Angle Header (buttons moved below title) */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">{angle.number}</span>
                          </div>
                          <div className="flex-1">
                            {editingAngle === angle.number ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={angleForm.header}
                                  onChange={e => { setAngleForm(f => ({ ...f, header: e.target.value })); setAngleErrors({}) }}
                                  aria-label="Angle header"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                                  placeholder="Angle header"
                                />
                                {angleErrors.header && <p className="text-xs text-red-600">{angleErrors.header}</p>}
                              </div>
                            ) : (
                              <>
                                <h4 className="text-xl font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                                  {angle.header}
                                </h4>
                                <p className="text-sm text-gray-500">Click to {isAngleExpanded(angle.number) ? 'collapse' : 'expand'}</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {editingAngle === angle.number ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); cancelEditAngle() }}
                                disabled={savingAngle}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); void saveAngle() }}
                                loading={savingAngle}
                                disabled={savingAngle}
                              >
                                {savingAngle ? 'Saving…' : 'Save'}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); beginEditAngle(angle) }}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleGenerateIdeas(angle)
                                }}
                                loading={generatingIdeas === angle.number}
                                disabled={generatingIdeas !== null || existingIdeaAngles.includes(angle.number)}
                                variant={existingIdeaAngles.includes(angle.number) ? 'outline' : 'primary'}
                                className="transition-opacity duration-200"
                              >
                                <Lightbulb className="h-4 w-4" />
                                {existingIdeaAngles.includes(angle.number)
                                  ? 'Ideas generated'
                                  : generatingIdeas === angle.number
                                    ? 'Generating…'
                                    : 'Generate ideas'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Angle Details */}
                      <div className="space-y-4">
                        {editingAngle === angle.number ? (
                          <div className="space-y-4">
                            <div>
                              <label htmlFor={`angle-${angle.number}-description`} className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                              <textarea
                                value={angleForm.description}
                                onChange={e => setAngleForm(f => ({ ...f, description: e.target.value }))}
                                rows={3}
                                id={`angle-${angle.number}-description`}
                                aria-label="Angle description"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                placeholder="Angle description"
                              />
                            </div>
                            <div>
                              <label htmlFor={`angle-${angle.number}-objective`} className="block text-xs font-medium text-gray-600 mb-1">Objective</label>
                              <textarea
                                value={angleForm.objective}
                                onChange={e => setAngleForm(f => ({ ...f, objective: e.target.value }))}
                                rows={2}
                                id={`angle-${angle.number}-objective`}
                                aria-label="Angle objective"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                                placeholder="Angle objective"
                              />
                            </div>
                            <div>
                              <label htmlFor={`angle-${angle.number}-tonality`} className="block text-xs font-medium text-gray-600 mb-1">Tonality</label>
                              <input
                                type="text"
                                value={angleForm.tonality}
                                onChange={e => setAngleForm(f => ({ ...f, tonality: e.target.value }))}
                                id={`angle-${angle.number}-tonality`}
                                aria-label="Angle tonality"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                                placeholder="Tone / style"
                              />
                            </div>
                          </div>
                        ) : (
                          isAngleExpanded(angle.number) && (
                            <>
                              {angle.description && (
                                <div className="bg-brand-50 rounded-lg p-4 border-l-4 border-brand-400">
                                  <div className="flex items-center mb-2">
                                    <FileText className="h-4 w-4 text-brand-600 mr-2" />
                                    <h5 className="font-semibold text-brand-900">Description</h5>
                                  </div>
                                  <p className="text-brand-800 leading-relaxed">{angle.description}</p>
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
                            </>
                          )
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
        <>
          <div className="relative mb-2 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search company or platform"
              aria-label="Search strategies by company or platform"
              className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
          <div className="space-y-4">
            {companiesWithStrategies
              .filter(c => {
                if (!search) return true
                const matchName = c.brand_name.toLowerCase().includes(search.toLowerCase())
                const matchPlatform = c.strategies.some(s => getPlatformBadges(s.platforms).some(p => p.toLowerCase().includes(search.toLowerCase())))
                return matchName || matchPlatform
              })
              .map((company) => {
                const collapsed = collapsedCompanies[company.id]
                return (
                  <div key={company.id} className="border border-gray-200 rounded-lg bg-white">
                    <button
                      onClick={() => setCollapsedCompanies(prev => ({ ...prev, [company.id]: !prev[company.id] }))}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      aria-expanded={!collapsed}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-md flex items-center justify-center text-white text-sm font-semibold">
                          {company.brand_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 leading-tight">{company.brand_name}</h3>
                          <p className="text-xs text-gray-500">{company.strategies.length} strateg{company.strategies.length === 1 ? 'y' : 'ies'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="primary" className="text-xs">{company.strategies.length} strateg{company.strategies.length === 1 ? 'y' : 'ies'}</Badge>
                        {collapsed ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                      </div>
                    </button>
                    {!collapsed && (
                      <div className="px-4 pb-4">
                        <ul className="space-y-3 mt-2">
                          {company.strategies.map(strategy => (
                            <StrategyListItem
                              key={strategy.id}
                              strategy={strategy}
                              angleCount={countAngles(strategy)}
                              platforms={getPlatformBadges(strategy.platforms)}
                              onView={(s) => handleViewStrategy(s, company)}
                            />
                          ))}
                        </ul>
                        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
                          <HelpCircle className="h-3 w-3" /> How strategies work
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </>
      ) : (
        /* Empty State */
        <EmptyState
          icon={<FileText className="h-8 w-8 text-white" />}
          title="No strategies"
          message={(
            <>
              <p>No strategies yet. Create one to start planning.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto my-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-brand-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Multi‑platform</h4>
                  <p className="text-sm text-gray-600">Strategies for all your channels</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">AI‑powered</h4>
                  <p className="text-sm text-gray-600">Generated using AI</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-teal-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Brand‑specific</h4>
                  <p className="text-sm text-gray-600">Tailored to your brand</p>
                </div>
              </div>
            </>
          )}
          variant="purple"
          actions={<Button onClick={handleGenerateStrategy} size="lg"><Plus className="h-4 w-4" />Generate your first strategy</Button>}
        />
      )}
    </div>
  )
}
