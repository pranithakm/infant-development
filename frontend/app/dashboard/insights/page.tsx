'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useInfantStore } from '@/store/infantStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Baby, Lightbulb, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

export default function InsightsSelectionPage() {
  const { infants, loading, fetchInfants } = useInfantStore()
  const router = useRouter()
  const { t } = useTranslation()

  useEffect(() => {
    fetchInfants()
  }, [fetchInfants])

  useEffect(() => {
    if (!loading && infants.length === 1) {
      router.replace(`/dashboard/infants/${infants[0]._id}/insights`)
    }
  }, [loading, infants, router])

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (infants.length === 0) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-blue-100 p-4 rounded-full mb-6">
          <Baby className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('no_infants_added')}</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          {t('add_infant_for_insights')}
        </p>
        <Link href="/dashboard/infants/new">
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('add_first_infant')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-yellow-100 p-3 rounded-xl">
            <Lightbulb className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('ai_insights')}</h1>
            <p className="text-gray-600">{t('select_infant_selection_desc', { defaultValue: 'Select an infant to view their personalized developmental insights.' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {infants.map((infant) => (
            <Link key={infant._id} href={`/dashboard/infants/${infant._id}/insights`}>
              <Card className="hover:shadow-lg transition-all duration-300 border-0 glass hover:scale-105 group">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {infant.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{infant.name}</h3>
                      <p className="text-sm text-gray-500">{infant.ageInMonths} {t('months')}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
