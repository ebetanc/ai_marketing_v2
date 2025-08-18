import React, { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { ArrowLeft, X, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToast } from '../ui/Toast'
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../ui/Modal'
import { IconButton } from '../ui/IconButton'
import { supabase } from '../../lib/supabase'
import { postToN8n } from '../../lib/n8n'
import { useAsyncCallback } from '../../hooks/useAsync'
import { z } from 'zod'

interface GenerateStrategyModalProps {
  isOpen: boolean
  onClose: () => void
  companies: any[]
  onStrategyGenerated?: () => void
}

const platforms = [
  { id: 'twitter', name: 'Twitter', color: 'bg-blue-500' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-600' },
  { id: 'newsletter', name: 'Newsletter', color: 'bg-gray-600' },
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-700' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-500' },
  { id: 'youtube', name: 'YouTube', color: 'bg-red-500' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'blog', name: 'Blog', color: 'bg-green-600' }
]

export function GenerateStrategyModal({ isOpen, onClose, companies, onStrategyGenerated }: GenerateStrategyModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const companyListRef = useRef<HTMLDivElement | null>(null)
  const [errors, setErrors] = useState<{ company?: string; platforms?: string }>({})
  const { call: runGenerate, loading: isGenerating } = useAsyncCallback(async () => {
    const Schema = z.object({
      companyId: z.string().min(1, 'Select a company.'),
      platforms: z.array(z.string()).min(1, 'Select at least one platform.')
    })
    const parsed = Schema.safeParse({ companyId: selectedCompany?.id ?? '', platforms: selectedPlatforms })
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setErrors({
        company: fieldErrors.companyId?.[0],
        platforms: fieldErrors.platforms?.[0]
      })
      push({ title: 'Fix errors', message: 'Complete the required selections.', variant: 'warning' })
      return
    }
    setErrors({})

    // Identify current user to pass ownership for backend CRUD
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id || null
    // Derive normalized-first brand fields with safe fallbacks
    const brandName: string = selectedCompany.brand_name || selectedCompany.name || 'Unknown Brand'
    const website: string = selectedCompany.website || ''
    const tone: string = (selectedCompany.brand_voice?.tone)
      || selectedCompany.brand_tone
      || ''
    const style: string = (selectedCompany.brand_voice?.style)
      || selectedCompany.key_offer
      || ''
    const keywords: string[] = selectedCompany.brand_voice?.keywords || []

    // Target audience as string (raw) and object (normalized)
    const targetAudienceStr: string = typeof selectedCompany.target_audience === 'string'
      ? selectedCompany.target_audience
      : (selectedCompany.target_audience?.demographics || '')
    const targetAudienceObj: { demographics: string; interests: string[]; pain_points: string[] } = {
      demographics: selectedCompany.target_audience?.demographics || targetAudienceStr || '',
      interests: selectedCompany.target_audience?.interests || [],
      pain_points: selectedCompany.target_audience?.pain_points || []
    }

    const additionalInfo: string = selectedCompany.additional_information || (selectedCompany as any).additionalInfo || ''
    const createdAt: string = selectedCompany.created_at || (selectedCompany as any).createdAt || ''
    const imageGuidelines: string = (selectedCompany as any).imageGuidelines || ''
    // Create platforms array using fixed 8-slot index mapping
    const ORDER = ['twitter', 'linkedin', 'newsletter', 'facebook', 'instagram', 'youtube', 'tiktok', 'blog'] as const
    const platformsPayload = ORDER.map(p => selectedPlatforms.includes(p) ? p : '')

    // Prepare comprehensive brand data payload
    const comprehensiveBrandData = {
      // Basic brand information
      id: selectedCompany.id,
      name: brandName,
      website,

      // Brand voice and tone
      brandTone: tone,
      keyOffer: style,
      brandVoice: {
        tone,
        style,
        keywords
      },

      // Target audience information
      targetAudience: targetAudienceStr,
      target_audience: targetAudienceObj,

      // Additional information
      additionalInfo,
      imageGuidelines,

      // Metadata
      createdAt
    }

    const webhookPayload = {
      identifier: 'generateAngles',
      operation: 'create_strategy_angles',
      // Core identifiers used for CRUD
      company_id: selectedCompany.id,
      meta: {
        user_id: userId,
        source: 'app',
        ts: new Date().toISOString(),
      },
      user_id: userId,
      brand: comprehensiveBrandData,
      platforms: platformsPayload,
      // Additional context for the AI
      context: {
        requestType: 'content_strategy_generation',
        timestamp: new Date().toISOString(),
        platformCount: selectedPlatforms.length,
        brandHasWebsite: !!website,
        brandHasAdditionalInfo: !!additionalInfo,
        brandHasImageGuidelines: !!imageGuidelines,
      },
    }

    const response = await postToN8n('generateAngles', webhookPayload)

    if (!response.ok) {
      throw new Error('Failed to generate content strategy')
    }

    // Read response as text first to handle empty or malformed JSON
    const responseText = await response.text()

    let result
    if (!responseText.trim()) {
      // Handle empty response
      result = {}
    } else {
      try {
        // Attempt to parse as JSON
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.log('Raw response:', responseText)
        // Treat malformed JSON as plain text content
        result = {
          content: {
            title: 'Generated Content Strategy',
            body: responseText
          }
        }
      }
    }

    console.log('Content strategy generation result:', result)

    console.log('Strategy generation and save completed successfully')
    push({ title: 'Generated', message: 'Content strategy created', variant: 'success' })
    onStrategyGenerated?.()
    onClose()
  })
  const { push } = useToast()

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
    setErrors(prev => ({ ...prev, platforms: undefined }))
  }

  const handleGenerateStrategy = () => { void runGenerate() }

  const handleClose = () => {
    setSelectedPlatforms([])
    setSelectedCompany(null)
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} labelledById="generate-strategy-title" size="md">
      <div className="w-full max-h-[90vh] flex flex-col overflow-hidden">
        <ModalHeader>
          <div className="flex items-center space-x-4">
            <IconButton onClick={handleClose} aria-label="Back" variant="ghost">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </IconButton>
            <div>
              <ModalTitle id="generate-strategy-title" className="text-base">Generate content strategy</ModalTitle>
              <div className="text-xs text-gray-500">{selectedCompany ? 'Back' : 'Close'}</div>
            </div>
          </div>
          <IconButton onClick={handleClose} aria-label="Close dialog" variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </ModalHeader>

        {/* Brand Info */}
        {selectedCompany && (
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                <span className="text-brand-600 font-semibold text-sm">
                  {(selectedCompany.brand_name || selectedCompany.name || 'B').charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{selectedCompany.brand_name || selectedCompany.name || 'Brand'}</h3>
                <p className="text-sm text-gray-500">{selectedCompany.website || ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <ModalBody className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          {/* Title moved to ModalHeader via ModalTitle */}
          <p className="text-gray-600 mb-6">Create AI angles for your selected brand.</p>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select company</h3>
            <p id="company-helper" className="text-xs text-gray-500 mb-3">Pick which brand to generate a strategy for.</p>
            <div
              ref={companyListRef}
              role="radiogroup"
              aria-labelledby="company-helper"
              aria-invalid={errors.company ? true : undefined}
              aria-errormessage={errors.company ? 'company-error' : undefined}
              className="space-y-2"
            >
              {companies.map((company, index) => {
                const isSelected = selectedCompany?.id === company.id
                const isFirst = index === 0
                const tabIndex = isSelected || (!selectedCompany && isFirst) ? 0 : -1
                return (
                  <button
                    key={company.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={tabIndex}
                    onClick={() => { setSelectedCompany(company); setErrors(prev => ({ ...prev, company: undefined })) }}
                    onKeyDown={(e) => {
                      const container = companyListRef.current
                      if (!container) return
                      const items = Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="radio"]'))
                      const currentIndex = items.indexOf(e.currentTarget)
                      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                        e.preventDefault()
                        const next = items[(currentIndex + 1) % items.length]
                        next?.focus()
                      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                        e.preventDefault()
                        const prev = items[(currentIndex - 1 + items.length) % items.length]
                        prev?.focus()
                      } else if (e.key === ' ' || e.key === 'Enter') {
                        // Space/Enter should select
                        e.preventDefault()
                        setSelectedCompany(company)
                        setErrors(prev => ({ ...prev, company: undefined }))
                      }
                    }}
                    className={cn(
                      'w-full p-3 rounded-xl border-2 transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center">
                        <span className="text-brand-600 font-semibold text-xs">
                          {(company.brand_name || company.name || 'B').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.brand_name || company.name}</p>
                        {company.website && (
                          <p className="text-xs text-gray-500">{company.website}</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
              {errors.company && (
                <div id="company-error" className="text-sm text-red-600 mt-2">{errors.company}</div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select platforms</h3>
            <p id="platforms-helper" className="text-xs text-gray-500 mb-3">Choose where to publish content.</p>
            <div
              role="group"
              aria-labelledby="platforms-helper"
              aria-invalid={errors.platforms ? true : undefined}
              aria-errormessage={errors.platforms ? 'platforms-error' : undefined}
              className="grid grid-cols-2 gap-3"
            >
              {platforms.map((platform) => {
                const active = selectedPlatforms.includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    aria-pressed={active}
                    onClick={() => togglePlatform(platform.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault()
                        togglePlatform(platform.id)
                      }
                    }}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
                      active
                        ? `${platform.color} text-white border-transparent shadow-md`
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                    )}
                  >
                    {platform.name}
                  </button>
                )
              })}
            </div>
            {errors.platforms && (
              <div id="platforms-error" className="text-sm text-red-600 mt-2">{errors.platforms}</div>
            )}
          </div>

          <Button
            onClick={handleGenerateStrategy}
            loading={isGenerating}
            disabled={!selectedCompany || selectedPlatforms.length === 0}
            size="lg"
            className="w-full"
            variant="primary"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate strategy
              </>
            )}
          </Button>
        </ModalBody>
      </div>
    </Modal>
  )
}
