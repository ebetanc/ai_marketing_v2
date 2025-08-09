import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, FileText, Calendar, User, Target, Zap, Globe, Eye, Copy, Check, ChevronDown, ChevronRight, Edit, Save } from 'lucide-react'
import { formatDate, truncateText } from '../../lib/utils'
import { db } from '../../lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface ViewContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: any
  strategyId?: string
}

// Helper function to format individual idea descriptions
const formatIdeaDescription = (item: any) => {
  console.log('formatIdeaDescription called with item:', item)
  console.log('Item type:', typeof item)
  console.log('Item keys:', Object.keys(item || {}))
  
  // Try different fields for content
  let description = item.description || item.content || item.body || item.text || item.hook || item.angle || item.approach || ''
  
  // If no description found, try to construct from other fields
  if (!description) {
    const parts = []
    if (item.hook) parts.push(`Hook: ${item.hook}`)
    if (item.angle) parts.push(`Angle: ${item.angle}`)
    if (item.approach) parts.push(`Approach: ${item.approach}`)
    if (item.keyPoints && Array.isArray(item.keyPoints)) {
      parts.push(`Key Points: ${item.keyPoints.join(', ')}`)
    }
    if (item.topic) parts.push(`Topic: ${item.topic}`)
    if (item.title) parts.push(`Title: ${item.title}`)
    description = parts.join('\n\n')
  }
  
  // If still no description, try to extract from the raw item
  if (!description && typeof item === 'string') {
    description = item
  }
  
  // If still no description, try to stringify the object and clean it
  if (!description && typeof item === 'object') {
    // Try to extract meaningful content from object keys
    const meaningfulKeys = ['description', 'content', 'body', 'text', 'hook', 'angle', 'approach', 'topic', 'title', 'summary', 'idea']
    for (const key of meaningfulKeys) {
      if (item[key] && typeof item[key] === 'string') {
        description = item[key]
        break
      }
    }
  }
  
  // Clean up the description
  if (typeof description === 'string') {
    return description
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\\n/g, '\n') // Convert escaped newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^\s*,\s*/, '') // Remove leading commas
      .replace(/\s*,\s*$/, '') // Remove trailing commas
      .trim()
  }
  
  // If description is an object, try to extract meaningful content
  if (typeof description === 'object') {
    const str = JSON.stringify(description, null, 2)
    // Try to make it more readable
    return str
      .replace(/[{}[\]"]/g, '') // Remove JSON characters
      .replace(/,\s*\n\s*/g, '\n') // Convert commas to newlines
      .replace(/:\s*/g, ': ') // Clean up colons
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()
  }
  
  return String(description).trim() || 'Content idea (no description available)'
}

// Helper function to parse strategy content and extract individual angles
const parseStrategyAngles = (content: any) => {
  console.log('Parsing strategy angles from content:', content)
  
  let bodyContent = content.body || content.body_text || ''
  
  // If it's a JSON string, try to parse it
  if (typeof bodyContent === 'string' && (bodyContent.startsWith('[') || bodyContent.startsWith('{'))) {
    try {
      bodyContent = JSON.parse(bodyContent)
    } catch (error) {
      console.log('Failed to parse JSON, using raw string')
    }
  }
  
  // If it's still a string, try to extract angles using text parsing
  if (typeof bodyContent === 'string') {
    console.log('Parsing angles from text content')
    
    // Look for "Content Strategy with X angles:" pattern
    const strategyMatch = bodyContent.match(/Content Strategy with (\d+) angles?:/i)
    if (strategyMatch) {
      const angleCount = parseInt(strategyMatch[1])
      console.log(`Found strategy with ${angleCount} angles`)
      
      // Split by "Angle X:" pattern
      const angleSections = bodyContent.split(/Angle \d+:/i)
      
      // Remove the first section (before first angle)
      angleSections.shift()
      
      const angles = angleSections.map((section, index) => {
        const angleNumber = index + 1
        
        // Extract the title (first line after "Angle X:")
        const lines = section.trim().split('\n')
        const title = lines[0]?.trim() || `Angle ${angleNumber}`
        
        // Get the rest as content
        const content = lines.slice(1).join('\n').trim()
        
        return {
          id: angleNumber,
          title: title,
          description: content,
          angle: angleNumber,
          isStrategy: true,
          platform: 'Strategy'
        }
      })
      
      console.log(`Parsed ${angles.length} angles:`, angles)
      return angles
    }
  }
  
  // Fallback: return as single strategy
  return [{
    id: 0,
    title: content.title || 'Content Strategy',
    description: typeof bodyContent === 'string' ? bodyContent : JSON.stringify(bodyContent, null, 2),
    angle: 1,
    isStrategy: true,
    platform: 'Strategy'
  }]
}
// Helper function to format ideas content for display in modal
const formatIdeasForDisplay = (content: any) => {
  console.log('Formatting ideas for display, content:', content)
  console.log('Content body type:', typeof content.body)
  console.log('Content body value:', content.body)
  console.log('Content type:', content.type)
  
  // Try to parse the content body to extract structured ideas
  let parsedContent = null
  try {
    if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
      parsedContent = JSON.parse(content.body)
      console.log('Parsed JSON content:', parsedContent)
      console.log('Parsed content type:', typeof parsedContent)
      console.log('Is array:', Array.isArray(parsedContent))
      
      // For strategies, look for specific strategy fields
      if (content.type === 'content_strategy') {
        console.log('Processing content strategy...')
        
        // Use the new strategy angle parser
        const strategyAngles = parseStrategyAngles(content)
        console.log('Parsed strategy angles:', strategyAngles)
        return strategyAngles
        
      }
    }
  } catch (error) {
    console.log('Failed to parse JSON, using raw content. Error:', error)
    // If parsing fails, use the raw body
    // Clean up raw text content
    const cleanContent = content.body || 'AI-generated content idea'
    return [{
      id: 0,
      title: content.title || 'Content Idea',
      description: cleanContent
        .replace(/[{}[\]"]/g, '') // Remove JSON characters
        .replace(/,\s*/g, '. ') // Replace commas with periods
        .replace(/:\s*/g, ': ') // Clean up colons
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .trim(),
      topic: null,
      angle: null
    }]
  }

  // Format parsed content into structured ideas
  if (parsedContent) {
    if (Array.isArray(parsedContent)) {
      console.log('Processing array of ideas:', parsedContent)
      console.log('Array length:', parsedContent.length)
      return parsedContent.map((item, index) => {
        console.log(`Processing idea ${index}:`, item)
        const formattedDescription = formatIdeaDescription(item)
        console.log(`Formatted description for idea ${index}:`, formattedDescription)
        return {
          id: index,
          title: item.topic || item.title || item.header || item.subject || `Content Idea ${index + 1}`,
          description: formattedDescription,
          topic: item.topic || item.subject || null,
          angle: item.angle || item.angleId || (index + 1),
          platform: item.platform || null
        }
      })
    } else if (typeof parsedContent === 'object') {
      console.log('Processing single idea object:', parsedContent)
      const formattedDescription = formatIdeaDescription(parsedContent)
      console.log('Formatted description for single idea:', formattedDescription)
      return [{
        id: 0,
        title: parsedContent.topic || parsedContent.title || parsedContent.header || parsedContent.subject || content.title || 'Content Idea',
        description: formattedDescription,
        topic: parsedContent.topic || parsedContent.subject || null,
        angle: parsedContent.angle || parsedContent.angleId || 1,
        platform: parsedContent.platform || null
      }]
    }
  }

  console.log('Using fallback content formatting')
  console.log('Raw content body for fallback:', content.body)
  // Fallback for non-JSON content
  let cleanContent = content.body || 'AI-generated content idea'
  
  // If the body is a string but not JSON, try to clean it up
  if (typeof cleanContent === 'string' && cleanContent.length > 0) {
    // Remove common JSON artifacts that might be in plain text
    cleanContent = cleanContent
      .replace(/^\[|\]$/g, '') // Remove array brackets at start/end
      .replace(/^\{|\}$/g, '') // Remove object brackets at start/end
      .replace(/^"|"$/g, '') // Remove quotes at start/end
      .replace(/\\"/g, '"') // Unescape quotes
      .replace(/\\n/g, '\n') // Convert escaped newlines
      .trim()
  }
  
  return [{
    id: 0,
    title: content.title || 'Content Idea',
    description: cleanContent,
    topic: null,
    angle: null
  }]
}

export default function ViewContentModal({ isOpen, onClose, content, strategyId }: ViewContentModalProps) {
  const [parsedPlatforms, setParsedPlatforms] = useState<any[]>([])
  const [expandedSections, setExpandedSections] = useState<{[key: number]: boolean}>({})
  const [copiedStates, setCopiedStates] = useState<{[key: number]: boolean}>({})
  const [editingStates, setEditingStates] = useState<{[key: number]: {isEditing: boolean, editedContent: string, saving: boolean}}>({})
  const [loading, setLoading] = useState(false)
  const [selectedAngle, setSelectedAngle] = useState<any>(null)
  const [showAngleDetail, setShowAngleDetail] = useState(false)
  const [generatingIdeas, setGeneratingIdeas] = useState(false)

  const handleGenerateIdeasFromAngle = async (angleNumber: number, title: string, content: string) => {
    setGeneratingIdeas(true)
    try {
      console.log(`Generating ideas from angle ${angleNumber}: ${title}`)
      console.log('Angle content:', content)
      
      // TODO: Implement actual idea generation logic here
      // This could call your API to generate ideas from this specific angle
    } catch (error) {
      console.error('Error generating ideas from angle:', error)
      console.error('Failed to generate ideas from angle')
    } finally {
      setGeneratingIdeas(false)
    }
  }

  const handleAngleClick = (angleNumber: number, title: string, content: string) => {
    setSelectedAngle({
      number: angleNumber,
      title: title,
      content: content
    })
    setShowAngleDetail(true)
    setShowAngleDetail(false)
  }

  const handleCloseAngleDetail = () => {
    setShowAngleDetail(false)
    setSelectedAngle(null)
  }

  // Parse the content when modal opens
  useEffect(() => {
    if (!isOpen || !content) return

    console.log('=== ViewContentModal Debug ===')
    console.log('Full content object:', JSON.stringify(content, null, 2))
    console.log('Content body:', content.body)
    console.log('Content body_text:', content.body_text)
    console.log('Content type:', content.type)
    
    // Try to parse the content body to extract platform-specific content
    const parseContentBody = (contentItem: any) => {
      let platforms: any[] = []
      
      console.log('Parsing content body for:', contentItem.title)
      console.log('Body content:', contentItem.body)
      console.log('Body_text content:', contentItem.body_text)
      
      // First check if we have body_text (simpler content)
      if (contentItem.body_text && typeof contentItem.body_text === 'string') {
        console.log('Using body_text content')
        platforms = [{
          id: 0,
          platform: contentItem.platform || contentItem.type || 'Generated Content',
          content: contentItem.body_text,
          originalData: { content: contentItem.body_text }
        }]
        return platforms
      }
      
      // Then try to parse the body if it's JSON
      if (contentItem.body && typeof contentItem.body === 'string') {
        try {
          console.log('Attempting to parse JSON body')
          // Check if it's JSON
          if (contentItem.body.startsWith('[') || contentItem.body.startsWith('{')) {
            const parsed = JSON.parse(contentItem.body)
            console.log('Successfully parsed JSON:', parsed)
            
            if (Array.isArray(parsed)) {
              console.log('Body is array with length:', parsed.length)
              // If it's an array, each item should be a platform or content piece
              platforms = parsed.map((item, index) => {
                console.log(`Processing array item ${index}:`, item)
                
                // Extract content from various possible fields
                let itemContent = ''
                if (typeof item === 'string') {
                  itemContent = item
                } else if (item.content) {
                  itemContent = item.content
                } else if (item.description) {
                  itemContent = item.description
                } else if (item.body) {
                  itemContent = item.body
                } else if (item.angles && Array.isArray(item.angles)) {
                  // Handle strategy with angles
                  itemContent = `Content Strategy with ${item.angles.length} angles:\n\n`
                  item.angles.forEach((angle, angleIndex) => {
                    itemContent += `Angle ${angleIndex + 1}: ${angle.header || angle.title || 'Content Angle'}\n`
                    if (angle.description) {
                      itemContent += `${angle.description}\n\n`
                    }
                  })
                } else {
                  // Fallback: stringify the object in a readable way
                  itemContent = Object.entries(item)
                    .filter(([key, value]) => value && key !== 'id')
                    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
                    .join('\n\n')
                }
                
                return {
                  id: index,
                  platform: item.platform || `Content ${index + 1}`,
                  content: itemContent || 'No content available',
                  originalData: item
                }
              })
            } else if (typeof parsed === 'object') {
              console.log('Body is single object:', parsed)
              // Single object
              let objectContent = ''
              
              if (parsed.content) {
                objectContent = parsed.content
              } else if (parsed.description) {
                objectContent = parsed.description
              } else if (parsed.body) {
                objectContent = parsed.body
              } else if (parsed.angles && Array.isArray(parsed.angles)) {
                // Handle strategy with angles
                objectContent = `Content Strategy with ${parsed.angles.length} angles:\n\n`
                parsed.angles.forEach((angle, angleIndex) => {
                  objectContent += `Angle ${angleIndex + 1}: ${angle.header || angle.title || 'Content Angle'}\n`
                  if (angle.description) {
                    objectContent += `${angle.description}\n\n`
                  }
                })
              } else {
                // Convert object to readable format
                objectContent = Object.entries(parsed)
                  .filter(([key, value]) => value && key !== 'id')
                  .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`)
                  .join('\n\n')
              }
              
              platforms = [{
                id: 0,
                platform: parsed.platform || contentItem.platform || 'Generated Content',
                content: objectContent || 'No content available',
                originalData: parsed
              }]
            }
          } else {
            console.log('Body is not JSON, treating as plain text')
            // Not JSON, treat as plain text
            platforms = [{
              id: 0,
              platform: contentItem.platform || 'Generated Content',
              content: contentItem.body,
              originalData: { content: contentItem.body }
            }]
          }
        } catch (error) {
          console.error('Error parsing JSON:', error)
          console.log('Using raw body as fallback')
          // If parsing fails, treat as plain text
          platforms = [{
            id: 0,
            platform: contentItem.platform || 'Generated Content',
            content: contentItem.body,
            originalData: { content: contentItem.body }
          }]
        }
      } else {
        console.log('No body content found, using fallback')
        // Fallback
        platforms = [{
          id: 0,
          platform: contentItem.platform || 'Generated Content',
          content: 'No content available - check Firebase data',
          originalData: {}
        }]
      }
      
      console.log('Final parsed platforms:', platforms)
      return platforms
    }

    const platforms = parseContentBody(content)
    console.log('Setting parsed platforms:', platforms)
    setParsedPlatforms(platforms)
    
    // Initialize all sections as expanded
    const initialExpanded: {[key: number]: boolean} = {}
    platforms.forEach((_, index) => {
      initialExpanded[index] = true
    })
    setExpandedSections(initialExpanded)
  }, [isOpen, content])

  // Reset states when content changes
  useEffect(() => {
    setCopiedStates({})
    setEditingStates({})
  }, [content])
    
  if (!isOpen || !content) return null

  // Helper function to get platform icon
  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase()
    switch (platformLower) {
      case 'twitter': return '🐦'
      case 'linkedin': return '💼'
      case 'facebook': return '📘'
      case 'instagram': return '📸'
      case 'youtube': return '📺'
      case 'tiktok': return '🎵'
      case 'newsletter': return '📧'
      case 'blog': return '📝'
      default: return '📄'
    }
  }

  // Helper function to copy content to clipboard
  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [index]: true }))
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }))
      }, 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setCopiedStates(prev => ({ ...prev, [index]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }))
      }, 2000)
    }
  }

  // Helper function to format content for display
  const formatContent = (content: string) => {
    // Handle newsletter content with markdown-like formatting
    if (content.includes('\\n')) {
      return content
        .replace(/\\n/g, '\n')
        .replace(/# /g, '')
        .replace(/## /g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
    }
    
    return content
  }

  // Handler for posting content
  const handlePostContent = (platformData: any) => {
    const content = formatContent(platformData.content)
    const platform = platformData.platform
    
    // Show confirmation dialog with content preview
    const confirmed = window.confirm(
      `Post this content to ${platform}?\n\n` +
      `Content preview:\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`
    )
    
    if (confirmed) {
      // Here you would integrate with actual posting APIs
      // For now, we'll show a success message
      alert(`Content posted to ${platform} successfully!\n\n(This is a demo - integrate with actual ${platform.toLowerCase()} API)`)
      
      // You can add actual posting logic here:
      // - Twitter API integration
      // - LinkedIn API integration  
      // - Newsletter service integration
      // etc.
    }
  }

  // Toggle section expansion
  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // Handle edit functionality
  const handleEditClick = (index: number, currentContent: string) => {
    setEditingStates(prev => ({
      ...prev,
      [index]: {
        isEditing: true,
        editedContent: currentContent,
        saving: false
      }
    }))
  }

  const handleCancelEdit = (index: number) => {
    setEditingStates(prev => {
      const newState = { ...prev }
      delete newState[index]
      return newState
    })
  }

  const handleSaveEdit = async (index: number, platformData: any) => {
    const editState = editingStates[index]
    if (!editState || !editState.editedContent.trim()) {
      alert('Please enter some content')
      return
    }

    setEditingStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        saving: true
      }
    }))

    try {
      // Import Firebase functions
      const { doc, updateDoc } = await import('firebase/firestore')
      const { db } = await import('../../lib/firebase')
      
      // Update the specific platform content in the original content
      const updatedPlatforms = [...parsedPlatforms]
      updatedPlatforms[index] = {
        ...updatedPlatforms[index],
        content: editState.editedContent
      }
      
      // Update the main content document in Firebase
      const firebaseDocId = content.firebaseId || content.id
      const updatedBody = JSON.stringify(updatedPlatforms.map(p => ({
        platform: p.platform,
        content: p.content,
        ...p.originalData
      })))
      
      await updateDoc(doc(db, 'content', firebaseDocId), {
        body: updatedBody,
        body_text: editState.editedContent, // Update body_text with the edited content
        updated_at: new Date().toISOString()
      })

      // Update local state
      setParsedPlatforms(updatedPlatforms)
      
      // Clear editing state
      handleCancelEdit(index)
      
      console.log('Platform content updated successfully')
    } catch (error) {
      console.error('Error updating platform content:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setEditingStates(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          saving: false
        }
      }))
    }
  }

  const isMultiPlatform = parsedPlatforms.length > 1

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {content.title}
              </h2>
              <p className="text-sm text-gray-500">
                {isMultiPlatform ? `${parsedPlatforms.length} platforms` : 'Content Details'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading content...</p>
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Content Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Title</p>
                      <p className="text-gray-700">{content.title}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Type</p>
                      <p className="text-gray-700 capitalize">{content.type?.replace('_', ' ') || 'Generated Content'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      <Badge variant={content.status === 'approved' ? 'success' : 'warning'}>
                        {content.status || 'draft'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-gray-700 flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(content.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Word Count</p>
                      <p className="text-gray-700">
                        {parsedPlatforms.reduce((total, platform) => 
                          total + (platform.content?.split(' ').length || 0), 0
                        )} words
                      </p>
                    </div>
                    {isMultiPlatform && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Platforms</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {parsedPlatforms.map((platform, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {getPlatformIcon(platform.platform)} {platform.platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Content Sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-purple-600" />
                    Generated Content
                    {isMultiPlatform && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({parsedPlatforms.length} platforms)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Special handling for strategies with multiple angles */}
                  {content.type === 'content_strategy' && parsedPlatforms.length === 1 && parsedPlatforms[0].content && parsedPlatforms[0].content.includes('Content Strategy with') && parsedPlatforms[0].content.includes('angles:') ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">
                          📋 Content Strategy Angles
                        </h3>
                        <p className="text-sm text-purple-700 mb-4">
                          Select an angle below to generate specific content ideas from that strategy approach:
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {(() => {
                            const content = parsedPlatforms[0].content
                            const strategyMatch = content.match(/Content Strategy with (\d+) angles?:/i)
                            if (!strategyMatch) return null
                            
                            const angleCount = parseInt(strategyMatch[1])
                            const angleSections = content.split(/Angle \d+:/i)
                            angleSections.shift() // Remove the first section (before first angle)
                            
                            return angleSections.slice(0, angleCount).map((section, index) => {
                              const angleNumber = index + 1
                              const lines = section.trim().split('\n')
                              const title = lines[0]?.trim() || `Strategy Angle ${angleNumber}`
                              const preview = lines.slice(1).join('\n').trim().substring(0, 150) + '...'
                              
                              return (
                                <button
                                  key={angleNumber}
                                  onClick={() => {
                                    handleAngleClick(angleNumber, title, section.trim())
                                  }}
                                  className="w-full text-left p-4 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group bg-white"
                                  disabled={generatingIdeas}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-lg">⚡</span>
                                        <span className="font-semibold text-purple-900 group-hover:text-purple-700">
                                          Angle {angleNumber}
                                        </span>
                                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                          Strategy
                                        </Badge>
                                      </div>
                                      <h4 className="font-medium text-gray-900 mb-2 group-hover:text-purple-800">
                                        {title}
                                      </h4>
                                      <p className="text-sm text-gray-600 leading-relaxed">
                                        {preview}
                                      </p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                      <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                                        <span className="text-purple-600 font-bold text-sm">
                                          {angleNumber}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 pt-3 border-t border-purple-100 flex items-center justify-between">
                                    <span className="text-xs text-purple-600 font-medium">
                                      Click to view full angle details
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">
                                        {section.trim().split(' ').length} words
                                      </span>
                                      <div className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors">
                                        <Eye className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                  parsedPlatforms.map((platformData, index) => {
                    const contentText = formatContent(platformData.content)
                    const isExpanded = expandedSections[index]
                    const wordCount = contentText.split(' ').length
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Platform Header */}
                        <div 
                          className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleSection(index)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-lg">
                                {platformData.isIdea ? '💡' : getPlatformIcon(platformData.platform)}
                              </span>
                              <span className="font-medium text-gray-900">
                                {platformData.isIdea ? (platformData.ideaTitle || 'Content Idea') : platformData.platform}
                              </span>
                            </div>
                            {platformData.ideaTopic && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                {platformData.ideaTopic}
                              </Badge>
                            )}
                            {platformData.ideaAngle && (
                              <Badge variant="primary" className="text-xs ml-1">
                                Angle {platformData.ideaAngle}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {wordCount} words
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            {!editingStates[index]?.isEditing && !platformData.isIdea && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(index, contentText)}
                                className="flex items-center space-x-1"
                              >
                                <Edit className="h-3 w-3" />
                                <span className="text-xs">Edit</span>
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(contentText, index)}
                              className="flex items-center space-x-1"
                              disabled={editingStates[index]?.isEditing}
                            >
                              {copiedStates[index] ? (
                                <>
                                  <Check className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600 text-xs">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span className="text-xs">Copy</span>
                                </>
                              )}
                            </Button>
                            
                            {!platformData.isIdea && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePostContent(platformData)}
                                className="flex items-center space-x-1"
                                disabled={editingStates[index]?.isEditing}
                              >
                                <span>📤</span>
                                <span className="text-xs">Post to {platformData.platform}</span>
                              </Button>
                            )}
                            <span>Click to view details</span>
                          </div>
                        </div>
                        
                        {/* Platform Content */}
                        {isExpanded && (
                          <div className="p-4 bg-white">
                            {editingStates[index]?.isEditing ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editingStates[index].editedContent}
                                  onChange={(e) => setEditingStates(prev => ({
                                    ...prev,
                                    [index]: {
                                      ...prev[index],
                                      editedContent: e.target.value
                                    }
                                  }))}
                                  rows={6}
                                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                  placeholder="Edit your content..."
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(index, platformData)}
                                    loading={editingStates[index]?.saving}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelEdit(index)}
                                    disabled={editingStates[index]?.saving}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                  {platformData.isStrategy && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="ml-auto text-xs bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                                      onClick={() => {
                                        // TODO: Add functionality to generate ideas from this specific angle
                                        alert(`Generate ideas from: ${platformData.title}\n\nThis will create content ideas based on this specific strategy angle.`)
                                      }}
                                    >
                                      Generate Ideas from This Angle
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {platformData.isIdea || platformData.isStrategy ? (
                                  // Special formatting for ideas
                                  <div className={`rounded-lg p-4 border ${
                                    platformData.isStrategy 
                                      ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100'
                                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100'
                                  }`}>
                                    <div className="space-y-3">
                                      {platformData.ideaTopic && (
                                        <div className="flex items-center space-x-2 mb-3">
                                          <span className={`text-sm font-medium ${
                                            platformData.isStrategy ? 'text-purple-700' : 'text-blue-700'
                                          }`}>
                                            {platformData.isStrategy ? 'Strategy Focus:' : 'Topic:'}
                                          </span>
                                          <span className={`text-sm px-2 py-1 rounded-full ${
                                            platformData.isStrategy 
                                              ? 'text-purple-600 bg-purple-100' 
                                              : 'text-blue-600 bg-blue-100'
                                          }`}>
                                            {platformData.ideaTopic}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <div className="prose prose-sm max-w-none">
                                        <div className="text-gray-800 leading-relaxed text-sm whitespace-pre-wrap">
                                          {contentText}
                                        </div>
                                      </div>
                                      
                                      {platformData.ideaAngle && (
                                        <div className={`flex items-center space-x-2 mt-3 pt-3 border-t ${
                                          platformData.isStrategy ? 'border-purple-200' : 'border-blue-200'
                                        }`}>
                                          <span className={`text-xs font-medium ${
                                            platformData.isStrategy ? 'text-purple-600' : 'text-blue-600'
                                          }`}>
                                            {platformData.isStrategy ? 'Strategy Component:' : 'Content Angle:'}
                                          </span>
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            platformData.isStrategy 
                                              ? 'text-purple-500 bg-purple-50' 
                                              : 'text-blue-500 bg-blue-50'
                                          }`}>
                                            #{platformData.ideaAngle}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  // Regular content formatting
                                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <div className="prose prose-sm max-w-none">
                                      <div 
                                        className="whitespace-pre-wrap text-gray-800 leading-relaxed select-text cursor-text text-sm"
                                        style={{ userSelect: 'text' }}
                                      >
                                        {contentText}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Platform-specific metadata */}
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>
                                  {platformData.isIdea ? 'Content Idea' : 
                                   platformData.isStrategy ? 'Content Strategy' : 
                                   `Platform: ${platformData.platform}`}
                                </span>
                                <span>Words: {wordCount}</span>
                                {platformData.ideaAngle && (
                                  <span>
                                    {platformData.isStrategy ? 'Component' : 'Angle'}: {platformData.ideaAngle}
                                  </span>
                                )}
                              </div>
                              <Badge variant={content.status === 'approved' ? 'success' : 'warning'} className="text-xs">
                                {content.status || 'draft'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                  )}
                </CardContent>
              </Card>

              {/* Bulk Actions */}
              {isMultiPlatform && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Globe className="h-5 w-5 mr-2 text-gray-600" />
                      Bulk Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const allContent = parsedPlatforms.map((platform, index) => 
                            `=== ${platform.platform.toUpperCase()} ===\n\n${formatContent(platform.content)}`
                          ).join('\n\n' + '='.repeat(50) + '\n\n')
                          copyToClipboard(allContent, -1)
                        }}
                        className="flex items-center space-x-2"
                      >
                        {copiedStates[-1] ? (
                          <>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">All Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy All Content</span>
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="primary"
                        onClick={() => {
                          const platforms = parsedPlatforms.map(p => p.platform).join(', ')
                          const confirmed = window.confirm(
                            `Post all content to their respective platforms?\n\n` +
                            `This will post to: ${platforms}`
                          )
                          
                          if (confirmed) {
                            alert(`All content posted successfully!\n\n(This is a demo - integrate with actual platform APIs)`)
                          }
                        }}
                        className="flex items-center space-x-2"
                      >
                        <span>📤</span>
                        <span>Post All Content</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {isMultiPlatform ? `${parsedPlatforms.length} platform content pieces` : 'Single content piece'}
          </div>
        </div>
      </div>
    </div>

    {/* Angle Detail Modal */}
    {showAngleDetail && selectedAngle && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">{selectedAngle.number}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Angle {selectedAngle.number}
                </h2>
                <p className="text-sm text-gray-500">Strategy Details</p>
              </div>
            </div>
            
            <button
              onClick={handleCloseAngleDetail}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedAngle.title}
                </h3>
                <Badge variant="primary" className="text-xs">
                  Strategy Angle {selectedAngle.number}
                </Badge>
              </div>

              {/* Full Content */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
                <h4 className="text-sm font-medium text-purple-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Full Strategy Content
                </h4>
                <div className="prose prose-sm max-w-none">
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {selectedAngle.content}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">Word Count</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {selectedAngle.content.split(' ').length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">Character Count</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {selectedAngle.content.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedAngle.content)
                    .then(() => alert('Angle content copied to clipboard!'))
                    .catch(() => alert('Failed to copy content'))
                }}
                className="flex items-center space-x-2"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Content</span>
              </Button>
              
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseAngleDetail()
                  handleGenerateIdeasFromAngle(selectedAngle.number, selectedAngle.title, selectedAngle.content)
                }}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="h-4 w-4" />
                <span>Generate Ideas from This Angle</span>
              </Button>
            </div>
            
            <Button variant="outline" onClick={handleCloseAngleDetail}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export { ViewContentModal }