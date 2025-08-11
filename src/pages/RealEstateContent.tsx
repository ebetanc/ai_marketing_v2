import React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Building2, Home, MapPin, TrendingUp, Users, FileText, X, Link, Sparkles } from 'lucide-react'

export function RealEstateContent() {
  const [showUrlModal, setShowUrlModal] = useState(false)
  const [url, setUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateContent = async () => {
    if (!url.trim()) {
      alert('Please enter a URL')
      return
    }

    setIsGenerating(true)
    
    try {
      console.log('Sending URL to webhook:', url)
      
      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/1776dcc3-2b3e-4cfa-abfd-0ad9cabaf6ea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          timestamp: new Date().toISOString(),
          source: 'real_estate_content_agent'
        })
      })

      console.log('Webhook response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`)
      }

      const result = await response.text()
      console.log('Webhook response:', result)
      
      alert('Real estate content generation started! Come back later to get the URL of the content generated.')
      setShowUrlModal(false)
      setUrl('')
    } catch (error) {
      console.error('Error generating content:', error)
      alert(`Failed to generate content: ${error.message || 'Please try again.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCloseModal = () => {
    setShowUrlModal(false)
    setUrl('')
    setIsGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Content Agent</h1>
          <p className="mt-2 text-gray-600">
            Generate specialized content for real estate professionals, agents, and property businesses.
          </p>
        </div>
        <Button onClick={() => setShowUrlModal(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Generate Real Estate Content
        </Button>
      </div>

      {/* URL Input Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <Link className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enter Property URL</h2>
                  <p className="text-sm text-gray-500">Provide a URL to analyze and generate content</p>
                </div>
              </div>
              
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isGenerating}
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <Input
                label="Property or Real Estate URL"
                placeholder="https://example.com/property-listing"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isGenerating}
              />
              
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> You can enter URLs for property listings, real estate websites, 
                  or any real estate-related page to generate targeted content.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateContent}
                loading={isGenerating}
                disabled={!url.trim() || isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Real Estate Content Generator</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Create compelling content tailored specifically for real estate professionals, 
            including property listings, market insights, client communications, and marketing materials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Property Listings</h4>
              <p className="text-sm text-gray-600">Generate compelling property descriptions and listings</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Market Analysis</h4>
              <p className="text-sm text-gray-600">Create market reports and trend analysis content</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Client Communication</h4>
              <p className="text-sm text-gray-600">Craft professional emails and client updates</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-6 max-w-lg mx-auto">
            <h4 className="font-semibold text-gray-900 mb-3">Content Types Available:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Property listing descriptions</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Neighborhood guides and area insights</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span>Market trend reports and analysis</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Social media posts for real estate</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                <span>Client newsletters and updates</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span>Blog posts about buying/selling tips</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}