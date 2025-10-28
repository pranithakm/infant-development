'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Activity, CheckCircle, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { InfantMilestone } from '@/types'
import { useTranslation } from 'react-i18next'

export default function TrackerPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [filteredMilestones, setFilteredMilestones] = useState<InfantMilestone[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
    }
  }, [params.id, fetchInfant])

  useEffect(() => {
    if (selectedInfant) {
      // Filter milestones by category
      if (activeCategory === 'All') {
        setFilteredMilestones(selectedInfant.milestones)
      } else {
        setFilteredMilestones(
          selectedInfant.milestones.filter(
            (milestone) => milestone.milestoneId.category === activeCategory
          )
        )
      }
    }
  }, [selectedInfant, activeCategory])

  // Get unique categories
  const categories = selectedInfant 
    ? ['All', ...new Set(selectedInfant.milestones.map(m => m.milestoneId.category))]
    : ['All']

  // Calculate progress by category
  const calculateCategoryProgress = (category: string) => {
    if (!selectedInfant) return 0
    
    const categoryMilestones = selectedInfant.milestones.filter(
      m => category === 'All' || m.milestoneId.category === category
    )
    
    if (categoryMilestones.length === 0) return 0
    
    const completed = categoryMilestones.filter(
      m => m.status === 'Achieved' || m.status === 'Mastered'
    ).length
    
    return Math.round((completed / categoryMilestones.length) * 100)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return 'bg-gray-200 text-gray-800'
      case 'Emerging': return 'bg-yellow-100 text-yellow-800'
      case 'Developing': return 'bg-blue-100 text-blue-800'
      case 'Achieved': return 'bg-green-100 text-green-800'
      case 'Mastered': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-200 text-gray-800'
    }
  }

  // Group milestones by status
  const groupedMilestones = filteredMilestones.reduce((acc, milestone) => {
    const status = milestone.status
    if (!acc[status]) {
      acc[status] = []
    }
    acc[status].push(milestone)
    return acc
  }, {} as Record<string, InfantMilestone[]>)

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">{t('loading_tracker')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline">{t('back_to_dashboard')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <Activity className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">{t('infant_not_found')}</h3>
            <p className="mt-2 text-gray-600">{t('infant_not_found_desc')}</p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline">{t('back_to_dashboard')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('milestone_tracker')}</h1>
        <p className="text-gray-600 mb-6">{t('track_your_infants_development')}</p>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('total_milestones')}</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedInfant.milestones.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('achieved')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedInfant.milestones.filter(m => m.status === 'Achieved' || m.status === 'Mastered').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('in_progress')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedInfant.milestones.filter(m => m.status === 'Emerging' || m.status === 'Developing').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-gray-100 p-3">
                  <Activity className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('not_started')}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedInfant.milestones.filter(m => m.status === 'Not Started').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Card className="mb-6">
          <CardContent className="p-0">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto px-6 py-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                      activeCategory === category
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category === 'All' ? t('all') : t(category)}
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {category === 'All' 
                        ? selectedInfant.milestones.length 
                        : selectedInfant.milestones.filter(m => m.milestoneId.category === category).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeCategory === 'All' ? t('overall_progress') : t(activeCategory)} {t('progress')}
              </h2>
              <span className="text-2xl font-bold text-blue-600">{calculateCategoryProgress(activeCategory)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full" 
                style={{ width: `${calculateCategoryProgress(activeCategory)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones by Status */}
        <div className="space-y-6">
          {Object.entries(groupedMilestones).map(([status, milestones]) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)} mr-3`}>
                    {t(status.toLowerCase().replace(' ', '_'))}
                  </span>
                  <span className="text-gray-600">
                    ({milestones.length} {milestones.length === 1 ? t('milestone') : t('milestones')})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {milestones.map((infantMilestone) => {
                    const milestone = infantMilestone.milestoneId
                    return (
                      <Card key={infantMilestone._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          <div className="mt-3 flex items-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {t(milestone.category)}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {milestone.recommendedAge}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}