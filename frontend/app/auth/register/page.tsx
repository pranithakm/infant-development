'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Baby } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'parent' | 'caregiver'
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const registerMutation = useMutation(
    authAPI.register,
    {
      onSuccess: (response) => {
        const { token, user } = response.data
        login(token, user)
        toast.success('Account created successfully!')
        router.push('/dashboard')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed')
      },
    }
  )

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword, ...registerData } = data
    registerMutation.mutate(registerData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Baby className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FirstSteps</span>
          </Link>
          <p className="text-gray-600 mt-2">Create your account</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  {...register('name', { required: 'Name is required', minLength: 2 })}
                  className="input w-full"
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                  })}
                  type="email"
                  className="input w-full"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative">
                    <input {...register('role')} type="radio" value="parent" className="sr-only peer" />
                    <div className="w-full p-3 text-center border rounded-md cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">Parent</div>
                  </label>
                  <label className="relative">
                    <input {...register('role')} type="radio" value="caregiver" className="sr-only peer" />
                    <div className="w-full p-3 text-center border rounded-md cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">Caregiver</div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    {...register('password', { required: 'Password is required', minLength: 6 })}
                    type={showPassword ? 'text' : 'password'}
                    className="input w-full pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type="password"
                  className="input w-full"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={registerMutation.isLoading}>
                {registerMutation.isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}