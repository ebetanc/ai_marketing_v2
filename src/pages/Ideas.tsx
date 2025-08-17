import {
  Building2,
  Calendar,
  Eye,
  // CheckCircle,
  // Clock,
  FileText,
  Lightbulb,
  // Zap,
  RefreshCw,
  Target,
  X,
  HelpCircle
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { Modal } from '../components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase, type Tables } from '../lib/supabase';
import { formatDate, truncateText } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Helper: Extract topics from an idea row
const extractTopicsFromIdea = (idea: any): { number: number; topic: string; description: string; image_prompt: string }[] => {
  const topics: { number: number; topic: string; description: string; image_prompt: string }[] = []
  for (let i = 1; i <= 10; i++) {
    const topic = idea?.[`topic${i}`]
    const description = idea?.[`idea_description${i}`] ?? idea?.[`description${i}`]
    const image_prompt = idea?.[`image_prompt${i}`]
    if (topic && String(topic).trim()) {
      topics.push({ number: i, topic: String(topic), description: String(description || ''), image_prompt: String(image_prompt || '') })
    }
  }
  return topics
}

export function Ideas() {
  useDocumentTitle('Ideas — AI Marketing')
  type CompanyRow = Tables<'companies'>
  type StrategyRow = Tables<'strategies'>
  type IdeaRow = Tables<'ideas'>
  type IdeaJoined = IdeaRow & { company?: CompanyRow; strategy?: StrategyRow }
  type Topic = { number: number; topic: string; description: string; image_prompt: string }

  const [ideas, setIdeas] = useState<IdeaJoined[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewIdeaModal, setViewIdeaModal] = useState<{
    isOpen: boolean
    idea: IdeaJoined | null
    topic: Topic | null
    isEditing: boolean
  }>({
    isOpen: false,
    idea: null,
    topic: null,
    isEditing: false
  })
  const [editForm, setEditForm] = useState({
    topic: '',
    description: '',
    image_prompt: ''
  })
  const [saving, setSaving] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [viewIdeaSetModal, setViewIdeaSetModal] = useState<{
    isOpen: boolean
    idea: IdeaJoined | null
    topics: Topic[]
  }>({
    isOpen: false,
    idea: null,
    topics: []
  })
  const { push } = useToast()

  // initial load handled in the effect after fetchIdeas definition

  const fetchIdeas = useCallback(async (showToast = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching ideas from Supabase...')


      let data: IdeaJoined[] | null = null
      let error: unknown = null
      try {
        const res = await supabase
          .from('ideas')
          .select(`
            *,
            strategy:strategies (*),
            company:companies (*)
          `)
          .order('created_at', { ascending: false })
        data = (res.data as unknown as IdeaJoined[] | null)
        error = res.error
      } catch (e) {
        console.warn('Relational select failed, falling back to basic select. Error:', e)
      }
      if (!data || error) {
        const res2 = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false })
        data = (res2.data as unknown as IdeaRow[] | null) as unknown as IdeaJoined[] | null
        error = res2.error
      }

      console.log('=== SUPABASE IDEAS DEBUG ===')
      console.log('Raw Supabase response:', { data, error })
      console.log('Data array length:', data?.length)
      console.log('First idea object:', data?.[0])
      console.log('All idea objects:', data)
      console.log('Available columns in first idea:', data?.[0] ? Object.keys(data[0]) : 'No data')

      if (error) {
        console.error('Error fetching ideas from Supabase:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch ideas')
        setIdeas([])
        if (showToast) {
          push({ title: 'Refresh failed', message: 'Could not update ideas', variant: 'error' })
        }
      } else {
        console.log('Ideas fetched successfully:', data?.length || 0, 'records')
        console.log('Setting ideas state with:', data)
        setIdeas(data || [])
        if (showToast) {
          push({ title: 'Refreshed', message: 'Ideas updated', variant: 'success' })
        }
      }
    } catch (err) {
      console.error('Error fetching ideas from Supabase:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch ideas')
      setIdeas([])
      if (showToast) {
        push({ title: 'Refresh failed', message: 'Could not update ideas', variant: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }, [push])

  const handleEditToggle = () => {
    setViewIdeaModal(prev => ({
      ...prev,
      isEditing: !prev.isEditing
    }))

    // Reset form when canceling edit
    if (viewIdeaModal.isEditing) {
      setEditForm({
        topic: viewIdeaModal.topic?.topic || '',
        description: viewIdeaModal.topic?.description || '',
        image_prompt: viewIdeaModal.topic?.image_prompt || ''
      })
    }
  }

  const handleSaveChanges = async () => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return

    setSaving(true)

    try {
      const topicNumber = viewIdeaModal.topic.number



      const baseColumnIndex = 8 + (topicNumber - 1) * 3 // 9 for topic 1, 12 for topic 2, etc.


      const columns = Object.keys(viewIdeaModal.idea).sort()


      const topicColumn = columns[baseColumnIndex] || `topic${topicNumber}`
      const descriptionColumn = columns[baseColumnIndex + 1] || `description${topicNumber}`
      const imagePromptColumn = columns[baseColumnIndex + 2] || `image_prompt${topicNumber}`

      const updateData = {
        [topicColumn]: editForm.topic,
        [descriptionColumn]: editForm.description,
        [imagePromptColumn]: editForm.image_prompt
      }

      console.log('=== SAVE TOPIC OPERATION DEBUG ===')
      console.log('Idea ID:', viewIdeaModal.idea.id)
      console.log('Topic Number:', topicNumber)
      console.log('Column mappings:', {
        topicColumn,
        descriptionColumn,
        imagePromptColumn
      })
      console.log('Update Data:', updateData)

      const { error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', viewIdeaModal.idea.id)

      console.log('Supabase Update Response Error:', error)

      if (error) {
        console.error('=== SUPABASE UPDATE ERROR ===')
        console.error('Error Code:', error.code)
        console.error('Error Message:', error.message)
        console.error('Error Details:', error.details)
        push({ title: 'Save failed', message: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' })
        return
      }

      console.log('Topic updated successfully')


      setIdeas(prev => prev.map(idea => {
        if (idea.id === viewIdeaModal.idea!.id) {
          return { ...idea, ...updateData }
        }
        return idea
      }))


      const updatedTopic = {
        ...viewIdeaModal.topic,
        topic: editForm.topic,
        description: editForm.description,
        image_prompt: editForm.image_prompt
      }

      setViewIdeaModal(prev => ({
        ...prev,
        topic: updatedTopic,
        isEditing: false
      }))


      await fetchIdeas()

      push({ title: 'Saved', message: 'Changes updated', variant: 'success' })

    } catch (error) {
      console.error('Error saving changes:', error)
      push({ title: 'Save failed', message: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleViewIdeaSet = (idea: IdeaJoined) => {
    const topics = extractTopicsFromIdea(idea)
    setViewIdeaSetModal({
      isOpen: true,
      idea,
      topics
    })
  }

  const handleCloseIdeaSetModal = () => {
    setViewIdeaSetModal({
      isOpen: false,
      idea: null,
      topics: []
    })
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCloseViewModal = () => {
    setViewIdeaModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleViewTopic = (idea: IdeaJoined, topic: Topic) => {
    setViewIdeaModal({ isOpen: true, idea, topic, isEditing: false })
  }

  const handleGenerateContent = async () => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return

    setGeneratingContent(true)

    try {

      console.log('=== FETCHING COMPANY DETAILS ===')
      console.log('Idea company_id:', viewIdeaModal.idea.company_id)

      let companyData: CompanyRow | null = null
      let companyError: unknown = null
      if (viewIdeaModal.idea.company_id) {
        const res = await supabase
          .from('companies')
          .select('*')
          .eq('id', viewIdeaModal.idea.company_id)
          .single()
        companyData = res.data as CompanyRow | null
        companyError = res.error
      }

      if (companyError) {
        console.error('Error fetching company details:', companyError)
        console.log('Continuing without company details...')
      }

      console.log('Company data fetched:', companyData)


      console.log('=== FETCHING STRATEGY AND ANGLE DETAILS ===')
      console.log('Strategy ID:', viewIdeaModal.idea.strategy_id)
      console.log('Angle Number:', viewIdeaModal.idea.angle_number)

      let strategyData: StrategyRow | null = null
      let angleDetails: {
        number: number
        header: string
        description: string
        objective: string
        tonality: string
      } | null = null

      if (viewIdeaModal.idea.strategy_id && viewIdeaModal.idea.angle_number) {
        const { data: strategy, error: strategyError } = await supabase
          .from('strategies')
          .select('*')
          .eq('id', viewIdeaModal.idea.strategy_id)
          .single()

        if (strategyError) {
          console.error('Error fetching strategy details:', strategyError)
          console.log('Continuing without strategy details...')
        } else {
          strategyData = strategy as StrategyRow


          const angleNumber = viewIdeaModal.idea.angle_number
          angleDetails = {
            number: angleNumber,
            header: (strategy as any)[`angle${angleNumber}_header`] || '',
            description: (strategy as any)[`angle${angleNumber}_description`] || '',
            objective: (strategy as any)[`angle${angleNumber}_objective`] || '',
            tonality: (strategy as any)[`angle${angleNumber}_tonality`] || ''
          }

          console.log('Strategy data fetched:', strategyData)
          console.log('Angle details extracted:', angleDetails)
        }
      }

      const topicData = {
        topicNumber: viewIdeaModal.topic.number,
        topic: viewIdeaModal.topic.topic,
        description: viewIdeaModal.topic.description,
        image_prompt: viewIdeaModal.topic.image_prompt,
        idea: {
          id: viewIdeaModal.idea.id,
          brand: companyData?.brand_name || viewIdeaModal.idea.company?.brand_name || 'Unknown Brand',
          strategy_id: viewIdeaModal.idea.strategy_id,
          angle_number: viewIdeaModal.idea.angle_number,
          created_at: viewIdeaModal.idea.created_at
        }
      }

      // Derive normalized-first fields from companyData for consistent payloads
      const brandName: string = companyData?.brand_name || viewIdeaModal.idea.company?.brand_name || 'Unknown Brand'
      const website: string = companyData?.website || ''
      const tone: string = companyData?.brand_tone || ''
      const style: string = companyData?.key_offer || ''
      const targetAudienceStr: string = companyData?.target_audience || ''
      const additionalInfo: string = companyData?.additional_information || ''

      const { data: genSession } = await supabase.auth.getSession()
      const userId = genSession.session?.user.id || null

      // Normalize platforms from strategy or use a sensible default. n8n Switch expects
      // string items at fixed indices (platforms[0]..platforms[7]).
      const normalizePlatforms = (platforms: string | null | undefined): string[] => {
        if (!platforms) return []
        try {
          const parsed = JSON.parse(platforms)
          if (Array.isArray(parsed)) return parsed
        } catch {/* not JSON */}
        return String(platforms).split(',')
          .map(s => s.trim())
          .filter(Boolean)
      }

      const normalizedPlatforms = normalizePlatforms(strategyData?.platforms || null)
        .map(p => p.toLowerCase())
      // Fixed platform order to reserve indexes consistently
      const PLATFORM_ORDER = ['twitter','linkedin','newsletter','facebook','instagram','youtube','tiktok','blog']
      const platformsSlotted: string[] = PLATFORM_ORDER.map(() => '')
      normalizedPlatforms.forEach(p => {
        const idx = PLATFORM_ORDER.indexOf(p)
        if (idx !== -1) platformsSlotted[idx] = p
      })

      const webhookPayload = {
        identifier: 'generateContent',
        operation: 'generate_content_from_idea',
        meta: {
          user_id: userId,
          source: 'app',
          ts: new Date().toISOString(),
        },
        user_id: userId,
        // Core identifiers for downstream CRUD
        company_id: viewIdeaModal.idea.company_id,
        strategy_id: viewIdeaModal.idea.strategy_id,
        idea_id: viewIdeaModal.idea.id,
        topic: topicData,
        // Fixed-length string array for n8n Switch node compatibility
        platforms: platformsSlotted,
        // FULL BRAND INFORMATION
        companyDetails: companyData ? {
          ...companyData,
          name: brandName,
          brandTone: tone,
          keyOffer: style,
          targetAudience: targetAudienceStr,
          additionalInfo,
          website
        } : null,
        // SPECIFIC ANGLE DETAILS THAT GENERATED THIS IDEA
        angleDetails: angleDetails,
        // FULL STRATEGY CONTEXT
        strategyContext: strategyData ? {
          id: strategyData.id,
          brand: brandName,
          name: brandName,
          description: 'No strategy description available',
          platforms: strategyData.platforms,
          created_at: strategyData.created_at,
          totalAngles: (() => {
            let count = 0
            for (let i = 1; i <= 10; i++) {
              if ((strategyData as any)[`angle${i}_header`]) count++
            }
            return count
          })()
        } : null,
        // REQUIRED FIELDS FOR AI AGENT CONTEXT
        aiContext: {
          strategyName: brandName,
          strategyDescription: 'No strategy description available',
          tonality: angleDetails?.tonality || 'No tonality specified',
          objective: angleDetails?.objective || 'No objective specified',
          keyOffer: style || 'No key offer specified',
          brandTone: tone || 'No brand tone specified',
          targetAudience: targetAudienceStr || 'No target audience specified',
          platforms: ["twitter", "linkedin", "newsletter"],
          contentType: 'idea_to_content_generation'
        },
        context: {
          requestType: 'generate_content_from_idea',
          timestamp: new Date().toISOString(),
          hasCompanyDetails: !!companyData,
          hasAngleDetails: !!angleDetails,
          hasStrategyContext: !!strategyData,
          ideaSetId: viewIdeaModal.idea.id,
          topicNumber: viewIdeaModal.topic.number
        }
      }

      console.log('=== ENHANCED GENERATE CONTENT WEBHOOK ===')
      console.log('Sending payload:', webhookPayload)
      console.log('Company details included:', !!companyData)
      console.log('Angle details included:', !!angleDetails)
      console.log('Strategy context included:', !!strategyData)

      // WEBHOOK SENDING DISABLED FOR ANALYSIS
      // const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(webhookPayload)
      // })

      // console.log('Webhook response status:', response.status)

      // if (!response.ok) {
      //   throw new Error(`Webhook failed with status: ${response.status}`)
      // }

      // const responseText = await response.text()
      // console.log('Raw webhook response:', responseText)

      // let result
      // try {
      //   result = JSON.parse(responseText)
      // } catch (parseError) {
      //   console.error('Failed to parse JSON response:', parseError)
      //   console.error('Raw response text:', responseText)
      //   // If JSON parsing fails, treat as success if status is ok
      //   result = { message: 'Content generation started' }
      // }

      // console.log('Webhook response:', result)

      console.log('=== FINAL WEBHOOK PAYLOAD FOR ANALYSIS ===')
      console.log(JSON.stringify(webhookPayload, null, 2))

      console.log('=== MAKING WEBHOOK REQUEST ===')
      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })

      console.log('Webhook response status:', response.status)
      console.log('Webhook response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`)
      }

      const responseText = await response.text()
      console.log('Raw webhook response:', responseText)

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        console.error('Raw response text:', responseText)
        // If JSON parsing fails, treat as success if status is ok
        result = { message: 'Content generation started' }
      }

      console.log('Webhook response:', result)
      push({ title: 'Generation started', message: 'Check Content page soon', variant: 'success' })

    } catch (error) {
      console.error('Error generating content:', error)
      push({ title: 'Generation failed', message: `${error instanceof Error ? error.message : 'Unknown error'}`, variant: 'error' })
    } finally {
      setGeneratingContent(false)
    }
  }


  // Group ideas by brand name (from joined company)
  const ideasByBrand = ideas.reduce((acc, idea) => {
    const brandName = idea.company?.brand_name || 'Unknown Brand';
    if (!acc[brandName]) acc[brandName] = [] as IdeaJoined[];
    acc[brandName].push(idea);
    return acc;
  }, {} as Record<string, IdeaJoined[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="mt-2 text-gray-600">
            AI-generated content ideas organized by brand.
          </p>
        </div>
        <Button onClick={() => fetchIdeas(true)} loading={loading} disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* View Idea Modal */}
      {viewIdeaModal.isOpen && (
        <Modal isOpen={viewIdeaModal.isOpen} onClose={handleCloseViewModal} labelledById="view-idea-title">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 id="view-idea-title" className="text-xl font-bold text-gray-900">
                    {viewIdeaModal.isEditing ? 'Edit Topic' : (viewIdeaModal.topic?.topic || `Topic ${viewIdeaModal.topic?.number}`)}
                  </h2>
                  <p className="text-sm text-gray-500">{viewIdeaModal.idea?.company?.brand_name || 'Unknown Brand'}</p>
                </div>
              </div>

              <IconButton
                onClick={handleCloseViewModal}
                variant="ghost"
                aria-label="Close dialog"
                disabled={saving}
              >
                <X className="h-5 w-5 text-gray-400" />
              </IconButton>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {/* Topic */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <input
                      type="text"
                      value={editForm.topic}
                      onChange={(e) => handleFormChange('topic', e.target.value)}
                      aria-label="Topic"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent"
                      placeholder="Enter topic..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {viewIdeaModal.topic?.topic || 'No topic specified'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={4}
                      aria-label="Description"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter description..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewIdeaModal.topic?.description || 'No description available'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Image Prompt */}
              {viewIdeaModal.topic?.image_prompt && viewIdeaModal.topic.image_prompt !== 'No image prompt provided' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <Target className="h-5 w-5 text-purple-600" />
                      Image Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewIdeaModal.isEditing ? (
                      <textarea
                        value={editForm.image_prompt}
                        onChange={(e) => handleFormChange('image_prompt', e.target.value)}
                        rows={3}
                        aria-label="Image prompt"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Enter image prompt..."
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {viewIdeaModal.topic.image_prompt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-3">
                {viewIdeaModal.isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      loading={saving}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleEditToggle}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={handleGenerateContent}
                      loading={generatingContent}
                      disabled={generatingContent}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingContent ? 'Generating...' : 'Generate Content'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCloseViewModal}
                    >
                      Close
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* View Idea Set Modal */}
      {viewIdeaSetModal.isOpen && (
        <Modal isOpen={viewIdeaSetModal.isOpen} onClose={handleCloseIdeaSetModal} labelledById="view-idea-set-title">
          <div className="w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 id="view-idea-set-title" className="text-xl font-bold text-gray-900">
                    Content Ideas Set #{viewIdeaSetModal.idea?.id} - {viewIdeaSetModal.idea?.company?.brand_name || 'Unknown Brand'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {viewIdeaSetModal.topics.length} content ideas • Created {viewIdeaSetModal.idea?.created_at ? formatDate(viewIdeaSetModal.idea.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <IconButton
                onClick={handleCloseIdeaSetModal}
                variant="ghost"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5 text-gray-400" />
              </IconButton>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {viewIdeaSetModal.topics.map((topic) => (
                  <Card
                    key={topic.number}
                    className="bg-white border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group cursor-pointer"
                    onClick={() => handleViewTopic(viewIdeaSetModal.idea!, topic)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                          {topic.number}
                        </div>
                        <CardTitle className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {truncateText(topic.topic, 40)}
                        </CardTitle>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0 pb-4">
                      {/* Description */}
                      <div>
                        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed bg-gray-50 p-2 rounded-lg">
                          {truncateText(topic.description, 100)}
                        </p>
                      </div>

                      {/* Image Prompt */}
                      {topic.image_prompt && topic.image_prompt !== 'No image prompt provided' && (
                        <div>
                          <p className="text-xs font-medium text-purple-700 mb-1">Image:</p>
                          <p className="text-xs text-purple-600 line-clamp-3 bg-purple-50 p-2 rounded-lg">
                            {truncateText(topic.image_prompt, 80)}
                          </p>
                        </div>
                      )}

                      {/* View indicator */}
                      <div className="pt-1">
                        <div className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view details →
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ideas</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => fetchIdeas(true)} variant="outline" loading={loading} disabled={loading}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ideas by Brand */}
      {!loading && !error && ideas.length > 0 && (
        <div className="space-y-8">
          {(Object.entries(ideasByBrand ?? {}) as [string, IdeaJoined[]][]).map(([brandName, brandIdeas]) => {
            const totalTopics = brandIdeas.reduce((sum, idea) => sum + extractTopicsFromIdea(idea).length, 0)

            return (
              <div key={brandName} className="w-full max-w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h5 className="text-xl font-semibold text-gray-900">
                        {brandName}
                      </h5>
                      <p className="text-sm text-gray-500">
                        {brandIdeas.length} idea set{brandIdeas.length === 1 ? '' : 's'} • {totalTopics} total topics
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" className="text-sm px-3 py-1">
                    {brandIdeas.length} Sets
                  </Badge>
                </div>

                <p className="text-sm font-normal text-gray-500 mb-4">
                  AI-generated content ideas ready for execution. Click on any idea set to view individual topics and generate content.
                </p>

                {/* Ideas List */}
                <ul className="space-y-3">
                  {brandIdeas.map((idea) => {
                    const topics = extractTopicsFromIdea(idea)

                    return (
                      <li key={idea.id}>
                        <div className="flex items-center justify-between p-4 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <Lightbulb className="h-5 w-5 text-white" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="font-semibold text-gray-900">
                                  Content Ideas Set #{idea.id}
                                </span>
                                {topics.length > 0 && (
                                  <Badge variant="success" className="text-xs">
                                    {topics.length} Topics
                                  </Badge>
                                )}
                                {idea.strategy_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    Strategy #{idea.strategy_id}
                                  </Badge>
                                )}
                                {idea.angle_number && (
                                  <Badge variant="secondary" className="text-xs">
                                    Angle {idea.angle_number}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(idea.created_at)}
                                </span>
                                <span>{topics.length} content topics ready</span>
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewIdeaSet(idea)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                            View Topics
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button className="inline-flex items-center text-xs font-normal text-gray-500 hover:underline hover:text-gray-700 transition-colors">
                    <HelpCircle className="w-3 h-3 me-2" />
                    How do content ideas work?
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Empty State */}
      {!loading && !error && ideas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ideas found</h3>
            <p className="text-gray-500 mb-6">
              The ideas table in your Supabase database is empty.
            </p>
            <Button onClick={() => fetchIdeas(true)}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
