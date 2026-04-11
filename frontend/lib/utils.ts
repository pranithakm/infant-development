import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - birth.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30.44)
  
  if (diffMonths < 1) {
    return `${diffDays} days`
  } else if (diffMonths < 12) {
    const remainingDays = Math.floor(diffDays - (diffMonths * 30.44))
    return `${diffMonths} months, ${remainingDays} days`
  } else {
    const years = Math.floor(diffMonths / 12)
    const remainingMonths = diffMonths % 12
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} months`
  }
}

export function getAgeInMonths(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  return Math.max(0, months)
}

export function getMilestoneStatusColor(status: string): string {
  switch (status) {
    case 'not-started': return 'text-gray-500 bg-gray-100'
    case 'emerging': return 'text-yellow-700 bg-yellow-100'
    case 'developing': return 'text-blue-700 bg-blue-100'
    case 'achieved': return 'text-green-700 bg-green-100'
    case 'mastered': return 'text-green-800 bg-green-200'
    default: return 'text-gray-500 bg-gray-100'
  }
}

export function getMilestoneStatusText(status: string): string {
  switch (status) {
    case 'not-started': return 'Not Started'
    case 'emerging': return 'Emerging'
    case 'developing': return 'Developing'
    case 'achieved': return 'Achieved'
    case 'mastered': return 'Mastered'
    default: return 'Unknown'
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'motor': return 'text-blue-600 bg-blue-100'
    case 'cognitive': return 'text-purple-600 bg-purple-100'
    case 'language': return 'text-green-600 bg-green-100'
    case 'social-emotional': return 'text-pink-600 bg-pink-100'
    case 'adaptive': return 'text-orange-600 bg-orange-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case 'motor': return '🏃‍♂️'
    case 'cognitive': return '🧠'
    case 'language': return '💬'
    case 'social-emotional': return '❤️'
    case 'adaptive': return '🛠️'
    default: return '📊'
  }
}

export function calculateProgressPercentage(progressData: any[]): number {
  if (progressData.length === 0) return 0
  
  const achieved = progressData.filter(p => 
    p.status === 'achieved' || p.status === 'mastered'
  ).length
  
  return Math.round((achieved / progressData.length) * 100)
}

export function groupProgressByCategory(progressData: any[]) {
  return progressData.reduce((acc, progress) => {
    const category = progress.milestone?.category || 'unknown'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(progress)
    return acc
  }, {} as Record<string, any[]>)
}