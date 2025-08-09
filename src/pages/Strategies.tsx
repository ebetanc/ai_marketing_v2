import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { 
  FileText, 
  Plus,
  Zap
} from 'lucide-react'

export function Strategies() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
          <p className="mt-2 text-gray-600">
            View and manage your AI-generated content strategies.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Strategy
        </Button>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="text-center py-12">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No strategies yet
          </h3>
          <p className="text-gray-500 mb-6">
            Generate your first content strategy to see it here.
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Your First Strategy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}