'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { 
  Baby, 
  Target, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Ruler,
  Weight,
  Activity,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useInfantStore } from '@/store/infantStore'
import { Infant, InfantMilestone, GrowthMeasurement } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

// Define status types
type MilestoneStatus = 'Completed' | 'Pending' | 'Upcoming' | 'In Progress'

type InfantMilestoneStatus = 'Not Started' | 'Emerging' | 'Developing' | 'Achieved' | 'Mastered'

// Helper function to check if milestone is completed
const isMilestoneCompleted = (status: InfantMilestoneStatus): boolean => {
  return status === 'Achieved' || status === 'Mastered';
};

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

interface MilestoneWithStatus {
  _id: string
  name: string
  description: string
  category: string
  minMonths: number
  maxMonths: number
  status: MilestoneStatus
  infantMilestoneStatus: InfantMilestoneStatus
}

export default function ProgressPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { selectedInfant, loading, error, fetchInfant, fetchGrowthMeasurements, growthMeasurements, updateMilestoneStatus } = useInfantStore()
  const [milestonesWithStatus, setMilestonesWithStatus] = useState<MilestoneWithStatus[]>([])
  const [filteredMilestones, setFilteredMilestones] = useState<MilestoneWithStatus[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pending: true,
    inProgress: true,
    completed: true,
    upcoming: true
  })
  const { t, i18n } = useTranslation()

  // Function to capitalize words for English language
  const capitalizeEnglish = (text: string | undefined) => {
    if (!text || typeof text !== 'string' || i18n.language !== 'en') return text || '';
    return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const handleStatusChange = async (milestoneId: string, status: string) => {
    if (!selectedInfant) return
    
    try {
      console.log('Updating milestone status:', { milestoneId, status });
      const result = await updateMilestoneStatus(selectedInfant._id, milestoneId, status)
      if (result) {
        // Log the result for debugging
        console.log('Milestone status updated successfully:', result);
        
        // Validate that minMonths and maxMonths are preserved
        const updatedMilestone = result.milestones.find((m: any) => m.milestoneId._id === milestoneId);
        if (updatedMilestone) {
          console.log('Updated milestone data:', updatedMilestone);
          if (!updatedMilestone.milestoneId.minMonths && !updatedMilestone.milestoneId.maxMonths) {
            console.error('minMonths and maxMonths are still missing after update!');
          }
        }
        
        toast.success(t('milestone_status_updated'))
      }
    } catch (err) {
      console.error('Failed to update milestone status:', err);
      toast.error(t('failed_to_update_milestone'))
    }
  }

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
      fetchGrowthMeasurements(params.id)
    }
  }, [params.id, fetchInfant, fetchGrowthMeasurements])

  useEffect(() => {
    if (selectedInfant) {
      // Log the infant data for debugging
      console.log('Processing infant data:', selectedInfant);
      
      // Calculate infant age in months
      const birthDate = new Date(selectedInfant.dateOfBirth)
      const currentDate = new Date()
      
      // Calculate exact age in months
      let ageInMonths = (currentDate.getFullYear() - birthDate.getFullYear()) * 12
      ageInMonths -= birthDate.getMonth()
      ageInMonths += currentDate.getMonth()
      
      // Adjust for day in month
      if (currentDate.getDate() < birthDate.getDate()) {
        ageInMonths--
      }
      
      // Process milestones with status
      const processedMilestones: MilestoneWithStatus[] = selectedInfant.milestones.map((infantMilestone: InfantMilestone) => {
        const milestone = infantMilestone.milestoneId
        
        // Validate that minMonths and maxMonths exist
        if (!milestone.minMonths && milestone.minMonths !== 0 || !milestone.maxMonths && milestone.maxMonths !== 0) {
          console.warn('Missing minMonths or maxMonths for milestone:', milestone._id, milestone);
        }
        
        // Determine status category based on age and milestone status
        let statusCategory: MilestoneStatus = 'Pending'
        
        // Check if milestone is completed
        if (isMilestoneCompleted(infantMilestone.status as InfantMilestoneStatus)) {
          statusCategory = 'Completed'
        } 
        // Check if milestone is in progress (Emerging or Developing)
        else if (infantMilestone.status === 'Emerging' || infantMilestone.status === 'Developing') {
          statusCategory = 'In Progress'
        }
        // Check if milestone is upcoming (current age is less than min age)
        else if (milestone.minMonths !== undefined && ageInMonths < milestone.minMonths) {
          statusCategory = 'Upcoming'
        }
        // Check if milestone is pending (current age is greater than max age)
        else if (milestone.maxMonths !== undefined && ageInMonths > milestone.maxMonths) {
          statusCategory = 'Pending'
        }
        // For milestones within the age range (minMonths <= age <= maxMonths), keep as Pending (default)
        // This represents milestones that are age-appropriate but not yet completed
        
        return {
          _id: milestone._id,
          name: capitalizeEnglish(milestone.name),
          description: milestone.description,
          category: capitalizeEnglish(milestone.category),
          minMonths: milestone.minMonths !== undefined ? milestone.minMonths : 0,
          maxMonths: milestone.maxMonths !== undefined ? milestone.maxMonths : 0,
          status: statusCategory,
          infantMilestoneStatus: infantMilestone.status
        }
      })
      
      console.log('Processed milestones:', processedMilestones);
      setMilestonesWithStatus(processedMilestones)
      setFilteredMilestones(processedMilestones)
      
      // Set last updated timestamp
      const latestUpdate = new Date(Math.max(
        new Date(selectedInfant.updatedAt).getTime(),
        ...selectedInfant.milestones.map(m => new Date(m.milestoneId.updatedAt).getTime())
      ))
      setLastUpdated(latestUpdate.toLocaleString())
    }
  }, [selectedInfant])

  // Filter milestones by category
  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredMilestones(milestonesWithStatus)
    } else {
      setFilteredMilestones(milestonesWithStatus.filter(m => m.category === selectedCategory))
    }
  }, [selectedCategory, milestonesWithStatus])

  // Calculate summary statistics
  const totalMilestones = filteredMilestones.length
  const completedMilestones = filteredMilestones.filter(m => m.status === 'Completed').length
  const inProgressMilestones = filteredMilestones.filter(m => m.status === 'In Progress').length
  const pendingMilestones = filteredMilestones.filter(m => m.status === 'Pending').length
  const upcomingMilestones = filteredMilestones.filter(m => m.status === 'Upcoming').length
  const completionPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  // Prepare data for charts
  const progressChartData = [
    { name: capitalizeEnglish(t('completed')), value: completedMilestones },
    { name: capitalizeEnglish(t('in_progress')), value: inProgressMilestones },
    { name: capitalizeEnglish(t('pending')), value: pendingMilestones },
    { name: capitalizeEnglish(t('upcoming')), value: upcomingMilestones }
  ]

  const categoryChartData = filteredMilestones.reduce((acc, milestone) => {
    const category = capitalizeEnglish(milestone.category);
    if (!acc[category]) {
      acc[category] = { name: category, completed: 0, inProgress: 0, pending: 0, upcoming: 0 }
    }
    
    if (milestone.status === 'Completed') {
      acc[category].completed += 1
    } else if (milestone.status === 'In Progress') {
      acc[category].inProgress += 1
    } else if (milestone.status === 'Pending') {
      acc[category].pending += 1
    } else if (milestone.status === 'Upcoming') {
      acc[category].upcoming += 1
    }
    
    return acc
  }, {} as Record<string, { name: string; completed: number; inProgress: number; pending: number; upcoming: number }>)

  const categoryChartDataArray = Object.values(categoryChartData)

  // Get recent growth measurements
  const recentGrowthMeasurements = [...growthMeasurements]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Get latest growth data
  const latestGrowth = growthMeasurements.length > 0 
    ? growthMeasurements[growthMeasurements.length - 1] 
    : null

  // Colors for charts with opacity
  const COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B']
  const COLORS_WITH_OPACITY = ['rgba(16, 185, 129, 0.5)', 'rgba(59, 130, 246, 0.5)', 'rgba(239, 68, 68, 0.5)', 'rgba(245, 158, 11, 0.5)']
  const SOLID_COLORS = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B']
  const STATUS_COLORS: Record<MilestoneStatus, string> = {
    'Completed': '#10B981',
    'In Progress': '#3B82F6',
    'Pending': '#EF4444',
    'Upcoming': '#F59E0B'
  }

  // Group milestones by status category
  const completedMilestonesList = filteredMilestones.filter(m => m.status === 'Completed').sort((a, b) => a.minMonths - b.minMonths)
  const inProgressMilestonesList = filteredMilestones.filter(m => m.status === 'In Progress').sort((a, b) => a.minMonths - b.minMonths)
  const pendingMilestonesList = filteredMilestones.filter(m => m.status === 'Pending').sort((a, b) => a.minMonths - b.minMonths)
  const upcomingMilestonesList = filteredMilestones.filter(m => m.status === 'Upcoming').sort((a, b) => a.minMonths - b.minMonths)

  // Get unique categories for filter
  const categories = ['All', ...new Set(milestonesWithStatus.map(m => m.category))]

  // Find not started milestones for alert
  const notStartedMilestones = filteredMilestones.filter(m => 
    m.status === 'Pending' && 
    selectedInfant && 
    m.maxMonths < ((new Date().getFullYear() - new Date(selectedInfant.dateOfBirth).getFullYear()) * 12 + 
    (new Date().getMonth() - new Date(selectedInfant.dateOfBirth).getMonth()))
  )

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium">{t('loading_progress')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-red-50 p-6 border border-red-200 shadow-sm">
              <div className="flex justify-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-12 w-12 text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-red-800">{t('error')}</h3>
                <div className="mt-2 text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-6">
                  <Link href="/dashboard">
                    <Button variant="outline">{t('back_to_dashboard')}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedInfant) {
    return (
      <div className="flex-1 p-4 md:p-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
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
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-full">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('progress_overview')}</h1>
            <p className="text-gray-600">{t('infant_progress_summary')}</p>
          </div>
        </div>

        {/* Progress Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeEnglish(t('total_milestones'))}</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMilestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeEnglish(t('completed'))}</p>
                  <p className="text-2xl font-bold text-gray-900">{completedMilestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeEnglish(t('in_progress'))}</p>
                  <p className="text-2xl font-bold text-gray-900">{inProgressMilestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeEnglish(t('pending'))}</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingMilestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeEnglish(t('upcoming'))}</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingMilestones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
              <CardTitle className="flex items-center text-xl">
                <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                {t('progress_distribution')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={progressChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={false}
                      stroke="#fff"
                      strokeWidth={2}
                      onMouseEnter={(_, index) => {
                        const paths = document.querySelectorAll('.recharts-sector');
                        paths.forEach((path, i) => {
                          if (i === index) {
                            (path as SVGPathElement).style.opacity = '1';
                          } else {
                            (path as SVGPathElement).style.opacity = '0.5';
                          }
                        });
                      }}
                      onMouseLeave={() => {
                        const paths = document.querySelectorAll('.recharts-sector');
                        paths.forEach((path) => {
                          (path as SVGPathElement).style.opacity = '0.5';
                        });
                      }}
                    >
                      {progressChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS_WITH_OPACITY[index % COLORS_WITH_OPACITY.length]} 
                          stroke={SOLID_COLORS[index % SOLID_COLORS.length]} 
                          strokeWidth={2} 
                          style={{ opacity: 0.5, transition: 'opacity 0.3s' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-xl">
              <CardTitle className="flex items-center text-xl">
                <Activity className="h-5 w-5 mr-2 text-indigo-600" />
                {t('category_breakdown')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartDataArray}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 50,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={0} textAnchor="middle" height={30} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="completed" name={capitalizeEnglish(t('completed'))} fill="rgba(16, 185, 129, 0.5)" stroke="#10B981" strokeWidth={2} />
                    <Bar dataKey="inProgress" name={capitalizeEnglish(t('in_progress'))} fill="rgba(59, 130, 246, 0.5)" stroke="#3B82F6" strokeWidth={2} />
                    <Bar dataKey="pending" name={capitalizeEnglish(t('pending'))} fill="rgba(239, 68, 68, 0.5)" stroke="#EF4444" strokeWidth={2} />
                    <Bar dataKey="upcoming" name={capitalizeEnglish(t('upcoming'))} fill="rgba(245, 158, 11, 0.5)" stroke="#F59E0B" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Growth Summary */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
            <CardTitle className="flex items-center text-xl">
              <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
              {t('growth_summary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {latestGrowth ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                  <div className="flex items-center">
                    <div className="rounded-full bg-blue-100 p-2 mr-3">
                      <Ruler className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">{t('height')}</h4>
                  </div>
                  <p className="text-2xl font-bold mt-2">{latestGrowth.height} cm</p>
                  <p className="text-sm text-gray-600 mt-1">{new Date(latestGrowth.date).toLocaleDateString()}</p>
                </div>
                
                <div className="border rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                  <div className="flex items-center">
                    <div className="rounded-full bg-green-100 p-2 mr-3">
                      <Weight className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">{t('weight')}</h4>
                  </div>
                  <p className="text-2xl font-bold mt-2">{latestGrowth.weight} kg</p>
                  <p className="text-sm text-gray-600 mt-1">{new Date(latestGrowth.date).toLocaleDateString()}</p>
                </div>
                
                <div className="border rounded-xl p-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
                  <div className="flex items-center">
                    <div className="rounded-full bg-purple-100 p-2 mr-3">
                      <Activity className="h-5 w-5 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">{t('head_circumference')}</h4>
                  </div>
                  <p className="text-2xl font-bold mt-2">{latestGrowth.headCircumference} cm</p>
                  <p className="text-sm text-gray-600 mt-1">{new Date(latestGrowth.date).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('no_growth_data')}</p>
              </div>
            )}
            
            {recentGrowthMeasurements.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">{t('recent_measurements')}</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('date')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('height')} (cm)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('weight')} (kg)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('head_circumference')} (cm)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentGrowthMeasurements.map((measurement) => (
                        <tr key={measurement._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(measurement.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {measurement.height || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {measurement.weight || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {measurement.headCircumference || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Filter */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-0">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto px-6 py-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                      selectedCategory === category
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {category === 'All' ? t('all') : t(category)}
                    <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {category === 'All' 
                        ? milestonesWithStatus.length 
                        : milestonesWithStatus.filter(m => m.category === category).length}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </CardContent>
        </Card>

        {/* Overall Progress Bar */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900">{t('overall_progress')}</h3>
              <span className="text-lg font-bold text-indigo-600">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-4" />
          </CardContent>
        </Card>

        {/* Alert for Not Started Milestones */}
        {notStartedMilestones.length > 0 && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800">{t('pending_milestones_alert')}</AlertTitle>
            <AlertDescription className="text-red-700">
              {t('pending_milestones_alert_desc', { count: notStartedMilestones.length })}
            </AlertDescription>
          </Alert>
        )}

        {/* Milestones Section - Grouped by Status */}
        <div className="space-y-6">
          {/* Pending Milestones */}
          {pendingMilestonesList.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-red-700">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    {t('pending_milestones')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSection('pending')}
                    className="text-red-700 hover:bg-red-100"
                  >
                    {expandedSections.pending ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.pending && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingMilestonesList.map((milestone) => {
                      const infantMilestone = selectedInfant.milestones.find(m => m.milestoneId._id === milestone._id);
                      return (
                        <Card key={milestone._id} className="border-red-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{milestone.category}</p>
                              </div>
                              <Badge variant="destructive" className="bg-red-100 text-red-800">
                                {t('pending')}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {milestone.minMonths !== undefined ? milestone.minMonths : 0}-{milestone.maxMonths !== undefined ? milestone.maxMonths : 0} {t('months')}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('update_status')}</label>
                              <select
                                value={infantMilestone?.status || 'Not Started'}
                                onChange={(e) => handleStatusChange(milestone._id, e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                aria-label={t('update_milestone_status')}
                              >
                                <option value="Not Started">{t('not_started')}</option>
                                <option value="Emerging">{t('emerging')}</option>
                                <option value="Developing">{t('developing')}</option>
                                <option value="Achieved">{t('achieved')}</option>
                                <option value="Mastered">{t('mastered')}</option>
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* In Progress Milestones */}
          {(inProgressMilestonesList.length > 0) && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-blue-700">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    {t('in_progress_milestones')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSection('inProgress')}
                    className="text-blue-700 hover:bg-blue-100"
                  >
                    {expandedSections.inProgress ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.inProgress && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressMilestonesList.map((milestone) => {
                      const infantMilestone = selectedInfant.milestones.find(m => m.milestoneId._id === milestone._id);
                      return (
                        <Card key={milestone._id} className="border-blue-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{milestone.category}</p>
                              </div>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {milestone.infantMilestoneStatus}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {milestone.minMonths !== undefined ? milestone.minMonths : 0}-{milestone.maxMonths !== undefined ? milestone.maxMonths : 0} {t('months')}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('update_status')}</label>
                              <select
                                value={infantMilestone?.status || 'Not Started'}
                                onChange={(e) => handleStatusChange(milestone._id, e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                aria-label={t('update_milestone_status')}
                              >
                                <option value="Not Started">{t('not_started')}</option>
                                <option value="Emerging">{t('emerging')}</option>
                                <option value="Developing">{t('developing')}</option>
                                <option value="Achieved">{t('achieved')}</option>
                                <option value="Mastered">{t('mastered')}</option>
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Completed Milestones */}
          {completedMilestonesList.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-green-700">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {t('completed_milestones')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSection('completed')}
                    className="text-green-700 hover:bg-green-100"
                  >
                    {expandedSections.completed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.completed && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedMilestonesList.map((milestone) => {
                      const infantMilestone = selectedInfant.milestones.find(m => m.milestoneId._id === milestone._id);
                      return (
                        <Card key={milestone._id} className="border-green-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                                <p className="text-sm text-gray-600 mt-1">{milestone.category}</p>
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {milestone.infantMilestoneStatus}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {milestone.minMonths !== undefined ? milestone.minMonths : 0}-{milestone.maxMonths !== undefined ? milestone.maxMonths : 0} {t('months')}
                              </span>
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">{t('update_status')}</label>
                              <select
                                value={infantMilestone?.status || 'Not Started'}
                                onChange={(e) => handleStatusChange(milestone._id, e.target.value)}
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                aria-label={t('update_milestone_status')}
                              >
                                <option value="Not Started">{t('not_started')}</option>
                                <option value="Emerging">{t('emerging')}</option>
                                <option value="Developing">{t('developing')}</option>
                                <option value="Achieved">{t('achieved')}</option>
                                <option value="Mastered">{t('mastered')}</option>
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Upcoming Milestones */}
          {upcomingMilestonesList.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-xl">
                <CardTitle className="flex items-center justify-between text-yellow-700">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    {t('upcoming_milestones')}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleSection('upcoming')}
                    className="text-yellow-700 hover:bg-yellow-100"
                  >
                    {expandedSections.upcoming ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              {expandedSections.upcoming && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingMilestonesList.map((milestone) => (
                      <Card key={milestone._id} className="border-yellow-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                              <p className="text-sm text-gray-600 mt-1">{milestone.category}</p>
                            </div>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {t('upcoming')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{milestone.description}</p>
                          <div className="mt-3 flex justify-between text-xs text-gray-500">
                            <span>{t('min_age')}: {milestone.minMonths !== undefined ? milestone.minMonths : 0} {t('months')}</span>
                            <span>{t('max_age')}: {milestone.maxMonths !== undefined ? milestone.maxMonths : 0} {t('months')}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mt-8">
          {t('last_updated')}: {lastUpdated}
        </div>
      </div>
    </div>
  )
}