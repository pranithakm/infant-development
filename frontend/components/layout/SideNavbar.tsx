'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { 
  Baby, 
  TrendingUp, 
  Activity, 
  MessageCircle, 
  Sparkles, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Calendar,
  Target,
  Lightbulb,
  Plus,
  CheckCircle,
  ChevronDown,
  Eye,
  Edit,
  Trash2,
  User
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useInfantStore } from '@/store/infantStore'
import { Infant } from '@/types'
import LanguageSelector from '@/components/LanguageSelector'
import { useTranslation } from 'react-i18next'

interface SideNavbarProps {
  infants: Infant[]
  selectedInfantId: string | null
  onSelectInfant: (id: string) => void
}

export default function SideNavbar({ infants, selectedInfantId, onSelectInfant }: SideNavbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [openInfantDropdown, setOpenInfantDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const { t } = useTranslation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-select first infant if none is selected and infants are available
  useEffect(() => {
    if (!selectedInfantId && infants.length > 0) {
      // Check if we're on a route that requires an infant
      const infantRoutes = [
        '/milestones',
        '/progress',
        '/tracker',
        '/activities',
        '/insights',
        '/growth',
        '/calendar'
      ];
      
      const isOnInfantRoute = infantRoutes.some(route => pathname.includes(route));
      
      // Also check if we're on an infant-specific dashboard route
      // Make sure we're not on the main dashboard page
      const isOnInfantDashboard = pathname.startsWith('/dashboard/infants/') && 
                                 !pathname.includes('/new') && 
                                 pathname !== '/dashboard';
      
      if (isOnInfantRoute || isOnInfantDashboard) {
        onSelectInfant(infants[0]._id);
      }
    }
  }, [infants, selectedInfantId, onSelectInfant, pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenInfantDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString())
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('sidebar-collapse-change'))
  }, [isCollapsed])

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

  const handleDeleteInfant = async (infantId: string, infantName: string) => {
    if (window.confirm(t('confirm_delete_infant', { name: infantName }))) {
      try {
        // We need to get the deleteInfant function from the store
        const { deleteInfant } = useInfantStore.getState()
        await deleteInfant(infantId)
        toast.success(t('infant_deleted_successfully', { name: infantName }))
        // If we were viewing this infant, redirect to dashboard
        if (selectedInfantId === infantId) {
          router.push('/dashboard')
        }
      } catch (error) {
        toast.error(t('failed_to_delete_infant'))
      }
    }
    setOpenInfantDropdown(null)
  }

  const handleProfileClick = () => {
    if (infants.length > 0) {
      router.push(`/dashboard/infants/${infants[0]._id}`)
    } else {
      router.push('/dashboard/infants/new')
    }
  }

  const navItems = [
    { name: t('dashboard'), href: '/dashboard', icon: Home },
    { name: t('milestones'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/milestones` : '#', icon: Target, disabled: !selectedInfantId },
    { name: t('progress'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/progress` : '#', icon: TrendingUp, disabled: !selectedInfantId },
    { name: t('tracker'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/tracker` : '#', icon: CheckCircle, disabled: !selectedInfantId },
    { name: t('insights'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/insights` : '#', icon: Lightbulb, disabled: !selectedInfantId },
    { name: t('growth'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/growth` : '#', icon: TrendingUp, disabled: !selectedInfantId },
    { name: t('calendar'), href: selectedInfantId ? `/dashboard/infants/${selectedInfantId}/calendar` : '#', icon: Calendar, disabled: !selectedInfantId },
    { name: t('schemes'), href: '/dashboard/schemes', icon: Sparkles }, // Updated schemes link
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  const handleInfantSelect = (infantId: string) => {
    // If we're on an infant-specific page, navigate to the same page for the new infant
    const infantPageMatch = pathname.match(/\/dashboard\/infants\/[^\/]+\/(.+)/);
    
    if (infantPageMatch && infantPageMatch[1]) {
      // We're on a specific infant page (e.g., /dashboard/infants/[id]/milestones)
      const currentPage = infantPageMatch[1]; // e.g., "milestones"
      router.push(`/dashboard/infants/${infantId}/${currentPage}`);
    } else if (selectedInfantId) {
      // We're on a general infant page, preserve the page context
      // Extract the current page from the pathname
      const currentPageMatch = pathname.match(/\/dashboard\/infants\/[^\/]+\/?$/);
      if (currentPageMatch) {
        // We're on the infant dashboard page
        router.push(`/dashboard/infants/${infantId}`);
      } else {
        // Default to infant dashboard if we can't determine the page
        router.push(`/dashboard/infants/${infantId}`);
      }
    } else {
      // We're not on an infant-specific page, just select the infant
      onSelectInfant(infantId);
    }
  };

  return (
    <>
      {/* Mobile menu button - Always visible on mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileMenu(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar - Slides in when menu button is clicked */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowMobileMenu(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Baby className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FirstSteps</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.disabled ? '#' : item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    onClick={(e) => {
                      if (item.disabled) {
                        e.preventDefault()
                      } else {
                        setShowMobileMenu(false)
                      }
                    }}
                  >
                    <item.icon
                      className={`${
                        isActive(item.href) ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-4 flex-shrink-0 h-6 w-6`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
                {/* Schemes link for mobile */}
                <Link
                  href="/dashboard/schemes"
                  className={`${
                    isActive('/dashboard/schemes')
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Sparkles
                    className={`${
                      isActive('/dashboard/schemes') ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-4 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {t('schemes')}
                </Link>
                {/* Profile link */}
                <button
                  onClick={handleProfileClick}
                  className={`${
                    pathname === `/dashboard/infants/${infants[0]?._id}`
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left`}
                >
                  <User className={`${
                    pathname === `/dashboard/infants/${infants[0]?._id}`
                      ? 'text-primary-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } mr-4 flex-shrink-0 h-6 w-6`} />
                  <span className="capitalize">{t('profile')}</span>
                </button>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
                  <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar - Always visible on desktop */}
      <div className={`${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex md:flex-shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col w-full">
          <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center h-16 px-4 border-b border-gray-200`}>
            {!isCollapsed && (
              <div className="flex items-center">
                <Baby className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">FirstSteps</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-full hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>
          <div className="h-0 flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.disabled ? '#' : item.href}
                  className={`${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${
                    item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault()
                    }
                  }}
                  title={isCollapsed ? item.name : ''}
                >
                  <item.icon
                    className={`${
                      isActive(item.href) ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'
                    } flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              ))}
              
              {/* Profile link */}
              <button
                onClick={handleProfileClick}
                className={`${
                  pathname === `/dashboard/infants/${infants[0]?._id}`
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isCollapsed ? 'justify-center' : ''
                } w-full text-left`}
                title={isCollapsed ? t('profile') : ''}
              >
                <User
                  className={`${
                    pathname === `/dashboard/infants/${infants[0]?._id}`
                      ? 'text-primary-700'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {!isCollapsed && <span className="ml-3 capitalize">{t('profile')}</span>}
              </button>

              {/* Infants section */}
              <div className={`mt-8 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                {!isCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('infants')}
                  </h3>
                )}
                <div className={`mt-1 ${isCollapsed ? 'flex flex-col items-center space-y-2' : 'space-y-1'}`}>
                  {infants.map((infant) => (
                    <div 
                      key={infant._id} 
                      className="relative w-full"
                      ref={openInfantDropdown === infant._id ? dropdownRef : null}
                    >
                      <button
                        onClick={() => handleInfantSelect(infant._id)}
                        className={`${
                          selectedInfantId === infant._id
                            ? 'bg-blue-50 border-blue-600 text-blue-900'
                            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200 ${
                          isCollapsed ? 'justify-center w-12 mx-auto' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center w-full">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-pink-500 text-white text-xs font-bold">
                            {infant.name.charAt(0)}
                          </div>
                          {!isCollapsed && <span className="ml-3">{infant.name}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown 
                            className="h-4 w-4 text-gray-400" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenInfantDropdown(openInfantDropdown === infant._id ? null : infant._id);
                            }}
                          />
                        )}
                      </button>
                      
                      {/* Infant dropdown menu */}
                      {openInfantDropdown === infant._id && !isCollapsed && (
                        <div className="absolute left-full ml-2 top-0 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                router.push(`/dashboard/infants/${infant._id}`);
                                setOpenInfantDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t('view_details')}
                            </button>
                            <button
                              onClick={() => {
                                router.push(`/dashboard/infants/${infant._id}/edit`);
                                setOpenInfantDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {t('edit_profile')}
                            </button>
                            <button
                              onClick={() => handleDeleteInfant(infant._id, infant.name)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                  <Link href="/dashboard/infants/new" className={`${isCollapsed ? 'flex justify-center' : ''}`}>
                    <Button variant="outline" className={`w-full mt-2 ${isCollapsed ? 'w-12 h-12 p-0' : ''}`}>
                      <Plus className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{t('add_infant')}</span>}
                    </Button>
                  </Link>

                </div>
              </div>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
                  <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                  {/* Language selector under the heading */}
                  <div className="mt-2">
                    <LanguageSelector />
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-full hover:bg-gray-100 transition-colors"
                  title={isCollapsed ? t('logout') : ''}
                >
                  <LogOut className="h-5 w-5 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}