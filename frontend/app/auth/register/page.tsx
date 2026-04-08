'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Baby } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (response) => {
      const { token, user } = response.data
      login(token, user)
      toast.success(t('account_created_successfully'))
      router.push('/dashboard')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('registration_failed'))
    },
  })

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
          <p className="text-gray-600 mt-2">{t('create_your_account')}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-gray-900">{t('get_started')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>
                <input
                  {...register('name', { 
                    required: t('full_name_required'), 
                    minLength: { value: 2, message: t('full_name_required') }
                  })}
                  className="input w-full"
                  placeholder={t('enter_your_full_name')}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  {...register('email', { 
                    required: t('email_required'),
                    pattern: { value: /^\S+@\S+$/i, message: t('invalid_email') }
                  })}
                  type="email"
                  className="input w-full"
                  placeholder={t('enter_your_email')}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('i_am_a')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative">
                    <input {...register('role')} type="radio" value="parent" className="sr-only peer" />
                    <div className="w-full p-3 text-center border rounded-md cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">{t('parent')}</div>
                  </label>
                  <label className="relative">
                    <input {...register('role')} type="radio" value="caregiver" className="sr-only peer" />
                    <div className="w-full p-3 text-center border rounded-md cursor-pointer peer-checked:border-primary-600 peer-checked:bg-primary-50">{t('caregiver')}</div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                <div className="relative">
                  <input
                    {...register('password', { 
                      required: t('password_is_required'), 
                      minLength: { value: 6, message: t('password_min_length') }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input w-full pr-10"
                    placeholder={t('enter_your_password')}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm_password')}</label>
                <input
                  {...register('confirmPassword', {
                    required: t('please_confirm_password'),
                    validate: value => value === password || t('passwords_must_match')
                  })}
                  type="password"
                  className="input w-full"
                  placeholder={t('enter_your_password')}
                />
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full btn-primary" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t('creating_account') : t('create_account')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('already_have_an_account')}{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('sign_in_here')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}