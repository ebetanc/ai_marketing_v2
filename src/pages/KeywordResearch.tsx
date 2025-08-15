import React from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Search, Target, Lightbulb } from 'lucide-react'

export function KeywordResearch() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Keyword Research Agent</h1>
          <p className="mt-2 text-gray-600">
            Turn one keyword into 5 smart, semantically distinct blog post ideas — researched, mapped and ready to brief.
          </p>
        </div>
        <Button>
          <Search className="h-4 w-4" />
          Start Research
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Keyword Research Agent</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Transform a single keyword into a comprehensive content strategy with 5 unique,
            semantically distinct blog post ideas that are fully researched and ready to execute.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Keyword Analysis</h4>
              <p className="text-sm text-gray-600">Deep research into search intent and competition</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Semantic Mapping</h4>
              <p className="text-sm text-gray-600">Find related topics and semantic variations</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">5 Blog Ideas</h4>
              <p className="text-sm text-gray-600">Unique, researched blog post concepts ready to write</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-6 max-w-lg mx-auto">
            <h4 className="font-semibold text-gray-900 mb-3">What You'll Get:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>5 semantically distinct blog post angles</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Search volume and competition analysis</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span>Target audience mapping for each idea</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Content briefs ready for writing</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                <span>Related keywords and LSI terms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
