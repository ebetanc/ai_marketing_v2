
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
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { formatDate, truncateText } from '../lib/utils';

export function Ideas() {
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewIdeaModal, setViewIdeaModal] = useState<{
    isOpen: boolean
    idea: any
    topic: any
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
    idea: any
    topics: any[]
  }>({
    isOpen: false,
    idea: null,
    topics: []
  })

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching ideas from Supabase...')


      let data: any[] | null = null
      let error: any = null
      try {
        const res = await supabase
          .from('ideas')
          .select(`
            *,
            strategy:strategies (*),
            company:companies (*)
          `)
          .order('created_at', { ascending: false })
        data = res.data as any[] | null
        error = res.error
      } catch (e) {
        console.warn('Relational select failed, falling back to basic select. Error:', e)
      }
      if (!data || error) {
        const res2 = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false })
        data = res2.data as any[] | null
        error = res2.error
      }

      console.log('=== SUPABASE IDEAS DEBUG ===')
      console.log('Raw Supabase response:', { data, error })
      console.log('Data array length:', data?.length)
      console.log('First idea object:', data?.[0])
      console.log('All idea objects:', data)
      console.log('Available columns in first idea:', data?.[0] ? Object.keys(data[0]) : 'No data')

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Ideas fetched successfully:', data?.length || 0, 'records')
      console.log('Setting ideas state with:', data)
      setIdeas(data || [])
    } catch (error) {
      console.error('Error fetching ideas from Supabase:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch ideas')
      setIdeas([])
    } finally {
      setLoading(false)
    }
  }


  const extractTopicsFromIdea = (idea: any) => {
    const topics = []

    let topicIndex = 1

    while (true) {
      const topicKey = `topic${topicIndex}`
      const descriptionKey = `idea_description${topicIndex}`
      const imagePromptKey = `image_prompt${topicIndex}`

      const topic = idea[topicKey]
      const description = idea[descriptionKey]
      const imagePrompt = idea[imagePromptKey]

      if (topic || description || imagePrompt) {
        topics.push({
          number: topicIndex,
          topic: String(topic || `Topic ${topicIndex}`),
          description: String(description || 'No description provided'),
          image_prompt: String(imagePrompt || 'No image prompt provided'),
        })
        topicIndex++
      } else {
        break
      }

      if (topicIndex > 20) break
    }

    return topics
  }

  const handleViewTopic = (idea: any, topic: any) => {
    setViewIdeaModal({
      isOpen: true,
      idea,
      topic,
      isEditing: false
    })
    // Initialize edit form with current values
    setEditForm({
      topic: topic.topic || '',
      description: topic.description || '',
      image_prompt: topic.image_prompt || ''
    })
  }

  const handleCloseViewModal = () => {
    setViewIdeaModal({
      isOpen: false,
      idea: null,
      topic: null,
      isEditing: false
    })
    setEditForm({
      topic: '',
      description: '',
      image_prompt: ''
    })
    setSaving(false)
  }

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

      const topicColumn = `topic${topicNumber}`
      const descriptionColumn = `idea_description${topicNumber}`
      const imagePromptColumn = `image_prompt${topicNumber}`

      const updateData = {
        [topicColumn]: editForm.topic,
        [descriptionColumn]: editForm.description,
        [imagePromptColumn]: editForm.image_prompt
      }

      const { error } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', viewIdeaModal.idea.id)

      console.log('Supabase Update Response Error:', error)

      if (error) {
        alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return
      }

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

      alert('Changes saved successfully!')
    } catch (error) {
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleViewIdeaSet = (idea: any) => {
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

  const handleGenerateContent = async () => {
    if (!viewIdeaModal.idea || !viewIdeaModal.topic) return

    setGeneratingContent(true)

    try {

      console.log('=== FETCHING COMPANY DETAILS ===')
      console.log('Idea company_id:', viewIdeaModal.idea.company_id)
      console.log('Fallback brand name:', viewIdeaModal.idea.brand)

      let companyData = null as any
      let companyError = null as any
      if (viewIdeaModal.idea.company_id) {
        const res = await supabase
          .from('companies')
          .select('*')
          .eq('id', viewIdeaModal.idea.company_id)
          .single()
        companyData = res.data
        companyError = res.error
      } else {
        const res = await supabase
          .from('companies')
          .select('*')
          .eq('brand_name', viewIdeaModal.idea.brand)
          .single()
        companyData = res.data
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

      let strategyData = null
      let angleDetails = null

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
          strategyData = strategy


          const angleNumber = viewIdeaModal.idea.angle_number
          angleDetails = {
            number: angleNumber,
            header: strategy[`angle${angleNumber}_header`] || '',
            description: strategy[`angle${angleNumber}_description`] || '',
            objective: strategy[`angle${angleNumber}_objective`] || '',
            tonality: strategy[`angle${angleNumber}_tonality`] || ''
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
          brand: viewIdeaModal.idea.brand,
          strategy_id: viewIdeaModal.idea.strategy_id,
          angle_number: viewIdeaModal.idea.angle_number,
          created_at: viewIdeaModal.idea.created_at
        }
      }

      const webhookPayload = {
        identifier: 'generateContent',
        topic: topicData,
        platforms: ["twitter", "linkedin", "newsletter"],
        // FULL BRAND INFORMATION
        companyDetails: companyData ? {
          // Include ALL company data from Supabase
          ...companyData,
          // Add computed/formatted fields for backward compatibility
          name: companyData.brand_name || companyData.name || 'Unknown Brand',
          brandTone: companyData.brand_tone || '',
          keyOffer: companyData.key_offer || '',
          targetAudience: companyData.target_audience || '',
          additionalInfo: companyData.additional_information || '',
          website: companyData.website || ''
        } : null,
        // SPECIFIC ANGLE DETAILS THAT GENERATED THIS IDEA
        angleDetails: angleDetails,
        // FULL STRATEGY CONTEXT
        strategyContext: strategyData ? {
          id: strategyData.id,
          brand: strategyData.brand,
          name: strategyData.brand || 'Unnamed Strategy', // Strategy Name
          description: strategyData.description || 'No strategy description available', // Strategy Description
          platforms: strategyData.platforms,
          created_at: strategyData.created_at,
          totalAngles: (() => {
            let count = 0
            for (let i = 1; i <= 10; i++) {
              if (strategyData[`angle${i}_header`]) count++
            }
            return count
          })()
        } : null,
        // REQUIRED FIELDS FOR AI AGENT CONTEXT
        aiContext: {
          strategyName: strategyData?.brand || 'Unknown Strategy',
          strategyDescription: strategyData?.description || 'No strategy description available',
          tonality: angleDetails?.tonality || 'No tonality specified',
          objective: angleDetails?.objective || 'No objective specified',
          keyOffer: companyData?.key_offer || companyData?.keyOffer || 'No key offer specified',

          brandTone: companyData?.brand_tone || companyData?.brandTone || 'No brand tone specified',
          targetAudience: companyData?.target_audience || companyData?.targetAudience || 'No target audience specified',
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
      alert('Content generated successfully! Check your Content page to see the generated content.')

    } catch (error) {
      console.error('Error generating content:', error)
      alert(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setGeneratingContent(false)
    }
  }


  // Group ideas by brand name (from joined company)
  const ideasByBrand = ideas.reduce((acc, idea) => {
    const brandName = idea.company?.brand_name || 'Unknown Brand';
    if (!acc[brandName]) acc[brandName] = [] as any[];
    acc[brandName].push(idea);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Ideas</h1>
          <p className="mt-2 text-gray-600">
            AI-generated content ideas organized by brand.
          </p>
        </div>
        <Button onClick={fetchIdeas} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* View Idea Modal */}
      {viewIdeaModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {viewIdeaModal.isEditing ? 'Edit Topic' : (viewIdeaModal.topic?.topic || `Topic ${viewIdeaModal.topic?.number}`)}
                  </h2>
                  <p className="text-sm text-gray-500">{viewIdeaModal.idea?.company?.brand_name || 'Unknown Brand'}</p>
                </div>
              </div>

              <button
                onClick={handleCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={saving}
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
              {/* Topic */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Topic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <input
                      type="text"
                      value={editForm.topic}
                      onChange={(e) => handleFormChange('topic', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewIdeaModal.isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                    <CardTitle className="flex items-center text-lg">
                      <Target className="h-5 w-5 mr-2 text-purple-600" />
                      Image Prompt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewIdeaModal.isEditing ? (
                      <textarea
                        value={editForm.image_prompt}
                        onChange={(e) => handleFormChange('image_prompt', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
        </div>
      )}

      {/* View Idea Set Modal */}
      {viewIdeaSetModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Content Ideas Set #{viewIdeaSetModal.idea?.id} - {viewIdeaSetModal.idea?.company?.brand_name || 'Unknown Brand'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {viewIdeaSetModal.topics.length} content ideas • Created {viewIdeaSetModal.idea?.created_at ? formatDate(viewIdeaSetModal.idea.created_at) : 'Unknown'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseIdeaSetModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {viewIdeaSetModal.topics.map((topic) => (
                  <Card
                    key={topic.number}
                    className="bg-white border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group cursor-pointer"
                    onClick={() => handleViewTopic(viewIdeaSetModal.idea, topic)}
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
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ideas...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Ideas</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchIdeas} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Ideas by Brand */}
      {!loading && !error && ideas.length > 0 && (
        <div className="space-y-12">
          {(Object.entries(ideasByBrand ?? {}) as [string, any[]][]).map(([brandName, brandIdeas]) => (
            <div key={brandName} className="space-y-6">
              {/* Brand Header */}
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">{brandName}</h2>
                      <p className="text-blue-600 font-medium">{brandIdeas.length} content idea{brandIdeas.length === 1 ? '' : 's'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="primary" className="text-lg px-6 py-3 font-semibold">
                      {brandIdeas.length} Ideas
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Ideas Grid for this Brand */}
              <div className="space-y-8">
                {brandIdeas.map((idea: any) => {
                  const topics = extractTopicsFromIdea(idea)

                  return (
                    <Card key={idea.id} className="border-l-4 border-l-blue-500 shadow-md">
                      <CardContent>
                        <div className="flex items-center justify-between p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Lightbulb className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">Content Ideas Set #{idea.id}</h3>
                              <p className="text-blue-600 font-medium text-lg">{topics.length} content idea{topics.length === 1 ? '' : 's'} ready for execution</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(idea.created_at)}
                                </span>
                                {idea.strategy_id && (
                                  <>
                                    <span>Strategy #{idea.strategy_id}</span>
                                    {idea.angle_number && <span>Angle {idea.angle_number}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleViewIdeaSet(idea)}
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-5 w-5 mr-2" />
                            View All Ideas
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
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
            <Button onClick={fetchIdeas}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
