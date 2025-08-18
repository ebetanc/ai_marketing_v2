import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { X, ArrowLeft, ArrowRight, Sparkles, Globe } from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase, type TablesInsert } from '../../lib/supabase'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { IconButton } from '../ui/IconButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { postToN8n } from '../../lib/n8n'

interface CreateBrandModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
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

export function CreateBrandModal({ isOpen, onClose, onSubmit, refetchCompanies }: CreateBrandModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [autofillLoading, setAutofillLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    website: '',
    additionalInfo: '',
    targetAudience: '',
    brandTone: '',
    keyOffer: '',
    imageGuidelines: ''
  })
  const { push } = useToast()

  const handleAutofill = async () => {
    if (!formData.website) {
      push({ title: 'Missing URL', message: 'Please enter a website URL', variant: 'warning' })
      return
    }

    setAutofillLoading(true)
    try {
      console.log('=== AUTOFILL WEBHOOK REQUEST ===')
      console.log('Sending autofill request for website:', formData.website)

      const response = await postToN8n('autofill', {
        operation: 'company_autofill',
        website: formData.website,
        brandName: formData.name,
        additionalInfo: formData.additionalInfo,
        meta: {
          user_id: (await supabase.auth.getSession()).data.session?.user.id || null,
          source: 'app',
          ts: new Date().toISOString(),
        },
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
      push({ title: 'Analyzed', message: 'Fields updated from website', variant: 'success' })

    } catch (error) {
      console.error('Autofill error:', error)
      push({ title: 'Analysis failed', message: `${error instanceof Error ? error.message : 'Unknown error'}. Fill fields manually.`, variant: 'error' })
    } finally {
      setAutofillLoading(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !formData.name) {
      push({ title: 'Missing name', message: 'Please enter a brand name', variant: 'warning' })
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
      push({ title: 'Missing fields', message: 'Please complete all required fields', variant: 'warning' })
      return
    }

    setSubmitLoading(true)

    try {
      // Ensure website conforms to DB URL check (must start with http/https)
      const normalizedWebsite = formData.website && formData.website.trim().length > 0
        ? (/^https?:\/\//i.test(formData.website.trim()) ? formData.website.trim() : `https://${formData.website.trim()}`)
        : ''

      const brandData: TablesInsert<'companies'> = {
        brand_name: formData.name,
        website: normalizedWebsite || null,
        additional_information: formData.additionalInfo,
        target_audience: formData.targetAudience,
        brand_tone: formData.brandTone,
        key_offer: formData.keyOffer
      }

      console.log('Creating company in Supabase:', brandData)

      const { data, error } = await supabase
        .from('companies')
        .insert([brandData])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        push({ title: 'Create failed', message: `${error.message}`, variant: 'error' })
        return
      }

      console.log('Company created successfully:', data)
      push({ title: 'Created', message: 'Company added', variant: 'success' })

      // Reset form and close modal
      resetForm()
      refetchCompanies() // Refresh the companies list
      onSubmit()

    } catch (error) {
      console.error('Error creating company:', error)
      push({ title: 'Create failed', message: 'Please try again', variant: 'error' })
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
    const isDirty = Object.values(formData).some(v => String(v || '').trim().length > 0)
    if (isDirty) {
      setConfirmOpen(true)
      return
    }
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const titleId = 'create-brand-title'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} labelledById={titleId}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <IconButton onClick={handleClose} aria-label="Back to dashboard" variant="ghost">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </IconButton>
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
              <div id={titleId} className="ml-3 text-gray-600 font-medium">Create Company</div>
            </div>
          </div>

          <IconButton onClick={handleClose} aria-label="Close dialog" variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-8 overflow-y-auto">
          {currentStep === 1 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              </div>

              <div className="space-y-6">
                <Input
                  label="Company Name"
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
                  <Sparkles className="h-4 w-4" />
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
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="submit"
                    loading={submitLoading}
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    Create Company
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          resetForm()
          onClose()
        }}
        title="Discard changes?"
        message="You have unsaved changes. Do you want to discard them?"
        confirmText="Discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </Modal>
  )
}
