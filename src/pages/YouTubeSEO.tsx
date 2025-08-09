import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Youtube, ArrowRight, FileText } from 'lucide-react'

export function YouTubeSEO() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">YouTube Transcript → SEO Blog</h1>
          <p className="mt-2 text-gray-600">
            Transform YouTube video transcripts into SEO-optimized blog posts.
          </p>
        </div>
        <Button>
          <Youtube className="h-4 w-4 mr-2" />
          Start Conversion
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Youtube className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">YouTube to SEO Blog Converter</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            This powerful tool will extract YouTube video transcripts and transform them into 
            SEO-optimized blog posts with proper headings, keywords, and structure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Youtube className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Extract Transcript</h4>
              <p className="text-sm text-gray-600">Automatically pull transcripts from YouTube videos</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI Processing</h4>
              <p className="text-sm text-gray-600">Transform content with SEO optimization</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">SEO Blog Post</h4>
              <p className="text-sm text-gray-600">Get a fully optimized blog post ready to publish</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}