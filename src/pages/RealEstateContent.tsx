import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Building2, Home, MapPin, TrendingUp, Users, FileText } from 'lucide-react'

export function RealEstateContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real Estate Content Agent</h1>
          <p className="mt-2 text-gray-600">
            Generate specialized content for real estate professionals, agents, and property businesses.
          </p>
        </div>
        <Button>
          <Building2 className="h-4 w-4 mr-2" />
          Generate Real Estate Content
        </Button>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="text-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Real Estate Content Generator</h3>
          <p className="text-gray-600 max-w-md mx-auto mb-8">
            Create compelling content tailored specifically for real estate professionals, 
            including property listings, market insights, client communications, and marketing materials.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Property Listings</h4>
              <p className="text-sm text-gray-600">Generate compelling property descriptions and listings</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Market Analysis</h4>
              <p className="text-sm text-gray-600">Create market reports and trend analysis content</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Client Communication</h4>
              <p className="text-sm text-gray-600">Craft professional emails and client updates</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-xl p-6 max-w-lg mx-auto">
            <h4 className="font-semibold text-gray-900 mb-3">Content Types Available:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Property listing descriptions</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Neighborhood guides and area insights</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <span>Market trend reports and analysis</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                <span>Social media posts for real estate</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                <span>Client newsletters and updates</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                <span>Blog posts about buying/selling tips</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}