'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ExternalLink, 
  Info, 
  Target, 
  Award, 
  LayoutList, 
  Globe,
  Loader2
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { schemesAPI } from '@/lib/api'

interface Scheme {
  _id: string
  Name: string
  'State/Scope': string
  Type: string
  'Eligibility / Target Group': string
  Objective: string
  Benefits: string
  Description: string
  'Official Link': string
}

export default function SchemesPage() {
  const { t } = useTranslation()
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const response = await schemesAPI.getSchemes()
        if (response.data.success) {
          setSchemes(response.data.data)
        } else {
          toast.error('Failed to fetch schemes')
        }
      } catch (error) {
        console.error('Error fetching schemes:', error)
        toast.error('Error connecting to backend')
      } finally {
        setLoading(false)
      }
    }

    fetchSchemes()
  }, [])

  const filteredSchemes = schemes.filter(scheme => 
    scheme.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scheme.Description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scheme['State/Scope'].toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutList className="h-8 w-8 text-primary-600" />
            {t('schemes')}
          </h1>
          <p className="text-gray-500 mt-1">
            Discover Government schemes and programs for infant development and wellbeing.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search schemes..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredSchemes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No schemes found</h3>
          <p className="text-gray-500">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme._id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="secondary" className="mb-2 bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {scheme['State/Scope']}
                  </Badge>
                  {scheme.Type && (
                    <Badge variant="outline" className="text-xs uppercase tracking-wider">
                      {scheme.Type}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                  {scheme.Name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {scheme.Description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700">Eligibility:</span>
                      <p className="text-gray-600 leading-relaxed">{scheme['Eligibility / Target Group']}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <Award className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-700">Benefits:</span>
                      <p className="text-gray-600 leading-relaxed">{scheme.Benefits}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => window.open(scheme['Official Link'].startsWith('http') ? scheme['Official Link'] : `https://${scheme['Official Link']}`, '_blank')}
                >
                  Visit Official Website
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
