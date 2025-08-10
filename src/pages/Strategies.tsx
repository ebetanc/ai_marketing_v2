import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import { 
  RefreshCw,
  Database,
  Building2,
  Target,
  Zap,
  FileText,
  Calendar,
  Eye,
  X
} from 'lucide-react'
import type { Strategy } from '../lib/supabase'
import { formatDate } from '../lib/utils'

export function Strategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null)
  const [viewAngleModal, setViewAngleModal] = useState<{
    isOpen: boolean
    strategy: Strategy | null
    angle: any
    isEditing: boolean
  }>({
    isOpen: false,
    strategy: null,
    angle: null,
    isEditing: false
  })

  const [editForm, setEditForm] = useState({
    header: '',
    description: '',
    objective: '',
    tonality: ''
  })
  const [saving, setSaving] = useState(false)
  const [generatingIdeas, setGeneratingIdeas] = useState(false)

  // Helper function to format markdown-like text
  const formatDescription = (text: string) => {
    if (!text) return 'No description available'
    
    return text.split('\n').map((line, index) => {
      // Handle headers (###)
      if (line.startsWith('### ')) {
        return (
          <h4 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2 first:mt-0">
            {line.replace('### ', '')}
          </h4>
        )
      }
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, '')
        // Handle bold text within numbered items
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <div key={index} className="mb-2 pl-4">
            <span className="font-medium text-blue-600 mr-2">{line.match(/^\d+/)?.[0]}.</span>
            <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </div>
        )
      }
      
      // Handle bullet points with dashes
      if (line.startsWith('- ')) {
        const content = line.replace(/^- /, '')
        const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <div key={index} className="mb-1 pl-6 flex items-start">
            <span className="text-blue-500 mr-2 mt-1">•</span>
            <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
          </div>
        )
      }
      
      // Handle regular paragraphs with bold formatting
      if (line.trim()) {
        const formattedContent = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedContent }} />
        )
      }
      
      // Empty lines for spacing
      return <br key={index} />
    })
  }

  useEffect(() => {
    fetchStrategies()
  }, [])

  // Set the first strategy as selected when strategies are loaded
  useEffect(() => {
    if (strategies.length > 0 && selectedStrategyId === null) {
      setSelectedStrategyId(strategies[0].id)
    }
  }, [strategies, selectedStrategyId])

  const fetchStrategies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching strategies from Supabase...')
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase client:', supabase)
      
      // First, let's try to get the current user/session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current user:', user)
      console.log('Auth error:', authError)
      
      const { data, error } = await supabase
        .from('strategies')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('Supabase response:', { data, error })
      console.log('Data length:', data?.length)
      console.log('Error details:', error)
      
      if (error) {
        console.error('Supabase error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        throw error
      }
      
      console.log('Strategies fetched successfully:', data?.length || 0, 'records')
      console.log('First strategy (if any):', data?.[0])
      setStrategies(data || [])
    } catch (error) {
      console.error('Error fetching strategies:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch strategies'
      console.error('Final error message:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to extract all angles from a strategy
  const extractAnglesFromStrategy = (strategy: Strategy) => {
    const angles = []
    for (let i = 1; i <= 10; i++) {
      const header = strategy[`angle${i}_header` as keyof Strategy] as string
      const description = strategy[`angle${i}_description` as keyof Strategy] as string
      const objective = strategy[`angle${i}_objective` as keyof Strategy] as string
      const tonality = strategy[`angle${i}_tonality` as keyof Strategy] as string
      
      if (header || description || objective || tonality) {
        angles.push({
          number: i,
          header: header || `Angle ${i}`,
          description: description || 'No description provided',
          objective: objective || 'No objective specified',
          tonality: tonality || 'No tonality defined'
        })
      }
    }
    return angles
  }

  const handleViewAngle = (strategy: Strategy, angle: any) => {
    setViewAngleModal({
      isOpen: true,
      strategy,
      angle,
      isEditing: false
    })
    // Initialize edit form with current values
    setEditForm({
      header: angle.header || '',
      description: angle.description || '',
      objective: angle.objective || '',
      tonality: angle.tonality || ''
    })
  }

  const handleCloseViewModal = () => {
    setViewAngleModal({
      isOpen: false,
      strategy: null,
      angle: null,
      isEditing: false
    })
    setEditForm({
      header: '',
      description: '',
      objective: '',
      tonality: ''
    })
    setSaving(false)
  }

  const handleEditToggle = () => {
    setViewAngleModal(prev => ({
      ...prev,
      isEditing: !prev.isEditing
    }))
    
    // Reset form when canceling edit
    if (viewAngleModal.isEditing) {
      setEditForm({
        header: viewAngleModal.angle?.header || '',
        description: viewAngleModal.angle?.description || '',
        objective: viewAngleModal.angle?.objective || '',
        tonality: viewAngleModal.angle?.tonality || ''
      })
    }
  }

  const handleSaveChanges = async () => {
    if (!viewAngleModal.strategy || !viewAngleModal.angle) return
    
    setSaving(true)
    
    try {
      const angleNumber = viewAngleModal.angle.number
      const updateData = {
        [`angle${angleNumber}_header`]: editForm.header,
        [`angle${angleNumber}_description`]: editForm.description,
        [`angle${angleNumber}_objective`]: editForm.objective,
        [`angle${angleNumber}_tonality`]: editForm.tonality
      }
      
      console.log('=== SAVE OPERATION DEBUG ===')
      console.log('Strategy ID:', viewAngleModal.strategy.id)
      console.log('Angle Number:', angleNumber)
      console.log('Update Data:', updateData)
      console.log('Original Strategy:', viewAngleModal.strategy)
      
      const { error } = await supabase
        .from('strategies')
        .update(updateData)
        .eq('id', viewAngleModal.strategy.id)
      
      console.log('Supabase Update Response Error:', error)
      
      if (error) {
        console.error('=== SUPABASE UPDATE ERROR ===')
        console.error('Error Code:', error.code)
        console.error('Error Message:', error.message)
        console.error('Error Details:', error.details)
        console.error('Error Hint:', error.hint)
        alert(`Failed to save changes: ${error.message}`)
        return
      }
      
      console.log('Strategy updated successfully')
      
      // Update local state
      setStrategies(prev => prev.map(strategy => {
        if (strategy.id === viewAngleModal.strategy!.id) {
          return { ...strategy, ...updateData }
        }
        return strategy
      }))
      
      // Update the modal's angle data
      const updatedAngle = {
        ...viewAngleModal.angle,
        header: editForm.header,
        description: editForm.description,
        objective: editForm.objective,
        tonality: editForm.tonality
      }
      
      setViewAngleModal(prev => ({
        ...prev,
        angle: updatedAngle,
        isEditing: false
      }))
      
      // Force a refresh of the data from the database to ensure consistency
      await fetchStrategies()
      
      alert('Changes saved successfully!')
      
    } catch (error) {
      console.error('Error saving changes:', error)
      alert(`Failed to save changes: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateIdeas = async () => {
    if (!viewAngleModal.strategy || !viewAngleModal.angle) return
    
    setGeneratingIdeas(true)
    
    try {
      const angleData = {
        angleNumber: viewAngleModal.angle.number,
        header: viewAngleModal.angle.header,
        description: viewAngleModal.angle.description,
        objective: viewAngleModal.angle.objective,
        tonality: viewAngleModal.angle.tonality,
        strategy: {
          id: viewAngleModal.strategy.id,
          brand: viewAngleModal.strategy.brand,
          platforms: ["twitter", "linkedin", "newsletter"],
          created_at: viewAngleModal.strategy.created_at
        }
      }

      const webhookPayload = {
        identifier: 'generateIdeas',
        angle: angleData,
      }

      console.log('=== GENERATE IDEAS DEBUG ===')
      console.log('Sending payload to webhook:', webhookPayload)
      
      const response = await fetch('https://n8n.srv856940.hstgr.cloud/webhook/content-saas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      })

      console.log('Webhook response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Webhook request failed with status: ${response.status}`)
      }

      const result = await response.text()
      console.log('Webhook response:', result)
      
      alert('Ideas generated successfully! Check your Ideas page to see the generated content ideas.')
      
    } catch (error) {
      console.error('Error generating ideas:', error)
      alert(`Failed to generate ideas: ${error.message || 'Unknown error'}`)
    } finally {
      setGeneratingIdeas(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Group strategies by brand
  const strategiesByBrand = strategies.reduce((acc, strategy) => {
    const brand = strategy.brand || 'Unknown Brand'
    if (!acc[brand]) {
      acc[brand] = []
    }
    acc[brand].push(strategy)
    return acc
  }, {} as Record<string, Strategy[]>)

  // Get the selected strategy
  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId)
  const currentBrand = selectedStrategy?.brand || 'Unknown Brand'
  const brandStrategies = strategiesByBrand[currentBrand] || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{currentBrand}</h1>
          <p className="mt-2 text-gray-600">
            Content strategies and angles for {currentBrand}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchStrategies} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Angle Modal */}
      {viewAngleModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {viewAngleModal.isEditing ? 'Edit Angle' : viewAngleModal.angle?.header}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {viewAngleModal.strategy?.brand} • Strategy #{viewAngleModal.strategy?.id} • Angle {viewAngleModal.angle?.number}
                  </p>
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
              {/* Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Header
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewAngleModal.isEditing ? (
                    <input
                      type="text"
                      value={editForm.header}
                      onChange={(e) => handleFormChange('header', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter angle header..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {viewAngleModal.angle?.header}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewAngleModal.isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter angle description..."
                    />
                  ) : (
                    <div className="text-gray-700 leading-relaxed">
                      {formatDescription(viewAngleModal.angle?.description || 'No description available')}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Objective */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-green-600" />
                    Objective
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewAngleModal.isEditing ? (
                    <textarea
                      value={editForm.objective}
                      onChange={(e) => handleFormChange('objective', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter angle objective..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {viewAngleModal.angle?.objective}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Tonality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-purple-600" />
                    Tonality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewAngleModal.isEditing ? (
                    <input
                      type="text"
                      value={editForm.tonality}
                      onChange={(e) => handleFormChange('tonality', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter angle tonality..."
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="text-sm px-4 py-2">
                        {viewAngleModal.angle?.tonality}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strategy Context */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Database className="h-5 w-5 mr-2 text-gray-600" />
                    Strategy Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Brand</p>
                    <p className="text-gray-700">{viewAngleModal.strategy?.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Strategy ID</p>
                    <p className="text-gray-700">#{viewAngleModal.strategy?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-gray-700">{viewAngleModal.strategy?.created_at ? formatDate(viewAngleModal.strategy.created_at) : 'Unknown'}</p>
                  </div>
                  {viewAngleModal.strategy?.platforms && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">Platforms</p>
                      <div className="flex flex-wrap gap-2">
                        {viewAngleModal.strategy.platforms.split(',').map((platform, index) => (
                          <Badge key={index} variant="secondary" className="text-xs capitalize">
                            {platform.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex space-x-3">
                {viewAngleModal.isEditing ? (
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
                      onClick={handleGenerateIdeas}
                      loading={generatingIdeas}
                      disabled={generatingIdeas}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generatingIdeas ? 'Generating...' : 'Generate Ideas'}
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

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading strategies...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Strategies</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchStrategies} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Strategies Table */}
      {!loading && !error && selectedStrategy && (
        <div className="space-y-6">
          {/* Brand Header with Strategy Dropdown */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentBrand}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(selectedStrategy.created_at)}
                    </span>
                    <span className="font-medium">{extractAnglesFromStrategy(selectedStrategy).length} content angles</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Strategy Dropdown */}
                {brandStrategies.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedStrategyId || ''}
                      onChange={(e) => setSelectedStrategyId(Number(e.target.value))}
                      className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                    >
                      {brandStrategies.map((strategy) => (
                        <option key={strategy.id} value={strategy.id}>
                          Strategy #{strategy.id} ({extractAnglesFromStrategy(strategy).length} angles)
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Platform Badges */}
                {selectedStrategy.platforms && (
                  <div className="flex flex-wrap gap-2">
                    {selectedStrategy.platforms.split(',').map((platform, index) => (
                      <Badge key={index} variant="secondary" className="text-xs capitalize">
                        {platform.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>
          </div>

          {/* Angle Cards */}
          <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                {extractAnglesFromStrategy(selectedStrategy).map((angle) => (
                  <Card key={angle.number} className="bg-white border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 group">
                    <CardHeader className="pb-1 p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
                          {angle.number}
                        </div>
                        <CardTitle className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {angle.header}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-2 pt-0 pb-3 p-3">
                      {/* Description */}
                      <div>
                        <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded text-xs">
                          {formatDescription(angle.description || 'No description available')}
                        </div>
                      </div>
                      
                      {/* Objective & Tonality in one row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1 min-w-0 flex-1">
                          <Target className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">Goal</span>
                        </div>
                        <div className="flex items-center space-x-1 min-w-0">
                          <Zap className="h-2.5 w-2.5 text-purple-500 flex-shrink-0" />
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 truncate max-w-16">
                            {angle.tonality.length > 8 ? angle.tonality.substring(0, 8) + '...' : angle.tonality}
                          </Badge>
                        </div>
                      </div>
      )}

                      {/* View Button */}
                      <div className="pt-0.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs py-1 px-2 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-colors"
                          onClick={() => handleViewAngle(selectedStrategy, angle)}
                        >
                          <Eye className="h-2.5 w-2.5 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      {/* Empty State */}
      {!loading && !error && strategies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No strategies found
            </h3>
            <p className="text-gray-500 mb-6">
              The strategies table in your Supabase database is empty.
            </p>
            <Button onClick={fetchStrategies}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}