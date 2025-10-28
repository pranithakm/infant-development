'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import SideNavbar from '@/components/layout/SideNavbar'
import { useInfantStore } from '@/store/infantStore'
import { Infant } from '@/types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [selectedInfantId, setSelectedInfantId] = useState<string | null>(null)
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

  // Fetch infants data
  useEffect(() => {
    fetchInfants()
  }, [fetchInfants])

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
      <div className="flex-1 md:ml-64 ml-0 sm:ml-64">
        {children}
      </div>
    </div>
  )
}