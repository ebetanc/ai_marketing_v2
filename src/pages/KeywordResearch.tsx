import React from 'react'
import { Button } from '../components/ui/Button'
import { Search, Target, Lightbulb } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'

export function KeywordResearch() {
  useDocumentTitle('Keyword Research — AI Marketing')
  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword research"
        description="Turn a keyword into 5 distinct blog ideas."
        icon={<Search className="h-5 w-5" />}
        actions={<Button><Search className="h-4 w-4" />Start research</Button>}
      />

      {/* Coming Soon */}
      <EmptyState
        icon={<Search className="h-8 w-8 text-white" />}
        title="Keyword research"
        message={(
          <div>
            <p className="mb-8">Turn a single keyword into 5 unique, semantically distinct blog ideas.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Keyword Analysis</h4>
                <p className="text-sm text-gray-600">Deep research into intent</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-brand-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Semantic Mapping</h4>
                <p className="text-sm text-gray-600">Related topics & variations</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Lightbulb className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">5 Blog Ideas</h4>
                <p className="text-sm text-gray-600">Unique, researched ideas</p>
              </div>
            </div>
          </div>
        )}
        variant="green"
      />
    </div>
  )
}
