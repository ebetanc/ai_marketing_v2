import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Card, CardContent } from '../ui/Card'
import { X, ArrowLeft, ArrowRight, Sparkles, Globe, Database } from 'lucide-react'
import { cn } from '../../lib/utils'
import { db } from '../../lib/firebase'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'

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
  const [brandIdToLoad, setBrandIdToLoad] = useState('')
  const [loadFromFirebaseLoading, setLoadFromFirebaseLoading] = useState(false)
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

      if (!response.ok) {
        throw new Error('Failed to fetch brand analysis')
      }

      const data = await response.json()
      
      setFormData(prev => ({
        ...prev,
        targetAudience: data.targetAudience || prev.targetAudience,
        brandTone: data.brandTone || prev.brandTone,
        keyOffer: data.keyOffer || prev.keyOffer
      }))
    } catch (error) {
      console.error('Autofill error:', error)
      alert('Failed to analyze website. Please fill out the fields manually.')
    } finally {
      setAutofillLoading(false)
    }
  }

  const handleLoadFromFirebase = async () => {
    if (!brandIdToLoad.trim()) {
      alert('Please enter a Brand ID')
      return
    }

    setLoadFromFirebaseLoading(true)
    try {
      const docRef = doc(db, 'brands', brandIdToLoad.trim())
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          website: data.website || prev.website,
          additionalInfo: data.additionalInfo || prev.additionalInfo,
          targetAudience: data.targetAudience || prev.targetAudience,
          brandTone: data.brandTone || prev.brandTone,
          keyOffer: data.keyOffer || prev.keyOffer,
          imageGuidelines: data.imageGuidelines || prev.imageGuidelines
        }))
        alert('Brand data loaded successfully!')
      } else {
        alert('No brand found with that ID')
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error)
      alert('Failed to load brand data. Please try again.')
    } finally {
      setLoadFromFirebaseLoading(false)
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
      // Send to webhook instead of Firebase
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
      
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_URL}/content-saas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(brandData)
      })
      
      console.log('Webhook response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`)
      }
      
      // Handle response
      const responseText = await response.text()
      console.log('Webhook response:', responseText)
      
      let result
      if (responseText.trim()) {
        try {
          result = JSON.parse(responseText)
        } catch (parseError) {
          console.log('Response is not JSON, treating as text:', responseText)
          result = { message: responseText }
        }
      } else {
        result = { message: 'Brand created successfully' }
      }
      
      console.log('Brand creation result:', result)
      alert('Brand created successfully!')
      
      // Create the company using the createCompany function passed from parent
      await createCompany({
        name: formData.name,
        brand_voice: {
          tone: formData.brandTone,
          style: formData.keyOffer,
          keywords: formData.keyOffer.split(' ').slice(0, 4) // Extract keywords from key offer
        },
        target_audience: {
          demographics: formData.targetAudience,
          interests: [],
          pain_points: []
        }
      })
      
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
    setBrandIdToLoad('')
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

                {/* Load from Firebase section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Database className="h-5 w-5 mr-2 text-purple-600" />
                    Load Existing Brand Data
                  </h3>
                  <div className="flex space-x-3">
                    <Input
                      placeholder="Enter Brand ID from Firebase"
                      value={brandIdToLoad}
                      onChange={(e) => setBrandIdToLoad(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLoadFromFirebase}
                      loading={loadFromFirebaseLoading}
                      disabled={!brandIdToLoad.trim()}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Load
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a Firebase document ID to load existing brand data into the form
                  </p>
                </div>
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