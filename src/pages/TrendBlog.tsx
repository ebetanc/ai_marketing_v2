import React from 'react'
import { Button } from '../components/ui/Button'
import { TrendingUp, Zap, Target, BarChart3 } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function TrendBlog() {
  useDocumentTitle('Trend Blog — AI Marketing')
  return (
    <div className="space-y-6">
      <PageHeader
        title="Trend blog"
        description="Generate blog posts from trends."
        icon={<TrendingUp className="h-5 w-5" />}
        actions={<Button><TrendingUp className="h-4 w-4" />Generate trend blog</Button>}
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<TrendingUp className="h-8 w-8 text-white" />}
        title="Trend blog generator"
        message={(
          <div>
            <p className="mb-8">Create blog content based on the latest trends in your industry.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Trend Analysis</h4>
                <p className="text-sm text-gray-600">Identify trending topics</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">AI Generation</h4>
                <p className="text-sm text-gray-600">Create engaging content</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-teal-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Viral Potential</h4>
                <p className="text-sm text-gray-600">Maximize reach</p>
              </div>
            </div>
          </div>
        )}
        variant="orange"
      />
    </div>
  )
}
