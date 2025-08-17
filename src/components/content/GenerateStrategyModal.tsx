import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { ArrowLeft, X, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToast } from '../ui/Toast'
import { Modal } from '../ui/Modal'
import { IconButton } from '../ui/IconButton'
import { supabase } from '../../lib/supabase'
import { postToN8n } from '../../lib/n8n'

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
  const [isGenerating, setIsGenerating] = useState(false)
  const { push } = useToast()

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleGenerateStrategy = async () => {
    if (!selectedCompany) {
      push({ title: 'Missing company', message: 'Please select a company', variant: 'warning' })
      return
    }

    if (selectedPlatforms.length === 0) {
      push({ title: 'Missing platforms', message: 'Select at least one platform', variant: 'warning' })
      return
    }

    setIsGenerating(true)

    try {
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

    } catch (error) {
      console.error('Error generating content strategy:', error)
      console.error('Full error details:', error)
      push({ title: 'Generation failed', message: 'Please try again', variant: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedPlatforms([])
    setSelectedCompany(null)
    setIsGenerating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} labelledById="generate-strategy-title">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <IconButton onClick={handleClose} aria-label="Back" variant="ghost">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </IconButton>
            <div className="text-sm text-gray-500">Back to Dashboard</div>
          </div>

          <IconButton onClick={handleClose} aria-label="Close dialog" variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Brand Info */}
        {selectedCompany && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {(selectedCompany.brand_name || selectedCompany.name || 'B').charAt(0)}
                </span>
              </div>
              <div>
                <h3 id="generate-strategy-title" className="font-medium text-gray-900">{selectedCompany.brand_name || selectedCompany.name || 'Brand'}</h3>
                <p className="text-sm text-gray-500">{selectedCompany.website || ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 p-6 text-center overflow-y-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Generate Content Strategy</h2>
          <p className="text-gray-600 mb-6">
            Create AI-powered content angles for your selected brand to guide your content creation
          </p>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Company:</h3>
            <div className="space-y-2">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 transition-all duration-200 text-left',
                    selectedCompany?.id === company.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
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
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Platforms:</h3>
            <div className="grid grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium',
                    selectedPlatforms.includes(platform.id)
                      ? `${platform.color} text-white border-transparent shadow-md`
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  )}
                >
                  {platform.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerateStrategy}
            loading={isGenerating}
            disabled={!selectedCompany || selectedPlatforms.length === 0}
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Generating Strategy...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Strategy
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
