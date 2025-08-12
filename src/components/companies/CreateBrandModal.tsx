import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Card, CardContent } from '../ui/Card'
import { X, ArrowLeft, ArrowRight, Sparkles, Globe, Database } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CreateBrandModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  loading: boolean
  createCompany: (companyData: any) => Promise<any>
  refetchCompanies: () => void
}

interface BrandFormData {
  name: string
  website: string
  additionalInfo: string
  targetAudience: string
  brandTone: string
  keyOffer: string
  imageGuidelines: string
}

export function CreateBrandModal({ isOpen, onClose, onSubmit, loading, createCompany, refetchCompanies }: CreateBrandModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [autofillLoading, setAutofillLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    website: '',
    additionalInfo: '',
    targetAudience: '',
    brandTone: '',
    keyOffer: '',
    imageGuidelines: ''
  })

  const handleAutofill = async () => {
    if (!formData.website) {
      alert('Please enter a website URL first')
      return
    }

    setAutofillLoading(true)
    try {
      console.log('=== AUTOFILL WEBHOOK REQUEST ===')
      console.log('Sending autofill request for website:', formData.website)
      
      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: 'autofill',
          website: formData.website,
          brandName: formData.name,
          additionalInfo: formData.additionalInfo
        })
      })

      console.log('Autofill webhook response status:', response.status)
      console.log('Autofill webhook response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`)
      }

      const responseText = await response.text()
      console.log('Raw autofill webhook response:', responseText)

      if (!responseText) {
        throw new Error('Empty response from server')
      }

      let data
      try {
        data = JSON.parse(responseText)
        console.log('Parsed autofill webhook response:', data)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.error('Raw response text:', responseText)
        throw new Error('Invalid JSON response from server')
      }

      console.log('=== UPDATING FORM DATA ===')
      console.log('Target Audience from webhook:', data.targetAudience)
      console.log('Brand Tone from webhook:', data.brandTone)
      console.log('Key Offer from webhook:', data.keyOffer)

      setFormData(prev => ({
        ...prev,
        targetAudience: data.targetAudience ? String(data.targetAudience).replace(/^"|"$/g, '') : prev.targetAudience,
        brandTone: data.brandTone ? String(data.brandTone).replace(/^"|"$/g, '') : prev.brandTone,
        keyOffer: data.keyOffer ? String(data.keyOffer).replace(/^"|"$/g, '') : prev.keyOffer
      }))

      console.log('Form data updated successfully')
      alert('Website analysis completed! Form fields have been updated.')
      
    } catch (error) {
      console.error('Autofill error:', error)
      alert(`Failed to analyze website: ${error instanceof Error ? error.message : 'Unknown error'}. Please fill out the fields manually.`)
    } finally {
      setAutofillLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.name) {
      alert('Please enter a brand name')
      return
    }
    setCurrentStep(2)
  }

  const handlePrevious = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.targetAudience || !formData.brandTone || !formData.keyOffer) {
      alert('Please fill out all required fields')
      return
    }

    setSubmitLoading(true)

    try {
      const brandData = {
        name: formData.name,
        website: formData.website,
        additionalInfo: formData.additionalInfo,
        targetAudience: formData.targetAudience,
        brandTone: formData.brandTone,
        keyOffer: formData.keyOffer,
        imageGuidelines: formData.imageGuidelines,
        createdAt: new Date().toISOString()
      }

      console.log('Sending brand data to webhook:', brandData)

      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/dacf25b7-b505-4b10-a6f7-a2ac0e21a1ec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData)
      })

      console.log('Webhook response status:', response.status)

      if (!response.ok) {
        console.error('Webhook request failed with status:', response.status)
        alert('Failed to create company. Please try again.')
        return
      }

      console.log('Brand data sent to webhook successfully')
      alert('Company created successfully!')

      // Reset form and close modal
      resetForm()
      refetchCompanies() // Refresh the companies list
      onSubmit()

    } catch (error) {
      console.error('Error creating company:', error)
      alert('Failed to create company. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      additionalInfo: '',
      targetAudience: '',
      brandTone: '',
      keyOffer: '',
      imageGuidelines: ''
    })
    setCurrentStep(1)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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

            {/* Step Indicators */}
            <div className="flex items-center space-x-3 ml-8">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 1
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-600"
              )}>
                1
              </div>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStep === 2
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-600"
              )}>
                2
              </div>
              <div className="ml-3 text-gray-600 font-medium">Create Brand</div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              </div>

              <div className="space-y-6">
                <Input
                  label="Brand Name"
                  placeholder="Enter brand name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />

                <Input
                  label="Website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />

                <Textarea
                  label="Additional Information (Optional)"
                  placeholder="Any additional context about the brand..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  rows={4}
                />

              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Details</h2>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="text-sm">Let AI help you fill this out</span>
                    <span className="text-xs text-gray-500 ml-2">We can analyze your website to suggest brand details</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAutofill}
                  loading={autofillLoading}
                  disabled={!formData.website}
                  className="flex items-center"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Autofill
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  label="Target Audience"
                  placeholder="Describe your target audience..."
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                  required
                />

                <Textarea
                  label="Brand Tone"
                  placeholder="Describe your brand's tone and personality..."
                  value={formData.brandTone}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandTone: e.target.value }))}
                  rows={3}
                  required
                />

                <Textarea
                  label="Key Offer"
                  placeholder="What is your main value proposition?"
                  value={formData.keyOffer}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyOffer: e.target.value }))}
                  rows={3}
                  required
                />

                <Textarea
                  label="Image Guidelines (Optional)"
                  placeholder="Any specific guidelines for generated images..."
                  value={formData.imageGuidelines}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageGuidelines: e.target.value }))}
                  rows={3}
                />

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePrevious}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    type="submit"
                    loading={submitLoading}
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    Create Brand
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
