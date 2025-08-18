import React from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TrendingUp, Zap, Target, BarChart3 } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function TrendBlog() {
  useDocumentTitle('Trend Blog — AI Marketing')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trend blog</h1>
          <p className="mt-2 text-gray-600">Generate blog posts from trends.</p>
        </div>
        <Button>
          <TrendingUp className="h-4 w-4" />
          Generate trend blog
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Trend blog generator</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Stay ahead of the curve by creating blog content based on the latest trends,
            viral topics, and emerging conversations in your industry.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
              <p className="text-sm text-gray-600">Identify trending topics in your niche</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">AI Generation</h4>
              <p className="text-sm text-gray-600">Create engaging content around trends</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Viral Potential</h4>
              <p className="text-sm text-gray-600">Maximize reach with trending content</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
