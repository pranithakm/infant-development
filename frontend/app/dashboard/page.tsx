'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Baby, Plus, LogOut, Settings, User, Calendar, Ruler, Weight, TrendingUp, Target, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useInfantStore } from '@/store/infantStore'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Infant } from '@/types'
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const { infants, loading, error, fetchInfants } = useInfantStore()
  const router = useRouter()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    fetchInfants()
  }, [fetchInfants])

  const handleLogout = () => {
    try {
      // Clear any tokens or auth data from localStorage/sessionStorage
      localStorage.removeItem('authToken')
      sessionStorage.clear()

      // Clear Zustand store
      logout()

      // Optional flag for redirect handling
      localStorage.setItem('logout-redirect', 'true')

      toast.success(t('logged_out_successfully'))

      // Redirect to login/homepage
      router.replace('/') // use replace so back button doesn't return to dashboard
    } catch (error) {
      console.error("Logout error:", error)
      toast.error(t('failed_to_logout'))
    }
  }

  // Close profile menu when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (showProfileMenu) {
      setShowProfileMenu(false)
    }
  }

  // Calculate overall progress
  const calculateProgress = (infant: Infant) => {
    if (!infant.milestones || infant.milestones.length === 0) return 0
    const achievedMilestones = infant.milestones.filter(
      m => m.status === 'Achieved' || m.status === 'Mastered'
    ).length
    return Math.round((achievedMilestones / infant.milestones.length) * 100)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-pink-500 p-2 rounded-xl">
                <Baby className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('welcome_back', { name: user?.name })}</h1>
                <p className="text-gray-600">{t('dashboard_description')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/infants/new">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add_infant')}
                </Button>
              </Link>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <Button 
                  variant="ghost"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden md:inline font-medium">{user?.name}</span>
                </Button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                        {user?.email}
                      </div>
                      <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 rounded-lg">
                        <Settings className="h-4 w-4" />
                        <span>{t('settings')}</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 rounded-lg"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section with Background Image */}
        <div className="mb-8 rounded-2xl overflow-hidden">
          <div 
            className="relative bg-cover bg-center rounded-2xl h-80 md:h-96"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1557182/pexels-photo-1557182.jpeg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30 rounded-2xl"></div>
            <div className="relative z-10 h-full flex flex-col justify-center items-start p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 max-w-2xl">
                {t('welcome_to_firststeps')} 
                <span className="ml-2 text-yellow-300">🎉</span>
              </h2>
              <p className="text-white/90 mb-6 text-lg max-w-2xl">
                {t('dashboard_welcome_description')}
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/infants/new">
                  <Button className="btn-primary" size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('get_started')}
                  </Button>
                </Link>
                <Link href="/dashboard/insights">
                  <Button variant="outline" size="lg" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {t('ai_insights')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-xl transition-all duration-300 border-0 glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('total_infants')}</CardTitle>
              <Baby className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{infants.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {infants.length === 0 ? t('no_infants_added') : t('tracking_infants')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('milestones_tracked')}</CardTitle>
              <Target className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {infants.reduce((total, infant) => total + (infant.milestones?.length || 0), 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('developmental_milestones')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('progress_rate')}</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {infants.length > 0 
                  ? Math.round(infants.reduce((total, infant) => total + calculateProgress(infant), 0) / infants.length) 
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('average_development_progress')}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-all duration-300 border-0 glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('ai_insights')}</CardTitle>
              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">AI</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('add_infant_for_insights')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Infants Section */}
        {infants.length > 0 ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Baby className="h-6 w-6 mr-2 text-blue-500" />
                {t('your_infants')}
              </h2>
              <Link href="/infants/new">
                <Button variant="outline" className="border-2">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('add_another_infant')}
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {infants.map((infant) => (
                <Card key={infant._id} className="hover:shadow-xl transition-all duration-300 border-0 glass overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{infant.name}</h3>
                        <div className="flex items-center mt-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>
                            {formatDate(infant.dateOfBirth)}
                            {infant.ageInMonths !== undefined && ` • ${infant.ageInMonths} ${t('months')}`}
                          </span>
                        </div>
                        {infant.birthWeight && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Weight className="h-4 w-4 mr-1" />
                            <span>{infant.birthWeight} {t('kg')}</span>
                          </div>
                        )}
                        {infant.birthLength && (
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <Ruler className="h-4 w-4 mr-1" />
                            <span>{infant.birthLength} {t('cm')}</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-blue-200 to-pink-200 border-2 border-dashed border-white rounded-xl w-16 h-16 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-700">{infant.name.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{t('progress')}</span>
                        <span className="font-medium text-gray-900">{calculateProgress(infant)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out" 
                          style={{ width: `${calculateProgress(infant)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Link href={`/infants/${infant._id}`} className="flex-1">
                        <Button variant="outline" className="w-full border-2">
                          {t('view_details')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8">
            <Card className="glass border-0">
              <CardContent className="p-8 text-center">
                <div className="bg-gradient-to-r from-blue-100 to-pink-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Baby className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('no_infants_added')}</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {t('get_started_add_infant')}
                </p>
                <Link href="/infants/new">
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('add_first_infant')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Section */}
        <div className="space-y-8 mb-12">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
                {t('development_tracking_features')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <Target className="h-5 w-5 text-blue-500 mr-2" />
                    <h3 className="font-bold text-gray-900">{t('milestone_tracking')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('milestone_tracking_desc')}</p>
                </div>
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="font-bold text-gray-900">{t('progress_monitoring')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('progress_monitoring_desc')}</p>
                </div>
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs text-white font-bold">AI</span>
                    </div>
                    <h3 className="font-bold text-gray-900">{t('ai_recommendations')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('ai_recommendations_desc')}</p>
                </div>
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <Ruler className="h-5 w-5 text-purple-500 mr-2" />
                    <h3 className="font-bold text-gray-900">{t('growth_charts')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('growth_charts_desc')}</p>
                </div>
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <Calendar className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="font-bold text-gray-900">{t('activity_tracking')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('activity_tracking_desc')}</p>
                </div>
                <div className="p-5 border rounded-xl bg-white/50 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    <h3 className="font-bold text-gray-900">{t('expert_insights')}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{t('expert_insights_desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-pink-500 p-2 rounded-xl">
                  <Baby className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">FirstSteps</span>
              </div>
              <p className="text-gray-600 max-w-md">
                {t('footer_description')}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quick_links')}</h3>
              <ul className="space-y-2">
                <li><Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">{t('dashboard')}</Link></li>
                <li><Link href="/infants/new" className="text-gray-600 hover:text-blue-600 transition-colors">{t('add_infant')}</Link></li>
                <li><Link href="/dashboard/insights" className="text-gray-600 hover:text-blue-600 transition-colors">{t('ai_insights')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('support')}</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">{t('help_center')}</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">{t('contact_us')}</Link></li>
                <li><Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors">{t('privacy_policy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>{t('copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}