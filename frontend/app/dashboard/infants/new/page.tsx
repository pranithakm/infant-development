'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Baby, Calendar, Ruler, Weight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function NewInfantPage() {
  const router = useRouter()
  const { createInfant, loading, error } = useInfantStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      name: '',
      dateOfBirth: '',
      gender: '',
      birthWeight: '',
      birthLength: '',
      birthHeadCircumference: '',
      'medicalInfo.bloodType': '',
      'medicalInfo.allergies': '',
      'medicalInfo.medications': '',
      'medicalInfo.conditions': '',
      'medicalInfo.pediatrician.name': '',
      'medicalInfo.pediatrician.contact': ''
    }
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Convert numeric fields
      const infantData = {
        ...data,
        birthWeight: data.birthWeight ? parseFloat(data.birthWeight) : undefined,
        birthLength: data.birthLength ? parseFloat(data.birthLength) : undefined,
        birthHeadCircumference: data.birthHeadCircumference ? parseFloat(data.birthHeadCircumference) : undefined
      }
      
      const result = await createInfant(infantData)
      
      if (result) {
        toast.success(t('infant_added_successfully'))
        router.push(`/infants/${result._id}`)
      }
    } catch (err) {
      toast.error(t('failed_to_add_infant'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Remove the back link since we have the sidebar navigation */}
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-6">{t('add_infant_title')}</h1>
        <p className="text-gray-600 mb-8">
          {t('add_infant_description')}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Baby className="h-5 w-5 mr-2 text-blue-600" />
              {t('infant_information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('name')} *
                  </label>
                  <input
                    id="name"
                    {...register('name', { required: t('name_required') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('enter_infants_full_name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('date_of_birth')} *
                  </label>
                  <div className="relative">
                    <input
                      id="dateOfBirth"
                      type="date"
                      {...register('dateOfBirth', { 
                        required: t('date_of_birth_required'),
                        validate: (value) => {
                          if (!value) return true;
                          const selectedDate = new Date(value);
                          const today = new Date();
                          return selectedDate <= today || t('date_cannot_be_in_future');
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('gender')} *
                  </label>
                  <select
                    id="gender"
                    {...register('gender', { required: t('gender_required') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">{t('select_gender')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="birthWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('birth_weight')}
                  </label>
                  <div className="relative">
                    <input
                      id="birthWeight"
                      type="number"
                      step="0.1"
                      {...register('birthWeight', {
                        min: { value: 0, message: t('weight_must_be_positive') },
                        max: { value: 10, message: t('weight_seems_too_high') }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 3.2"
                    />
                    <Weight className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.birthWeight && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthWeight.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="birthLength" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('birth_length')}
                  </label>
                  <div className="relative">
                    <input
                      id="birthLength"
                      type="number"
                      step="0.1"
                      {...register('birthLength', {
                        min: { value: 0, message: t('length_must_be_positive') },
                        max: { value: 100, message: t('length_seems_too_high') }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 50"
                    />
                    <Ruler className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.birthLength && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthLength.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="birthHeadCircumference" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('birth_head_circumference')} *
                  </label>
                  <div className="relative">
                    <input
                      id="birthHeadCircumference"
                      type="number"
                      step="0.1"
                      {...register('birthHeadCircumference', {
                        required: t('birth_head_circumference_required'),
                        min: { value: 0, message: t('head_circumference_must_be_positive') },
                        max: { value: 100, message: t('head_circumference_seems_too_high') }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 35"
                    />
                    <Ruler className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  {errors.birthHeadCircumference && (
                    <p className="mt-1 text-sm text-red-600">{errors.birthHeadCircumference.message}</p>
                  )}
                </div>
              </div>

              {/* Medical Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('medical_information')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="medicalInfo.bloodType" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('blood_type')}
                    </label>
                    <select
                      id="medicalInfo.bloodType"
                      {...register('medicalInfo.bloodType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('select_blood_type')}</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="Unknown">{t('unknown')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.allergies" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('allergies')}
                    </label>
                    <input
                      id="medicalInfo.allergies"
                      {...register('medicalInfo.allergies')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('e_g_milk_eggs_peanuts')}
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.medications" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('medications')}
                    </label>
                    <input
                      id="medicalInfo.medications"
                      {...register('medicalInfo.medications')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('e_g_vitamin_d_probiotics')}
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.conditions" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('conditions')}
                    </label>
                    <input
                      id="medicalInfo.conditions"
                      {...register('medicalInfo.conditions')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('e_g_asthma_eczema')}
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.pediatrician.name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('pediatrician_name')}
                    </label>
                    <input
                      id="medicalInfo.pediatrician.name"
                      {...register('medicalInfo.pediatrician.name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('dr_jane_smith')}
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.pediatrician.contact" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('pediatrician_contact')}
                    </label>
                    <input
                      id="medicalInfo.pediatrician.contact"
                      {...register('medicalInfo.pediatrician.contact')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('phone_or_email')}
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
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
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link href="/dashboard">
                  <Button type="button" variant="outline">
                    {t('cancel')}
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || loading}
                  className="btn-primary"
                >
                  {isSubmitting || loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('saving')}
                    </>
                  ) : (
                    t('add_infant')
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}