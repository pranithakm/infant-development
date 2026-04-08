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
    <div className="min-h-screen bg-gray-50">
      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .button {
          line-height: 1;
          text-decoration: none;
          display: inline-flex;
          border: none;
          cursor: pointer;
          align-items: center;
          gap: 0.75rem;
          background-color: #7808d0;
          color: #fff;
          border-radius: 10rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          padding-left: 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: background-color 0.3s;
        }

        .button__icon-wrapper {
          flex-shrink: 0;
          width: 25px;
          height: 25px;
          position: relative;
          color: #7808d0;
          background-color: #fff;
          border-radius: 50%;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .button:hover {
          background-color: #5a069d;
        }

        .button:hover .button__icon-wrapper {
          color: #5a069d;
        }

        .button__icon-svg--copy {
          position: absolute;
          transform: translate(-150%, 150%);
        }

        .button:hover .button__icon-svg:first-child {
          transition: transform 0.3s ease-in-out;
          transform: translate(150%, -150%);
        }

        .button:hover .button__icon-svg--copy {
          transition: transform 0.3s ease-in-out 0.1s;
          transform: translate(0);
        }
      `}</style>
      
      <main className="flex-1">
        {/* Modern Hero Section with Background Image */}
        <div className="relative h-screen flex items-center">
          {/* Background image with overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1840315/pexels-photo-1840315.jpeg')" }}
          ></div>
          
          {/* Black overlay with reduced opacity for text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          
          {/* Content container - Centered */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full z-10">
            <div className="max-w-2xl mx-auto text-center">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-white mb-6 leading-tight">
                  Smart Care for Your Baby's First 1000 Days
                </p>
                <p className="text-base md:text-lg text-gray-200 mb-8 leading-relaxed">
                  A calm, intuitive tracker designed to support healthy routines, milestones, and growth — every step supported by science.
                </p>
                <Link href="/dashboard/infants/new">
                  <button className="button">
                    <span className="button__icon-wrapper">
                      <svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="button__icon-svg" width={10}>
                        <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                      </svg>
                      <svg viewBox="0 0 14 15" fill="none" width={10} xmlns="http://www.w3.org/2000/svg" className="button__icon-svg button__icon-svg--copy">
                        <path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor" />
                      </svg>
                    </span>
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        </div>

        {/* Infants Section */}
        {infants.length > 0 ? (
          <div className="mb-8 px-4 sm:px-6 lg:px-8">
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
          <div className="mb-8 px-4 sm:px-6 lg:px-8">
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