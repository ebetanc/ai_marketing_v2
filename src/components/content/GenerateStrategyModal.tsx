import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { ArrowLeft, X, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

interface GenerateStrategyModalProps {
  isOpen: boolean
  onClose: () => void
  selectedBrand: any
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
        name: selectedBrand.name || 'Unknown Brand',
        website: selectedBrand.website || '',

        // Brand voice and tone
        brandTone: selectedBrand.brandTone || selectedBrand.brand_voice?.tone || '',
        keyOffer: selectedBrand.keyOffer || selectedBrand.brand_voice?.style || '',
        brandVoice: {
          tone: selectedBrand.brandTone || selectedBrand.brand_voice?.tone || '',
          style: selectedBrand.keyOffer || selectedBrand.brand_voice?.style || '',
          keywords: selectedBrand.brand_voice?.keywords || []
        },

        // Target audience information
        targetAudience: selectedBrand.targetAudience || selectedBrand.target_audience?.demographics || '',
        target_audience: {
          demographics: selectedBrand.targetAudience || selectedBrand.target_audience?.demographics || '',
          interests: selectedBrand.target_audience?.interests || [],
          pain_points: selectedBrand.target_audience?.pain_points || []
        },

        // Additional information
        additionalInfo: selectedBrand.additionalInfo || '',
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

  const saveGeneratedContentToFirebase = async (webhookResponse: any) => {
    try {
      // Import Firebase functions
      const { collection, addDoc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')

      console.log('Saving strategy and content pieces to Firebase...')
      console.log('Webhook response:', webhookResponse)

      // First, create the main strategy document
      const strategyData = {
        id: `strategy_${Date.now()}`,
        brand_id: selectedBrand.id,
        brand_name: selectedBrand.name || 'Unknown Brand',
        title: `Content Strategy for ${selectedBrand.name || 'Brand'}`,
        type: 'content_strategy',
        status: 'draft',
        body: JSON.stringify(webhookResponse, null, 2),
        platforms: selectedPlatforms,
        metadata: {
          prompt: `Generated for platforms: ${selectedPlatforms.join(', ')}`,
          generated_at: new Date().toISOString(),
          platform_count: selectedPlatforms.length,
          webhook_response: webhookResponse,
          content_pieces_count: Array.isArray(webhookResponse) ? webhookResponse.length : 1
        },
        created_at: new Date().toISOString()
      }

      console.log('Strategy data to save:', strategyData)

      // Save strategy to Firebase
      const docRef = await addDoc(collection(db, 'strategy'), strategyData)
      console.log('Strategy saved to Firebase with ID:', docRef.id)

      // Now save individual content pieces for each platform
      if (Array.isArray(webhookResponse)) {
        console.log('Saving individual content pieces for each platform...')
        console.log('Strategy document ID for linking:', docRef.id)

        for (let i = 0; i < webhookResponse.length; i++) {
          const item = webhookResponse[i]
          console.log(`Processing platform ${i + 1}:`, item)

          // Map platform to content type
          const getContentType = (platform: string) => {
            const platformLower = (platform || '').toLowerCase()
            switch (platformLower) {
              case 'twitter':
              case 'linkedin':
              case 'facebook':
              case 'instagram':
              case 'tiktok':
                return 'social_post'
              case 'newsletter':
                return 'email'
              case 'blog':
                return 'blog_post'
              default:
                return 'social_post'
            }
          }

          const contentPieceData = {
            id: `content_${Date.now()}_${i}`,
            brand_id: selectedBrand.id,
            brand_name: selectedBrand.name || 'Unknown Brand',
            title: `${item.platform || 'Platform'} Content for ${selectedBrand.name || 'Brand'}`,
            type: getContentType(item.platform),
            status: 'draft',
            body_text: item.content || JSON.stringify(item),
            body: JSON.stringify(item, null, 2),
            platform: item.platform || `platform_${i + 1}`,
            strategy_id: docRef.id, // Link to the main strategy
            metadata: {
              prompt: `Generated ${item.platform} content for strategy`,
              generated_at: new Date().toISOString(),
              word_count: (item.content || '').split(' ').length,
              parent_strategy_id: docRef.id,
              platform_specific: true
            },
            created_at: new Date().toISOString()
          }

          console.log(`Saving ${item.platform || 'platform'} content piece:`, contentPieceData)

          // Save content piece to Firebase
          const contentDocRef = await addDoc(collection(db, 'content'), contentPieceData)
          console.log(`${item.platform || 'platform'} content saved to Firebase with ID:`, contentDocRef.id)

          // Add a small delay to ensure unique timestamps
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log('All content pieces saved successfully to Firebase')
      } else {
        console.log('Webhook response is not an array, saving as single content piece')

        // If not an array, save as single content piece
        const contentPieceData = {
          id: `content_${Date.now()}`,
          brand_id: selectedBrand.id,
          brand_name: selectedBrand.name || 'Unknown Brand',
          title: `Generated Content for ${selectedBrand.name || 'Brand'}`,
          type: 'content_strategy',
          status: 'draft',
          body_text: typeof webhookResponse === 'string' ? webhookResponse : JSON.stringify(webhookResponse, null, 2),
          body: typeof webhookResponse === 'string' ? webhookResponse : JSON.stringify(webhookResponse, null, 2),
          strategy_id: docRef.id,
          metadata: {
            prompt: `Generated content for strategy`,
            generated_at: new Date().toISOString(),
            word_count: (typeof webhookResponse === 'string' ? webhookResponse : JSON.stringify(webhookResponse)).split(' ').length,
            parent_strategy_id: docRef.id
          },
          created_at: new Date().toISOString()
        }

        const contentDocRef = await addDoc(collection(db, 'content'), contentPieceData)
        console.log('Single content piece saved to Firebase with ID:', contentDocRef.id)
      }

      console.log('Strategy and all content pieces saved successfully to Firebase')
    } catch (error) {
      console.error('Error saving to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error details:', error.message)
      }
      throw error
    }
  }

  const processWebhookResponse = (response: any) => {
    // This function is no longer used since we're saving directly in saveGeneratedContentToFirebase
    console.log('processWebhookResponse called with:', response)
    return response
  }

  const generateContentTitle = (item: any, index: number, brand: any) => {
    // If item has a title, use it
    if (item.title) return item.title

    // Check if this is a content strategy with angles
    if (item.angles && Array.isArray(item.angles)) {
      return `Content Strategy for ${brand?.name || 'Brand'} (${item.angles.length} Angles)`
    }

    // Check if the item itself is part of an angles array or strategy
    if (item.header || item.description || item.contentStructure) {
      return `Content Angle ${index + 1} for ${brand?.name || 'Brand'}`
    }

    // Default titles based on type
    if (item.platform) {
      return `${item.platform.charAt(0).toUpperCase() + item.platform.slice(1)} Content for ${brand?.name || 'Brand'}`
    }

    return `Generated Content for ${brand?.name || 'Brand'}`
  }

  const determineContentType = (item: any, fullResponse?: any) => {
    // Check if this is a content strategy
    if (item.angles && Array.isArray(item.angles)) {
      return 'content_strategy'
    }

    // Check if the full response contains angles (indicating this is part of a strategy)
    if (fullResponse?.angles && Array.isArray(fullResponse.angles)) {
      return 'content_strategy'
    }

    // Check if item has strategy-like properties
    if (item.contentStructure || item.growthPlan || item.publishingSchedule) {
      return 'content_strategy'
    }

    // Existing logic for other content types
    if (item.type) return item.type
    if (item.platform) {
      switch (item.platform.toLowerCase()) {
        case 'twitter':
        case 'linkedin':
        case 'facebook':
        case 'instagram':
        case 'tiktok':
          return 'social_post'
        case 'newsletter':
          return 'email'
        case 'blog':
          return 'blog_post'
        default:
          return 'blog_post'
      }
    }

    // Default to content_strategy for generated content from this modal
    return 'content_strategy'
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
