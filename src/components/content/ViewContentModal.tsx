import React, { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { X, Edit3, Save, Eye, FileText, Target, Zap, Calendar, User, Copy, Check } from 'lucide-react'
import { formatDate } from '../../lib/utils'
import { db } from '../../lib/firebase'
import { doc, updateDoc } from 'firebase/firestore'

interface ViewContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: any
  strategyId?: string
}

interface AngleViewerProps {
  angle: any
  angleIndex: number
  onClose: () => void
  onSave: (updatedAngle: any) => void
}

function AngleViewer({ angle, angleIndex, onClose, onSave }: AngleViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedAngle, setEditedAngle] = useState(angle)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editedAngle)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving angle:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedAngle(angle)
    setIsEditing(false)
  }

  const handleCopy = async () => {
    try {
      const textToCopy = `${editedAngle.header || editedAngle.title || `Angle ${angleIndex + 1}`}\n\n${editedAngle.description || editedAngle.content || ''}`
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editedAngle.header || editedAngle.title || `Content Angle ${angleIndex + 1}`}
              </h2>
              <p className="text-sm text-gray-500">Strategy Content Angle</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Angle Title/Header"
                value={editedAngle.header || editedAngle.title || ''}
                onChange={(e) => setEditedAngle(prev => ({ ...prev, header: e.target.value, title: e.target.value }))}
                placeholder="Enter angle title..."
              />
              
              <Textarea
                label="Angle Description/Content"
                value={editedAngle.description || editedAngle.content || ''}
                onChange={(e) => setEditedAngle(prev => ({ ...prev, description: e.target.value, content: e.target.value }))}
                rows={15}
                placeholder="Enter the full angle description and content strategy..."
              />
              
              {editedAngle.contentStructure && (
                <Textarea
                  label="Content Structure"
                  value={editedAngle.contentStructure || ''}
                  onChange={(e) => setEditedAngle(prev => ({ ...prev, contentStructure: e.target.value }))}
                  rows={8}
                  placeholder="Content structure and outline..."
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Angle Header/Title */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Angle Focus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {editedAngle.header || editedAngle.title || `Content Angle ${angleIndex + 1}`}
                  </h3>
                </CardContent>
              </Card>

              {/* Main Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Strategy Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {editedAngle.description || editedAngle.content || 'No description available.'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Structure */}
              {editedAngle.contentStructure && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Zap className="h-5 w-5 mr-2 text-purple-600" />
                      Content Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {editedAngle.contentStructure}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional Properties */}
              {(editedAngle.targetAudience || editedAngle.platforms || editedAngle.tone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <User className="h-5 w-5 mr-2 text-teal-600" />
                      Additional Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editedAngle.targetAudience && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Target Audience</h4>
                        <p className="text-gray-700">{editedAngle.targetAudience}</p>
                      </div>
                    )}
                    
                    {editedAngle.platforms && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Platforms</h4>
                        <div className="flex flex-wrap gap-2">
                          {(Array.isArray(editedAngle.platforms) ? editedAngle.platforms : [editedAngle.platforms]).map((platform, idx) => (
                            <Badge key={idx} variant="secondary">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {editedAngle.tone && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tone</h4>
                        <p className="text-gray-700">{editedAngle.tone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ViewContentModal({ isOpen, onClose, content, strategyId }: ViewContentModalProps) {
  const [selectedAngle, setSelectedAngle] = useState<{ angle: any; index: number } | null>(null)
  const [parsedContent, setParsedContent] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (content && content.body) {
      try {
        if (typeof content.body === 'string' && (content.body.startsWith('[') || content.body.startsWith('{'))) {
          const parsed = JSON.parse(content.body)
          setParsedContent(parsed)
        } else {
          setParsedContent(content.body)
        }
      } catch (error) {
        console.error('Error parsing content:', error)
        setParsedContent(content.body)
      }
    }
  }, [content])

  const handleAngleClick = (angle: any, index: number) => {
    setSelectedAngle({ angle, index })
  }

  const handleAngleSave = async (updatedAngle: any) => {
    if (!content || !parsedContent) return

    try {
      // Update the angle in the parsed content
      let updatedContent
      if (Array.isArray(parsedContent)) {
        updatedContent = [...parsedContent]
        updatedContent[selectedAngle!.index] = updatedAngle
      } else {
        updatedContent = updatedAngle
      }

      // Update in Firebase
      const docRef = doc(db, content.source === 'strategy' ? 'strategy' : 'content', content.firebaseId || content.id)
      await updateDoc(docRef, {
        body: JSON.stringify(updatedContent),
        updated_at: new Date().toISOString()
      })

      // Update local state
      setParsedContent(updatedContent)
      
      console.log('Angle updated successfully')
    } catch (error) {
      console.error('Error updating angle:', error)
      throw error
    }
  }

  const handleCopy = async () => {
    try {
      const textToCopy = typeof parsedContent === 'string' 
        ? parsedContent 
        : JSON.stringify(parsedContent, null, 2)
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  if (!isOpen || !content) return null

  // If an angle is selected, show the angle viewer
  if (selectedAngle) {
    return (
      <AngleViewer
        angle={selectedAngle.angle}
        angleIndex={selectedAngle.index}
        onClose={() => setSelectedAngle(null)}
        onSave={handleAngleSave}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
              <p className="text-sm text-gray-500">
                {content.brand_name} • {formatDate(content.created_at)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 min-h-0">
          {/* Content Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-medium text-blue-900">Type</p>
              <p className="text-lg font-bold text-blue-700 capitalize">
                {content.type?.replace('_', ' ') || 'Content'}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-sm font-medium text-green-900">Status</p>
              <p className="text-lg font-bold text-green-700 capitalize">{content.status}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-sm font-medium text-purple-900">Word Count</p>
              <p className="text-lg font-bold text-purple-700">
                {content.metadata?.word_count || 0}
              </p>
            </div>
          </div>

          {/* Strategy Angles */}
          {Array.isArray(parsedContent) && parsedContent.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2 text-purple-600" />
                Select an angle below to generate specific content ideas from that strategy approach:
              </h3>
              <div className="space-y-4">
                {parsedContent.map((angle, index) => (
                  <Card 
                    key={index} 
                    className="hover:shadow-md transition-shadow duration-200 cursor-pointer border-2 border-gray-100 hover:border-purple-200"
                    onClick={() => handleAngleClick(angle, index)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                Angle {index + 1}
                              </h4>
                              <Badge variant="secondary">Strategy</Badge>
                              <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 mb-3">
                              {angle.header || angle.title || `Content Angle ${index + 1}`}
                            </h3>
                            
                            <div className="text-gray-700 mb-4">
                              <p className="line-clamp-3">
                                {angle.description || angle.content || 'No description available.'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <button className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                                <Eye className="h-4 w-4 mr-1" />
                                Click to view full angle details
                              </button>
                              <span className="text-sm text-gray-500">
                                {angle.description?.split(' ').length || angle.content?.split(' ').length || 0} words
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* Single Content Display */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {typeof parsedContent === 'string' 
                      ? parsedContent 
                      : JSON.stringify(parsedContent, null, 2)
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {content.metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {content.metadata.prompt && (
                    <div>
                      <p className="font-medium text-gray-900">Original Prompt</p>
                      <p className="text-gray-600">{content.metadata.prompt}</p>
                    </div>
                  )}
                  {content.metadata.generated_at && (
                    <div>
                      <p className="font-medium text-gray-900">Generated At</p>
                      <p className="text-gray-600">{formatDate(content.metadata.generated_at)}</p>
                    </div>
                  )}
                  {content.platforms && (
                    <div>
                      <p className="font-medium text-gray-900">Platforms</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {content.platforms.map((platform: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}