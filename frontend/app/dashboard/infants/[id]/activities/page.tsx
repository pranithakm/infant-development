'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Activity, Lightbulb, BookOpen, Music, Palette, Search } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function ActivitiesPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore()
  const [searchTerm, setSearchTerm] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
    }
  }, [params.id, fetchInfant])

  // Sample activities data - in a real app, this would come from an API
  const activities = [
    {
      id: 1,
      title: t('sensory_play'),
      description: t('sensory_play_desc'),
      category: 'sensory',
      ageRange: '0-6 months',
      icon: Palette,
      difficulty: 'Beginner',
      materials: [t('soft_toys'), t(' rattles')]
    },
    {
      id: 2,
      title: t('tummy_time'),
      description: t('tummy_time_desc'),
      category: 'physical',
      ageRange: '0-3 months',
      icon: Activity,
      difficulty: 'Beginner',
      materials: [t('play_mat'), t('toys')]
    },
    {
      id: 3,
      title: t('reading_together'),
      description: t('reading_together_desc'),
      category: 'cognitive',
      ageRange: '6+ months',
      icon: BookOpen,
      difficulty: 'Intermediate',
      materials: [t('board_books')]
    },
    {
      id: 4,
      title: t('musical_exploration'),
      description: t('musical_exploration_desc'),
      category: 'sensory',
      ageRange: '3-12 months',
      icon: Music,
      difficulty: 'Beginner',
      materials: [t('musical_toys'), t('rattles')]
    },
    {
      id: 5,
      title: t('fine_motor_skills'),
      description: t('fine_motor_skills_desc'),
      category: 'physical',
      ageRange: '9-18 months',
      icon: Activity,
      difficulty: 'Intermediate',
      materials: [t('stacking_toys'), t('blocks')]
    },
    {
      id: 6,
      title: t('problem_solving'),
      description: t('problem_solving_desc'),
      category: 'cognitive',
      ageRange: '12+ months',
      icon: Lightbulb,
      difficulty: 'Advanced',
      materials: [t('shape_sorters'), t('puzzles')]
    }
  ]

  // Filter activities based on search term
  const filteredActivities = activities.filter(activity => 
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get unique categories
  const categories = ['All', ...new Set(activities.map(a => a.category))]

  // Filter activities by category
  const [selectedCategory, setSelectedCategory] = useState('All')
  const categoryFilteredActivities = selectedCategory === 'All' 
    ? filteredActivities 
    : filteredActivities.filter(activity => activity.category === selectedCategory)

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">{t('loading_activities')}</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('activities')}</h1>
        <p className="text-gray-600 mb-6">{t('fun_activities_for_development')}</p>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={t('search_activities')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {category === 'All' ? t('all') : t(category)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Grid */}
        {categoryFilteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-16 w-16 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-xl font-medium text-gray-900">{t('no_activities_found')}</h3>
              <p className="mt-2 text-gray-600">{t('try_adjusting_your_search')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryFilteredActivities.map(activity => {
              const IconComponent = activity.icon
              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start">
                      <div className="rounded-full bg-blue-100 p-2 mr-3">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{activity.title}</h3>
                        <p className="text-sm text-gray-600">{activity.ageRange}</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        activity.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                        activity.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t(activity.difficulty.toLowerCase())}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t(activity.category)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{t('materials_needed')}:</h4>
                      <div className="flex flex-wrap gap-1">
                        {activity.materials.map((material, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      {t('start_activity')}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}