import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { 
  Lightbulb, 
  Eye, 
  CheckCircle, 
  Clock,
  FileText,
  Target,
  Building2,
  Calendar,
  Zap,
  RefreshCw,
  X
} from 'lucide-react'
import { formatDate, truncateText } from '../lib/utils'
import { supabase } from '../lib/supabase'

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
      
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
      
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

  // Helper function to extract topics from grouped columns
  const extractTopicsFromIdea = (idea: any) => {
    const topics = []
    const columns = Object.keys(idea).sort() // Sort to ensure consistent order
    
    let topicIndex = 1
    
    while (true) {
      const topicKey = `topic${topicIndex}`
      const descriptionKey = `description${topicIndex}` || `topic${topicIndex}_description`
      const imagePromptKey = `image_prompt${topicIndex}` || `topic${topicIndex}_image_prompt`
      
      const baseIndex = 8 + (topicIndex - 1) * 3 // 9-11 for topic 1, 12-14 for topic 2, etc.
      const columnTopic = columns[baseIndex]
      const columnDescription = columns[baseIndex + 1]
      const columnImagePrompt = columns[baseIndex + 2]
      
      const topic = idea[topicKey] || idea[columnTopic]
      const description = idea[descriptionKey] || idea[columnDescription]
      const imagePrompt = idea[imagePromptKey] || idea[columnImagePrompt]
      
      if (topic || description || imagePrompt) {
        topics.push({
          number: topicIndex,
          topic: topic || `Topic ${topicIndex}`,
          description: description || 'No description provided',
          image_prompt: imagePrompt || 'No image prompt provided',
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
      
      // Determine the column names based on topic number
      // Columns 9-11 for topic 1, 12-14 for topic 2, etc.
      const baseColumnIndex = 8 + (topicNumber - 1) * 3 // 9 for topic 1, 12 for topic 2, etc.
      
      // Get all column names from the idea object
      const columns = Object.keys(viewIdeaModal.idea).sort()
      
      // Map to the correct column names
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
        alert(`Failed to save changes: ${error.message}`)
        return
      }
      
      console.log('Topic updated successfully')
      
      // Update local state
      setIdeas(prev => prev.map(idea => {
        if (idea.id === viewIdeaModal.idea!.id) {
          return { ...idea, ...updateData }
        }
        return idea
      }))
      
      // Update the modal's topic data
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
      
      // Force a refresh of the data from the database to ensure consistency
      await fetchIdeas()
      
      alert('Changes saved successfully!')
      
    } catch (error) {
      console.error('Error saving changes:', error)
      alert(`Failed to save changes: ${error.message || 'Unknown error'}`)
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
        platforms: ["twitter", "linkedin", "newsletter"]
      }
      
      console.log('=== GENERATE CONTENT WEBHOOK ===')
      console.log('Sending payload:', webhookPayload)
      
      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })
      
      console.log('Webhook response status:', response.status)
      
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
      
      alert('Content generation started! Check the Content page for results.')
      
    } catch (error) {
      console.error('Error generating content:', error)
      alert(`Failed to generate content: ${error.message || 'Unknown error'}`)
    } finally {
      setGeneratingContent(false)
    }
  }

  // Group ideas by brand
  const ideasByBrand = ideas.reduce((acc, idea) => {
    const brand = idea.brand || 'Unknown Brand'
    if (!acc[brand]) {
      acc[brand] = []
    }
    acc[brand].push(idea)
    return acc
  }, {} as Record<string, any[]>)

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
                  <p className="text-sm text-gray-500">{viewIdeaModal.idea?.brand || 'Unknown Brand'}</p>
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
                    Content Ideas Set #{viewIdeaSetModal.idea?.id} - {viewIdeaSetModal.idea?.brand}
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
          {Object.entries(ideasByBrand).map(([brandName, brandIdeas]) => (
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
                {brandIdeas.map((idea) => {
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