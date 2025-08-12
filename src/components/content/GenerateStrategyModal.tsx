import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { ArrowLeft, X, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GenerateStrategyModalProps {
  isOpen: boolean
  onClose: () => void
  companies: any[]
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

export function GenerateStrategyModal({ isOpen, onClose, companies }: GenerateStrategyModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleGenerateStrategy = async () => {
    if (!selectedCompany) {
      alert('Please select a company')
      return
    }

    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }

    setIsGenerating(true)

    try {
      // Prepare comprehensive brand data payload
      const comprehensiveBrandData = {
        // Basic brand information
        id: selectedCompany.id,
        name: selectedCompany.brand_name || selectedCompany.name || 'Unknown Brand',
        website: selectedCompany.website || '',

        // Brand voice and tone
        brandTone: selectedCompany.brand_tone || selectedCompany.brandTone || selectedCompany.brand_voice?.tone || '',
        keyOffer: selectedCompany.key_offer || selectedCompany.keyOffer || selectedCompany.brand_voice?.style || '',
        brandVoice: {
          tone: selectedCompany.brand_tone || selectedCompany.brandTone || selectedCompany.brand_voice?.tone || '',
          style: selectedCompany.key_offer || selectedCompany.keyOffer || selectedCompany.brand_voice?.style || '',
          keywords: selectedCompany.brand_voice?.keywords || []
        },

        // Target audience information
        targetAudience: selectedCompany.target_audience || selectedCompany.targetAudience || selectedCompany.target_audience?.demographics || '',
        target_audience: {
          demographics: selectedCompany.target_audience || selectedCompany.targetAudience || selectedCompany.target_audience?.demographics || '',
          interests: selectedCompany.target_audience?.interests || [],
          pain_points: selectedCompany.target_audience?.pain_points || []
        },

        // Additional information
        additionalInfo: selectedCompany.additional_information || selectedCompany.additionalInfo || '',
        imageGuidelines: selectedCompany.imageGuidelines || '',

        // Metadata
        createdAt: selectedCompany.createdAt || selectedCompany.created_at || '',

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
          brandHasWebsite: !!(selectedCompany.website),
          brandHasAdditionalInfo: !!(selectedCompany.additional_information || selectedCompany.additionalInfo),
          brandHasImageGuidelines: !!(selectedCompany.imageGuidelines)
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

      // Save the generated content to Firebase
      await saveGeneratedContentToFirebase(result)

      console.log('Strategy generation and save completed successfully')
      alert('Content strategy generated and saved to Firebase successfully!')
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
    setSelectedCompany(null)
    setIsGenerating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
        {selectedCompany && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
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
        <div className="p-6 text-center">
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
    </div>
  )
}
