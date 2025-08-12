import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { ArrowLeft, X, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GenerateStrategyModalProps {
  isOpen: boolean
  onClose: () => void
  selectedBrand: any
  onStrategyGenerated?: (strategyData: any) => void
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

export function GenerateStrategyModal({ isOpen, onClose, selectedBrand }: GenerateStrategyModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleGenerateStrategy = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    setIsGenerating(true)

    try {
      // Prepare comprehensive brand data payload
      const comprehensiveBrandData = {
        // Basic brand information
        id: selectedBrand.id,
        name: selectedBrand.brand_name || selectedBrand.name || 'Unknown Brand',
        website: selectedBrand.website || '',

        // Brand voice and tone
        brandTone: selectedBrand.brand_tone || selectedBrand.brandTone || selectedBrand.brand_voice?.tone || '',
        keyOffer: selectedBrand.key_offer || selectedBrand.keyOffer || selectedBrand.brand_voice?.style || '',
        brandVoice: {
          tone: selectedBrand.brand_tone || selectedBrand.brandTone || selectedBrand.brand_voice?.tone || '',
          style: selectedBrand.key_offer || selectedBrand.keyOffer || selectedBrand.brand_voice?.style || '',
          keywords: selectedBrand.brand_voice?.keywords || []
        },

        // Target audience information
        targetAudience: selectedBrand.target_audience || selectedBrand.targetAudience || selectedBrand.target_audience?.demographics || '',
        target_audience: {
          demographics: selectedBrand.target_audience || selectedBrand.targetAudience || selectedBrand.target_audience?.demographics || '',
          interests: selectedBrand.target_audience?.interests || [],
          pain_points: selectedBrand.target_audience?.pain_points || []
        },

        // Additional information
        additionalInfo: selectedBrand.additional_information || selectedBrand.additionalInfo || '',
        imageGuidelines: selectedBrand.imageGuidelines || '',

        // Metadata
        createdAt: selectedBrand.createdAt || selectedBrand.created_at || '',

        // Platform-specific data
        selectedPlatforms: selectedPlatforms,
        platformCount: selectedPlatforms.length
      }

      const webhookPayload = {
        identifier: "generateAngles",
        brand: comprehensiveBrandData,
        platforms: selectedPlatforms,
        // Additional context for the AI
        context: {
          requestType: 'content_strategy_generation',
          timestamp: new Date().toISOString(),
          platformCount: selectedPlatforms.length,
          brandHasWebsite: !!(selectedBrand.website),
          brandHasAdditionalInfo: !!(selectedBrand.additionalInfo),
          brandHasImageGuidelines: !!(selectedBrand.imageGuidelines)
        }
      }

      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })

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

      // Call the callback with the generated strategy data
      if (onStrategyGenerated) {
        const strategyData = {
          platforms: selectedPlatforms,
          angles: result.angles || [],
          ...result
        }
        onStrategyGenerated(strategyData)
      }

      console.log('Strategy generation completed successfully')
      onClose()

    } catch (error) {
      console.error('Error generating content strategy:', error)
      console.error('Full error details:', error)
      alert('Failed to generate content strategy. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setSelectedPlatforms([])
    setIsGenerating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-sm text-gray-500">Back to Dashboard</div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Brand Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {selectedBrand?.name?.charAt(0) || 'B'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{selectedBrand?.name || 'Brand'}</h3>
              <p className="text-sm text-gray-500">{selectedBrand?.website || ''}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">Generate Content Strategy</h2>
          <p className="text-gray-600 mb-8">
            Create AI-powered content angles for {selectedBrand?.name || 'your brand'} to guide your content creation
          </p>

          <div className="mb-8">
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
            disabled={selectedPlatforms.length === 0}
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
    </div>
  )
}
