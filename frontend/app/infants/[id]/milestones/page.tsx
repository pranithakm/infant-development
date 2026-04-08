'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Activity, ArrowUpDown, Filter } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { InfantMilestone } from '@/types'
import { useTranslation } from 'react-i18next'

export default function MilestonesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { selectedInfant, loading, error, fetchInfant, updateMilestoneStatus } = useInfantStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [filteredMilestones, setFilteredMilestones] = useState<InfantMilestone[]>([])
  const [sortOption, setSortOption] = useState('age') // age, status
  const [statusFilter, setStatusFilter] = useState('All') // All, Not Started, Emerging, etc.
  const [showFilters, setShowFilters] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    fetchInfant(params.id)
  }, [params.id, fetchInfant])

  useEffect(() => {
    if (selectedInfant) {
      let milestones = selectedInfant.milestones

      // Filter by category
      if (activeCategory !== 'All') {
        milestones = milestones.filter(
          (milestone) => milestone.milestoneId.category === activeCategory
        )
      }

      // Filter by status
      if (statusFilter !== 'All') {
        milestones = milestones.filter(
          (milestone) => milestone.status === statusFilter
        )
      }

      // Sort milestones
      milestones.sort((a, b) => {
        switch (sortOption) {
          case 'age':
            return a.milestoneId.minMonths - b.milestoneId.minMonths
          case 'status':
            return a.status.localeCompare(b.status)
          default:
            return 0
        }
      })

      setFilteredMilestones(milestones)
    }
  }, [selectedInfant, activeCategory, sortOption, statusFilter])

  const handleStatusChange = async (milestoneId: string, status: string) => {
    if (!selectedInfant) return
    
    try {
      const result = await updateMilestoneStatus(selectedInfant._id, milestoneId, status)
      if (result) {
        toast.success(t('milestone_status_updated'))
      }
    } catch (err) {
      toast.error(t('failed_to_update_milestone'))
    }
  }

  // Get unique categories
  const categories = selectedInfant 
    ? ['All', ...new Set(selectedInfant.milestones.map(m => m.milestoneId.category))]
    : ['All']

  // Get unique statuses
  const statuses = selectedInfant
    ? ['All', ...new Set(selectedInfant.milestones.map(m => m.status))]
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

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-600">{t('loading_milestones')}</p>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('milestones')}</h1>
          <p className="text-gray-600 mt-2">{t('track_update_milestones')}</p>
        </div>

        {/* Milestone Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              {t('developmental_milestones_for')} {selectedInfant.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Controls - Sort, View, Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  {t('filters')}
                </Button>
                
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="age">{t('sort_by_age')}</option>
                    <option value="status">{t('sort_by_status')}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('status_filter')}</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 rounded shadow leading-tight focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Category Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeCategory === category
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category}
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {category === 'All' 
                        ? selectedInfant.milestones.length 
                        : selectedInfant.milestones.filter(m => m.milestoneId.category === category).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Progress Summary */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">
                  {activeCategory === 'All' ? t('overall_progress') : activeCategory} {t('progress')}
                </span>
                <span className="font-medium">{calculateCategoryProgress(activeCategory)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${calculateCategoryProgress(activeCategory)}%` }}
                ></div>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-4">
              {filteredMilestones.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{t('no_milestones_found')}</h3>
                  <p className="mt-1 text-gray-500">
                    {t('no_milestones_matching_filters')}
                  </p>
                </div>
              ) : (
                filteredMilestones.map((infantMilestone) => {
                  const milestone = infantMilestone.milestoneId
                  return (
                    <div key={infantMilestone._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{milestone.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{milestone.description}</p>
                          <div className="mt-2 flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {milestone.recommendedAge}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {milestone.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(infantMilestone.status)}`}>
                            {infantMilestone.status}
                          </span>
                          <select
                            value={infantMilestone.status}
                            onChange={(e) => handleStatusChange(milestone._id, e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="Not Started">{t('not_started')}</option>
                            <option value="Emerging">{t('emerging')}</option>
                            <option value="Developing">{t('developing')}</option>
                            <option value="Achieved">{t('achieved')}</option>
                            <option value="Mastered">{t('mastered')}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}