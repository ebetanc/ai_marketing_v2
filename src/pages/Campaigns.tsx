import React from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Megaphone, Plus, Calendar, Target, Users } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function Campaigns() {
  useDocumentTitle('Campaigns — AI Marketing')
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-2 text-gray-600">Plan and manage campaigns.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Megaphone className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Campaign builder coming soon</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            A campaign builder is in development with scheduling and performance tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-brand-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Smart scheduling</h4>
              <p className="text-sm text-gray-600">Optimize posting times across all platforms</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-teal-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Multi‑channel</h4>
              <p className="text-sm text-gray-600">Coordinate campaigns across social, email, and ads</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Team collaboration</h4>
              <p className="text-sm text-gray-600">Review and approve campaigns with your team</p>
            </div>
          </div>

          <div className="mt-8">
            <Badge variant="primary" className="text-sm px-4 py-2">
              Phase 2 (Demo)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
