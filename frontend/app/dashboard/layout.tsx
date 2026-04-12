'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import SideNavbar from '@/components/layout/SideNavbar'
import { useInfantStore } from '@/store/infantStore'
import { Infant } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedInfantId, setSelectedInfantId] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const { infants, fetchInfants } = useInfantStore()
  
  // Extract infantId from pathname if present
  useEffect(() => {
    // Check if we're on a route that includes an infant ID
    // but exclude the "new" route which is not an infant ID
    const match = pathname.match(/\/dashboard\/infants\/([^\/]+)/)
    if (match && match[1] && match[1] !== 'new') {
      setSelectedInfantId(match[1])
    } else {
      setSelectedInfantId(null)
    }
  }, [pathname])

  // Auto-select first infant on dashboard load if none selected
  useEffect(() => {
    if (infants.length > 0 && !selectedInfantId) {
      // Check if we're on the main dashboard page
      if (pathname === '/dashboard') {
        // Don't automatically redirect to the first infant's dashboard
        // Just select the first infant without navigation
        setSelectedInfantId(infants[0]._id)
      }
      // If we're on an infant-specific route but no infant is selected, 
      // auto-select the first one
      else if (pathname.startsWith('/dashboard/infants/') && !pathname.includes('/new')) {
        setSelectedInfantId(infants[0]._id)
      }
    }
  }, [infants, selectedInfantId, pathname, router])

  // Fetch infants data
  useEffect(() => {
    fetchInfants()
  }, [fetchInfants])

  // Handle sidebar collapse state
  useEffect(() => {
    const handleSidebarCollapseChange = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true'
      setIsSidebarCollapsed(collapsed)
    }

    // Check initial state
    handleSidebarCollapseChange()
    
    // Listen for changes
    window.addEventListener('sidebar-collapse-change', handleSidebarCollapseChange)
    
    return () => {
      window.removeEventListener('sidebar-collapse-change', handleSidebarCollapseChange)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Fixed sidebar */}
      <div className="fixed h-screen overflow-y-auto z-10">
        <SideNavbar 
          infants={infants as Infant[]}
          selectedInfantId={selectedInfantId}
          onSelectInfant={setSelectedInfantId}
        />
      </div>
      {/* Main content area with left margin to accommodate fixed sidebar */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} ml-0 sm:ml-0`}>
        {children}
      </div>
    </div>
  )
}