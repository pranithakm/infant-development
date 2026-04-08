'use client'

import { useState, useEffect } from 'react'
import { useInfantStore } from '@/store/infantStore'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, CheckCircle, Circle, AlertCircle, RefreshCw, BarChart3, Calendar, TrendingUp } from 'lucide-react'
import { routinesAPI } from '@/lib/api'
// Add Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function TrackerPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant, updateRoutineStatus } = useInfantStore()
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [routines, setRoutines] = useState<any[]>([])
  const [routinesLoading, setRoutinesLoading] = useState(false)
  const [routinesError, setRoutinesError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  // Add state for date completion data
  const [dateCompletionData, setDateCompletionData] = useState<Record<string, { completed: number; total: number; percentage: number }>>({})
  // Add state for date completion loading
  const [dateCompletionLoading, setDateCompletionLoading] = useState(false)
  // Add state for view mode (week/month)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  // Add state for monthly data
  const [monthlyCompletionData, setMonthlyCompletionData] = useState<Record<string, { completed: number; total: number; percentage: number }>>({})

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
    }
  }, [params.id, fetchInfant])

  // Generate dates for the current week
  const generateWeekDates = () => {
    const dates = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + (currentWeekOffset * 7))
    
    // Find Sunday of the week
    const day = startDate.getDay()
    const sunday = new Date(startDate)
    sunday.setDate(startDate.getDate() - day)
    
    // Generate 7 days from Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday)
      date.setDate(sunday.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  // Generate dates for the current month
  const generateMonthDates = () => {
    if (!selectedInfant) return []
    
    const dates = []
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset, 1)
    
    // Get first day of month and last day of month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
    
    // Get the first day of the week for the calendar display
    const startDay = new Date(firstDay)
    startDay.setDate(firstDay.getDate() - firstDay.getDay())
    
    // Get the last day of the week for the calendar display
    const endDay = new Date(lastDay)
    endDay.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
    
    // Generate all dates for the month view
    const currentDate = new Date(startDay)
    while (currentDate <= endDay) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  const weekDates = generateWeekDates()
  const monthDates = generateMonthDates()

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Check if date is in the past
  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < today
  }

  // Check if date is before infant's date of birth
  const isBeforeInfantDOB = (date: Date) => {
    if (!selectedInfant) return false
    const dob = new Date(selectedInfant.dateOfBirth)
    dob.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate < dob
  }

  // Check if date is in the current month
  const isInCurrentMonth = (date: Date) => {
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset, 1)
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Only allow selection of today and past dates, and dates after infant's DOB
    if ((isToday(date) || isPastDate(date)) && !isBeforeInfantDOB(date)) {
      setSelectedDate(date)
    }
  }

  // Toggle routine status
  const toggleRoutineStatus = async (routineId: string, currentStatus: boolean) => {
    try {
      const dateStr = formatDate(selectedDate)
      const result = await updateRoutineStatus(params.id, dateStr, routineId, !currentStatus)
      
      if (result) {
        // Refresh the routines to get updated completion summary and routine statuses
        fetchRoutinesForDate();
      }
    } catch (error: any) {
      setRoutinesError(t('failed_to_update_routine') || 'Failed to update routine status')
      // Auto-clear error after 5 seconds
      setTimeout(() => setRoutinesError(null), 5000)
    }
  }

  // Navigate weeks/months
  const goToPreviousPeriod = () => {
    setCurrentWeekOffset(prev => prev - 1)
  }

  const goToNextPeriod = () => {
    setCurrentWeekOffset(prev => prev + 1)
  }

  // Retry fetching routines
  const retryFetchRoutines = () => {
    setRetryCount(prev => prev + 1)
    fetchRoutinesForDate()
  }

  // Fetch routines for selected date
  const fetchRoutinesForDate = async () => {
    if (params.id !== 'new' && selectedInfant) {
      setRoutinesLoading(true)
      setRoutinesError(null)
      try {
        const dateStr = formatDate(selectedDate)
        const response = await routinesAPI.getInfantRoutinesForDate(params.id, dateStr)
        setRoutines(response.data.data)
        // Store the summary data for completion percentage calculation
        if (response.data.summary) {
          setCompletionSummary(response.data.summary)
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || t('failed_to_load_routines') || 'Failed to load routines'
        setRoutinesError(errorMessage)
        
        // Show fallback for non-404 errors
        if (error.response?.status !== 404) {
          const defaultRoutines = [
            {
              _id: '1',
              name: t('morning_feed') || 'Morning Feed',
              description: t('first_feed_of_the_day') || 'First feed of the day',
              category: 'feeding',
              completed: false
            },
            {
              _id: '2',
              name: t('afternoon_feed') || 'Afternoon Feed',
              description: t('midday_feeding_session') || 'Midday feeding session',
              category: 'feeding',
              completed: false
            },
            {
              _id: '3',
              name: t('evening_feed') || 'Evening Feed',
              description: t('evening_feeding_session') || 'Evening feeding session',
              category: 'feeding',
              completed: false
            },
            {
              _id: '4',
              name: t('bath_time') || 'Bath Time',
              description: t('daily_hygiene_routine') || 'Daily hygiene routine',
              category: 'hygiene',
              completed: false
            },
            {
              _id: '5',
              name: t('tummy_time') || 'Tummy Time',
              description: t('tummy_time_exercise') || 'Tummy time exercise for development',
              category: 'development',
              completed: false
            }
          ]
          setRoutines(defaultRoutines)
        }
      } finally {
        setRoutinesLoading(false)
      }
    }
  }

  // Fetch completion data for all dates in the current week
  const fetchDateCompletionData = async () => {
    if (params.id !== 'new' && selectedInfant) {
      setDateCompletionLoading(true)
      const newData: Record<string, { completed: number; total: number; percentage: number }> = {}
      
      // Fetch data for each date in the week
      for (const date of weekDates) {
        // Only fetch data for past dates and today, and dates after infant's DOB
        if ((isToday(date) || isPastDate(date)) && !isBeforeInfantDOB(date)) {
          try {
            const dateStr = formatDate(date)
            const response = await routinesAPI.getInfantRoutinesForDate(params.id, dateStr)
            if (response.data.summary) {
              newData[dateStr] = {
                completed: response.data.summary.completedRoutines,
                total: response.data.summary.totalRoutines,
                percentage: response.data.summary.completionPercentage
              }
            }
          } catch (error) {
            // Set default values for error cases
            newData[formatDate(date)] = {
              completed: 0,
              total: 0,
              percentage: 0
            }
          }
        }
      }
      
      setDateCompletionData(newData)
      setDateCompletionLoading(false)
    }
  }

  // Fetch completion data for all dates in the current month
  const fetchMonthlyCompletionData = async () => {
    if (params.id !== 'new' && selectedInfant && viewMode === 'month') {
      setDateCompletionLoading(true)
      const newData: Record<string, { completed: number; total: number; percentage: number }> = {}
      
      // Fetch data for each date in the month
      for (const date of monthDates) {
        // Only fetch data for dates in the current month, past dates and today, and dates after infant's DOB
        if (isInCurrentMonth(date) && (isToday(date) || isPastDate(date)) && !isBeforeInfantDOB(date)) {
          try {
            const dateStr = formatDate(date)
            const response = await routinesAPI.getInfantRoutinesForDate(params.id, dateStr)
            if (response.data.summary) {
              newData[dateStr] = {
                completed: response.data.summary.completedRoutines,
                total: response.data.summary.totalRoutines,
                percentage: response.data.summary.completionPercentage
              }
            }
          } catch (error) {
            // Set default values for error cases
            newData[formatDate(date)] = {
              completed: 0,
              total: 0,
              percentage: 0
            }
          }
        }
      }
      
      setMonthlyCompletionData(newData)
      setDateCompletionLoading(false)
    }
  }

  // Add state for completion summary
  const [completionSummary, setCompletionSummary] = useState({
    totalRoutines: 0,
    completedRoutines: 0,
    completionPercentage: 0
  })

  // Fetch date completion data when week/month changes
  useEffect(() => {
    if (viewMode === 'week') {
      fetchDateCompletionData()
    } else {
      fetchMonthlyCompletionData()
    }
  }, [selectedInfant, params.id, currentWeekOffset, viewMode])

  // Fetch routines when date or infant changes
  useEffect(() => {
    fetchRoutinesForDate()
  }, [selectedDate, selectedInfant, params.id, retryCount])

  // Calculate completion percentage
  const completionPercentage = completionSummary.completionPercentage

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      feeding: 'bg-amber-50 text-amber-700 border border-amber-200',
      sleep: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      hygiene: 'bg-blue-50 text-blue-700 border border-blue-200',
      play: 'bg-green-50 text-green-700 border border-green-200',
      health: 'bg-red-50 text-red-700 border border-red-200',
      development: 'bg-purple-50 text-purple-700 border border-purple-200',
      other: 'bg-gray-50 text-gray-700 border border-gray-200'
    }
    return colors[category] || colors.other
  }

  // Prepare chart data for weekly view
  const weeklyChartData = {
    labels: weekDates.map(date => date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })),
    datasets: [
      {
        label: t('completion_percentage') || 'Completion %',
        data: weekDates.map(date => {
          const dateStr = formatDate(date)
          return dateCompletionData[dateStr]?.percentage || 0
        }),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(79, 70, 229)',
        pointHoverBorderColor: '#fff',
      }
    ]
  }

  // Prepare chart data for monthly view
  const monthlyChartData = {
    labels: [...new Set(monthDates
      .filter(date => isInCurrentMonth(date))
      .map(date => date.toLocaleDateString(undefined, { day: 'numeric' })))],
    datasets: [
      {
        label: t('completion_percentage') || 'Completion %',
        data: monthDates
          .filter(date => isInCurrentMonth(date))
          .map(date => {
            const dateStr = formatDate(date)
            return monthlyCompletionData[dateStr]?.percentage || 0
          }),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(79, 70, 229)',
        pointHoverBorderColor: '#fff',
      }
    ]
  }

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y}% ${t('completed')}`
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%'
          },
          color: '#6b7280'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  }

  if (loading && !selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-lg font-medium capitalize">{t('loading_tracker')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-red-50 p-6 border border-red-200 shadow-sm">
              <div className="flex justify-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-12 w-12 text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-red-800 capitalize">{t('error')}</h3>
                <div className="mt-2 text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => fetchInfant(params.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                    {t('retry')}
                  </button>
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
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-medium text-gray-900 capitalize">{t('infant_not_found')}</h3>
              <p className="mt-2 text-gray-600 capitalize">{t('infant_not_found_desc')}</p>
              <div className="mt-6">
                <a
                  href="/dashboard/infants"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('back_to_infants')}
                </a>
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 capitalize">{t('routine_tracker')}</h1>
        
        {/* Combined Container with Unified Background */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg overflow-hidden border border-indigo-100">
          {/* Header Section with Progress Summary */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-indigo-800">{t('daily_routines')}</h2>
                <p className="text-indigo-600 mt-1">{t('track_your_daily_routine_progress')}</p>
              </div>
              <div className={`rounded-xl px-4 py-3 shadow-sm border ${
                completionPercentage === 100 
                  ? 'bg-green-50 border-green-200' 
                  : completionPercentage >= 50 
                    ? 'bg-blue-50 border-blue-200' 
                    : completionPercentage > 0 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl font-bold ${
                    completionPercentage === 100 
                      ? 'text-green-700' 
                      : completionPercentage >= 50 
                        ? 'text-blue-700' 
                        : completionPercentage > 0 
                          ? 'text-yellow-700' 
                          : 'text-gray-700'
                  }`}>
                    {completionPercentage}%
                  </div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">{t('completed_today')}</div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-700 ease-out ${
                    completionPercentage === 100 
                      ? 'bg-green-400' 
                      : completionPercentage >= 50 
                        ? 'bg-blue-400' 
                        : completionPercentage > 0 
                          ? 'bg-yellow-400' 
                          : 'bg-gray-400'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm font-medium">
                <span className={
                  completionPercentage === 100 
                    ? 'text-green-600' 
                    : completionPercentage >= 50 
                      ? 'text-blue-600' 
                      : completionPercentage > 0 
                        ? 'text-yellow-600' 
                        : 'text-gray-500'
                }>
                  {completionPercentage}% {t('completed')}
                </span>
                <span className="text-gray-500">
                  {completionSummary.completedRoutines}/{completionSummary.totalRoutines} {t('tasks')}
                </span>
              </div>
            </div>
          </div>
          
          {/* View Toggle and Chart */}
          <div className="bg-white/90 backdrop-blur-sm p-6">
            {/* View Toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                    viewMode === 'week'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setViewMode('week')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('week')}
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                    viewMode === 'month'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setViewMode('month')}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t('month')}
                </button>
              </div>
            </div>
            
            {/* Chart */}
            <div className="h-64 mb-6">
              {viewMode === 'week' ? (
                <Line data={weeklyChartData} options={chartOptions} />
              ) : (
                <Line data={monthlyChartData} options={chartOptions} />
              )}
            </div>
            
            {/* Date Selector Section with Improved Styling */}
            <div className="rounded-b-2xl">
              {/* Month and Year Header */}
              <div className="text-center mb-6">
                <h3 className="text-lg md:text-xl font-bold text-gray-800">
                  {viewMode === 'week' 
                    ? (() => {
                        const today = new Date()
                        const currentMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset, 1)
                        return currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                      })()
                    : (() => {
                        const today = new Date()
                        const currentMonth = new Date(today.getFullYear(), today.getMonth() + currentWeekOffset, 1)
                        return currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                      })()}
                </h3>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={goToPreviousPeriod}
                  className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors duration-200"
                  aria-label={viewMode === 'week' ? t('previous_week') : t('previous_month')}
                >
                  <ChevronLeft className="h-6 w-6 text-indigo-700" />
                </button>
                
                {dateCompletionLoading ? (
                  <div className={`grid ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'} gap-1 md:gap-2 w-full`}>
                    {Array.from({ length: viewMode === 'week' ? 7 : 35 }).map((_, index) => (
                      <div 
                        key={index}
                        className="flex flex-col items-center justify-center p-2 md:p-3 rounded-lg bg-gray-100 animate-pulse"
                      >
                        <div className="h-3 w-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                        <div className="h-3 w-6 bg-gray-200 rounded mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : viewMode === 'week' ? (
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {weekDates.map((date) => {
                      const isSelected = date.toDateString() === selectedDate.toDateString()
                      const isCurrentDay = isToday(date)
                      const isEditable = (isCurrentDay || isPastDate(date)) && !isBeforeInfantDOB(date)
                      const dateStr = formatDate(date)
                      const completionData = dateCompletionData[dateStr]
                      
                      // Determine background color based on completion percentage
                      let bgColor = 'bg-white'
                      let textColor = 'text-gray-800'
                      let borderColor = 'border-gray-200'
                      let shadow = 'shadow-sm'
                      
                      if (isSelected) {
                        bgColor = 'bg-indigo-50'
                        textColor = 'text-indigo-700'
                        borderColor = 'border-indigo-300'
                        shadow = 'shadow-md'
                      } else if (!isEditable) {
                        // Future dates or dates before DOB
                        bgColor = 'bg-gray-100'
                        textColor = 'text-gray-500'
                        borderColor = 'border-gray-300'
                      } else if (completionData) {
                        // Past dates with completion data
                        if (completionData.percentage === 100) {
                          bgColor = 'bg-green-50'
                          textColor = 'text-green-700'
                          borderColor = 'border-green-200'
                        } else if (completionData.percentage >= 50) {
                          bgColor = 'bg-blue-50'
                          textColor = 'text-blue-700'
                          borderColor = 'border-blue-200'
                        } else if (completionData.percentage > 0) {
                          bgColor = 'bg-yellow-50'
                          textColor = 'text-yellow-700'
                          borderColor = 'border-yellow-200'
                        } else {
                          bgColor = 'bg-gray-50'
                          textColor = 'text-gray-600'
                          borderColor = 'border-gray-200'
                        }
                      }
                      
                      return (
                        <div 
                          key={date.toString()}
                          onClick={() => isEditable ? handleDateSelect(date) : null}
                          className={`
                            flex flex-col items-center justify-center p-2 md:p-3 rounded-full cursor-pointer transition-all duration-200
                            ${bgColor} ${textColor} border ${borderColor} ${shadow}
                            ${isSelected ? 'ring-2 ring-indigo-400 scale-105' : 'hover:shadow-md'}
                            ${!isEditable ? 'cursor-not-allowed opacity-60' : ''}
                          `}
                        >
                          <div className="text-xs md:text-sm font-medium">
                            {date.toLocaleDateString(undefined, { weekday: 'short' })}
                          </div>
                          <div className={`
                            text-base md:text-lg font-bold mt-1
                            ${isSelected ? 'text-indigo-700' : textColor}
                          `}>
                            {date.getDate()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Month view
                  <div className="w-full">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {monthDates.map((date) => {
                        const isSelected = date.toDateString() === selectedDate.toDateString()
                        const isCurrentDay = isToday(date)
                        const isEditable = isInCurrentMonth(date) && (isCurrentDay || isPastDate(date)) && !isBeforeInfantDOB(date)
                        const dateStr = formatDate(date)
                        const completionData = monthlyCompletionData[dateStr]
                        
                        // Determine background color based on completion percentage
                        let bgColor = 'bg-white'
                        let textColor = 'text-gray-800'
                        let borderColor = 'border-gray-200'
                        let shadow = 'shadow-sm'
                        
                        if (!isInCurrentMonth(date)) {
                          // Dates not in current month
                          bgColor = 'bg-gray-50'
                          textColor = 'text-gray-400'
                          borderColor = 'border-gray-100'
                        } else if (isSelected) {
                          bgColor = 'bg-indigo-50'
                          textColor = 'text-indigo-700'
                          borderColor = 'border-indigo-300'
                          shadow = 'shadow-md'
                        } else if (!isEditable) {
                          // Future dates or dates before DOB
                          bgColor = 'bg-gray-100'
                          textColor = 'text-gray-500'
                          borderColor = 'border-gray-300'
                        } else if (completionData) {
                          // Past dates with completion data
                          if (completionData.percentage === 100) {
                            bgColor = 'bg-green-50'
                            textColor = 'text-green-700'
                            borderColor = 'border-green-200'
                          } else if (completionData.percentage >= 50) {
                            bgColor = 'bg-blue-50'
                            textColor = 'text-blue-700'
                            borderColor = 'border-blue-200'
                          } else if (completionData.percentage > 0) {
                            bgColor = 'bg-yellow-50'
                            textColor = 'text-yellow-700'
                            borderColor = 'border-yellow-200'
                          } else {
                            bgColor = 'bg-gray-50'
                            textColor = 'text-gray-600'
                            borderColor = 'border-gray-200'
                          }
                        }
                        
                        return (
                          <div 
                            key={date.toString()}
                            onClick={() => isEditable && isInCurrentMonth(date) ? handleDateSelect(date) : null}
                            className={`
                              flex flex-col items-center justify-center p-2 rounded-full cursor-pointer transition-all duration-200 h-12
                              ${bgColor} ${textColor} border ${borderColor} ${shadow}
                              ${isSelected ? 'ring-2 ring-indigo-400 scale-105' : 'hover:shadow-md'}
                              ${!isEditable || !isInCurrentMonth(date) ? 'cursor-not-allowed opacity-60' : ''}
                            `}
                          >
                            <div className={`text-sm font-medium ${!isInCurrentMonth(date) ? 'text-gray-400' : textColor}`}>
                              {date.getDate()}
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={goToNextPeriod}
                  className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 transition-colors duration-200"
                  aria-label={viewMode === 'week' ? t('next_week') : t('next_month')}
                >
                  <ChevronRight className="h-6 w-6 text-indigo-700" />
                </button>
              </div>
              
              {/* Selected Date Info */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {isToday(selectedDate) ? t('today') : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Routine Checklist Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t('daily_routines')}</h2>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                {completionSummary.completedRoutines}/{completionSummary.totalRoutines} {t('completed')}
              </div>
              <button 
                onClick={retryFetchRoutines}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                aria-label={t('refresh')}
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Error Message */}
          {routinesError && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{routinesError}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={retryFetchRoutines}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <RefreshCw className="-ml-1 mr-1 h-4 w-4" />
                      {t('retry')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {routinesLoading ? (
            <div className="flex flex-col items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">{t('loading_routines')}</p>
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">{t('no_routines_found')}</h3>
              <p className="mt-2 text-gray-500">{t('no_routines_for_date')}</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={retryFetchRoutines}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
                  {t('retry')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {routines.map((routine) => (
                <div 
                  key={routine._id} 
                  className={`flex items-center justify-between p-4 border rounded-xl transition-all duration-200 ${
                    routine.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="mr-4">
                      {routine.completed ? (
                        <CheckCircle 
                          className="h-8 w-8 text-green-500 cursor-pointer hover:text-green-600 transition-colors transform hover:scale-110" 
                          onClick={() => toggleRoutineStatus(routine._id, routine.completed)}
                        />
                      ) : (
                        <Circle 
                          className="h-8 w-8 text-gray-400 cursor-pointer hover:text-gray-500 transition-colors transform hover:scale-110" 
                          onClick={() => toggleRoutineStatus(routine._id, routine.completed)}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${routine.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                          {routine.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(routine.category)}`}>
                          {t(routine.category) || routine.category}
                        </span>
                      </div>
                      {routine.description && (
                        <p className={`text-sm mt-1 ${routine.completed ? 'text-green-600' : 'text-gray-500'}`}>
                          {routine.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                    routine.completed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {routine.completed ? t('completed') : t('pending')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}