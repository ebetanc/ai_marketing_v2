import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { X, ArrowLeft, ArrowRight, Sparkles, Globe } from 'lucide-react'
import { supabase, type TablesInsert } from '../../lib/supabase'
import { Modal, ModalBody, ModalHeader, ModalTitle } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { IconButton } from '../ui/IconButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { postToN8n } from '../../lib/n8n'
import { useAsyncCallback } from '../../hooks/useAsync'
import { z } from 'zod'

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
  const [errors, setErrors] = useState<{ name?: string; targetAudience?: string; brandTone?: string; keyOffer?: string; website?: string }>({})

  // Zod schema for basic validation. Website is optional but must be a URL if provided.
  const BrandSchema = z.object({
    name: z.string().trim().min(1, 'Company name is required'),
    website: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .pipe(z.string().url('Enter a valid URL (e.g. https://example.com)').optional()),
    additionalInfo: z.string().optional(),
    targetAudience: z.string().trim().min(1, 'Target audience is required'),
    brandTone: z.string().trim().min(1, 'Brand tone is required'),
    keyOffer: z.string().trim().min(1, 'Key offer is required'),
    imageGuidelines: z.string().optional()
  })
  const { call: runAutofill, loading: autofillLoading } = useAsyncCallback(async () => {
    if (!formData.website) {
      push({ title: 'Missing URL', message: 'Enter a website URL.', variant: 'warning' })
      return
    }

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
      throw new Error('Empty server response')
    }

    let data
    try {
      data = JSON.parse(responseText)
      console.log('Parsed autofill webhook response:', data)
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError)
      console.error('Raw response text:', responseText)
      throw new Error('Invalid server response')
    }

    console.log('=== UPDATING FORM DATA ===')
    console.log('Target Audience from webhook:', data.targetAudience)
    console.log('Brand Tone from webhook:', data.brandTone)
    console.log('Key Offer from webhook:', data.keyOffer)

    const stripQuotes = (s: unknown) => {
      const str = String(s).trim()
      if (!str) return str
      const firstCode = str.charCodeAt(0)
      const lastCode = str.charCodeAt(str.length - 1)
      // 34 is the double-quote character (") and 39 is the single-quote character (')
      const isDouble = firstCode === 34 && lastCode === 34
      const isSingle = firstCode === 39 && lastCode === 39
      if (isDouble || isSingle) return str.slice(1, -1)
      return str
    }
    setFormData(prev => ({
      ...prev,
      targetAudience: data.targetAudience ? stripQuotes(data.targetAudience) : prev.targetAudience,
      brandTone: data.brandTone ? stripQuotes(data.brandTone) : prev.brandTone,
      keyOffer: data.keyOffer ? stripQuotes(data.keyOffer) : prev.keyOffer
    }))

    console.log('Form data updated successfully')
    push({ title: 'Analyzed', message: 'Updated from website.', variant: 'success' })
  })
  const { call: runSubmit, loading: submitLoading } = useAsyncCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!formData.name || !formData.targetAudience || !formData.brandTone || !formData.keyOffer) {
      push({ title: 'Missing fields', message: 'Complete all required fields.', variant: 'warning' })
      return
    }

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
    push({ title: 'Created', message: 'Company added.', variant: 'success' })

    // Reset form and close modal
    resetForm()
    refetchCompanies() // Refresh the companies list
    onSubmit()
  })
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

  const handleAutofill = () => { void runAutofill() }

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate just the fields from step 1
      const partial = {
        name: formData.name,
        website: formData.website,
        additionalInfo: formData.additionalInfo,
        targetAudience: 'placeholder',
        brandTone: 'placeholder',
        keyOffer: 'placeholder',
        imageGuidelines: ''
      }
      const result = BrandSchema.safeParse(partial)
      const e: typeof errors = {}
      if (!result.success) {
        const issues = result.error.flatten().fieldErrors
        if (issues.name?.[0]) e.name = issues.name[0]
        if (issues.website?.[0]) e.website = issues.website[0]
      }
      setErrors(e)
      if (Object.keys(e).length > 0) return
      setCurrentStep(2)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    // Validate full payload
    const result = BrandSchema.safeParse(formData)
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors
      const eState: typeof errors = {
        name: issues.name?.[0],
        website: issues.website?.[0],
        targetAudience: issues.targetAudience?.[0],
        brandTone: issues.brandTone?.[0],
        keyOffer: issues.keyOffer?.[0]
      }
      setErrors(eState)
      e.preventDefault()
      return
    }
    void runSubmit(e)
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
        <ModalHeader>
          <div className="flex items-center space-x-4">
            <IconButton onClick={() => (currentStep === 2 ? handlePrevious() : handleClose())} aria-label="Back" variant="ghost">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </IconButton>
            <div>
              <ModalTitle id={titleId} className="text-base">
                {currentStep === 1 ? 'Create company – Basics' : 'Create company – Brand details'}
              </ModalTitle>
              <div className="text-xs text-gray-500">Back</div>
            </div>
          </div>
          <IconButton onClick={handleClose} aria-label="Close dialog" variant="ghost">
            <X className="h-5 w-5 text-gray-400" />
          </IconButton>
        </ModalHeader>

        <ModalBody>
          {currentStep === 1 ? (
            <div className="space-y-6">
              <p className="text-xs font-medium text-gray-500">Step 1 of 2</p>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basics</h2>
              </div>

              <div className="space-y-6">
                <Input
                  label="Company name"
                  placeholder="Brand name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                  required
                />

                <Input
                  label="Website"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                />

                <Textarea
                  label="Additional info (optional)"
                  placeholder="Add context about the brand…"
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  rows={4}
                />

              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg">
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs font-medium text-gray-500">Step 2 of 2</p>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand details</h2>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="text-sm">Let AI help</span>
                    <span className="text-xs text-gray-500 ml-2">We can analyze your site to suggest details</span>
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
                  label="Target audience"
                  placeholder="Describe your target audience…"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                  error={errors.targetAudience}
                  required
                />

                <Textarea
                  label="Brand tone"
                  placeholder="Describe your brand tone…"
                  value={formData.brandTone}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandTone: e.target.value }))}
                  rows={3}
                  error={errors.brandTone}
                  required
                />

                <Textarea
                  label="Key offer"
                  placeholder="What's your main value proposition?"
                  value={formData.keyOffer}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyOffer: e.target.value }))}
                  rows={3}
                  error={errors.keyOffer}
                  required
                />

                <Textarea
                  label="Image guidelines (optional)"
                  placeholder="Any guidelines for generated images…"
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
                    Back
                  </Button>

                  <Button
                    type="submit"
                    loading={submitLoading}
                    size="lg"
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    Add company
                  </Button>
                </div>
              </form>
            </div>
          )}
        </ModalBody>
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
        message="Unsaved changes will be lost."
        confirmText="Discard"
        cancelText="Keep editing"
        variant="danger"
      />
    </Modal>
  )
}
