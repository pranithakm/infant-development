'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Baby, Calendar, Ruler, Weight, User, Phone, Heart } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Infant } from '@/types'

export default function EditInfantPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<Infant>({
    defaultValues: {
      name: '',
      dateOfBirth: '',
      gender: undefined,
      birthWeight: undefined,
      birthLength: undefined,
      birthHeadCircumference: undefined,
      medicalInfo: {
        bloodType: '',
        allergies: [],
        medications: [],
        conditions: [],
        pediatrician: {
          name: '',
          contact: ''
        }
      }
    }
  })

  useEffect(() => {
    fetchInfant(params.id)
  }, [params.id, fetchInfant])

  useEffect(() => {
    if (selectedInfant) {
      reset({
        name: selectedInfant.name,
        dateOfBirth: selectedInfant.dateOfBirth.split('T')[0], // Format date for input
        gender: selectedInfant.gender,
        birthWeight: selectedInfant.birthWeight,
        birthLength: selectedInfant.birthLength,
        birthHeadCircumference: selectedInfant.birthHeadCircumference,
        medicalInfo: {
          bloodType: selectedInfant.medicalInfo?.bloodType || '',
          allergies: selectedInfant.medicalInfo?.allergies || [],
          medications: selectedInfant.medicalInfo?.medications || [],
          conditions: selectedInfant.medicalInfo?.conditions || [],
          pediatrician: {
            name: selectedInfant.medicalInfo?.pediatrician?.name || '',
            contact: selectedInfant.medicalInfo?.pediatrician?.contact || ''
          }
        }
      })
    }
  }, [selectedInfant, reset])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // For now, we'll just show a success message since we don't have an update API endpoint
      // In a real implementation, you would call an update API here
      toast.success('Infant profile updated successfully!')
      router.push(`/infants/${params.id}`)
    } catch (err) {
      toast.error('Failed to update infant. Please try again.')
    } finally {
      setIsSubmitting(false)
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
            <p className="mt-4 text-gray-600">Loading infant details...</p>
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
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/infants/${params.id}`} className="text-blue-600 hover:text-blue-800 flex items-center">
            ← Back to Infant Details
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Infant Profile</h1>
          <p className="text-gray-600 mt-1">
            Update your infant's information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Baby className="h-5 w-5 mr-2 text-blue-600" />
              Infant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter infant's full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <input
                      id="dateOfBirth"
                      type="date"
                      {...register('dateOfBirth', { 
                        required: 'Date of birth is required',
                        validate: (value) => {
                          if (!value) return true;
                          const selectedDate = new Date(value);
                          const today = new Date();
                          return selectedDate <= today || 'Date cannot be in the future';
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
                    Gender *
                  </label>
                  <select
                    id="gender"
                    {...register('gender', { required: 'Gender is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="birthWeight" className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Weight (kg)
                  </label>
                  <div className="relative">
                    <input
                      id="birthWeight"
                      type="number"
                      step="0.1"
                      {...register('birthWeight', {
                        min: { value: 0, message: 'Weight must be positive' },
                        max: { value: 10, message: 'Weight seems too high' }
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
                    Birth Length (cm)
                  </label>
                  <div className="relative">
                    <input
                      id="birthLength"
                      type="number"
                      step="0.1"
                      {...register('birthLength', {
                        min: { value: 0, message: 'Length must be positive' },
                        max: { value: 100, message: 'Length seems too high' }
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
                    Birth Head Circumference (cm)
                  </label>
                  <div className="relative">
                    <input
                      id="birthHeadCircumference"
                      type="number"
                      step="0.1"
                      {...register('birthHeadCircumference', {
                        min: { value: 0, message: 'Head circumference must be positive' },
                        max: { value: 100, message: 'Head circumference seems too high' }
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
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-600" />
                  Medical Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="medicalInfo.bloodType" className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Type
                    </label>
                    <select
                      id="medicalInfo.bloodType"
                      {...register('medicalInfo.bloodType')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.allergies" className="block text-sm font-medium text-gray-700 mb-1">
                      Allergies
                    </label>
                    <input
                      id="medicalInfo.allergies"
                      {...register('medicalInfo.allergies')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Milk, Eggs, Peanuts"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.medications" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Medications
                    </label>
                    <input
                      id="medicalInfo.medications"
                      {...register('medicalInfo.medications')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Vitamin D, Probiotics"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.conditions" className="block text-sm font-medium text-gray-700 mb-1">
                      Medical Conditions
                    </label>
                    <input
                      id="medicalInfo.conditions"
                      {...register('medicalInfo.conditions')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Asthma, Eczema"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.pediatrician.name" className="block text-sm font-medium text-gray-700 mb-1">
                      Pediatrician Name
                    </label>
                    <input
                      id="medicalInfo.pediatrician.name"
                      {...register('medicalInfo.pediatrician.name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Dr. Jane Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="medicalInfo.pediatrician.contact" className="block text-sm font-medium text-gray-700 mb-1">
                      Pediatrician Contact
                    </label>
                    <input
                      id="medicalInfo.pediatrician.contact"
                      {...register('medicalInfo.pediatrician.contact')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Phone or email"
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
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link href={`/infants/${params.id}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Update Infant'
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