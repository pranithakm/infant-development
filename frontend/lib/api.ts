import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from Zustand persist storage first
    const authStorage = localStorage.getItem('auth-storage')
    let token = null
    
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        token = parsed.state?.token
      } catch (e) {
        // Silent fail on auth storage parse error
      }
    }
    
    // Fallback to direct localStorage token
    if (!token) {
      token = localStorage.getItem('token')
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't retry on 429 errors (rate limiting)
    if (error.response?.status === 429) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Clear all auth-related storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth-storage')
      
      // Check if this is from a manual logout or session expiry
      const isLogoutRedirect = localStorage.getItem('logout-redirect')
      
      if (isLogoutRedirect) {
        // Remove the logout redirect flag
        localStorage.removeItem('logout-redirect')
        // Redirect to home page for manual logout
        if (typeof window !== 'undefined') {
          window.location.href = '/'
        }
      } else {
        // Redirect to login for session expiry
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API - Only essential auth functionality
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    name: string
    email: string
    password: string
    role?: string
    phone?: string
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/me'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
}

// Infants API
export const infantsAPI = {
  getInfants: () => api.get('/infants'),
  getInfant: (id: string) => api.get(`/infants/${id}`),
  createInfant: (data: any) => api.post('/infants', data),
  updateMilestoneStatus: (infantId: string, milestoneId: string, status: string) => 
    api.put(`/infants/${infantId}/milestones/${milestoneId}`, { status }),
  deleteInfant: (id: string) => api.delete(`/infants/${id}`),
}

// Growth API
export const growthAPI = {
  getGrowthMeasurements: (infantId: string) => api.get(`/growth/infant/${infantId}`),
  addGrowthMeasurement: (data: any) => api.post('/growth', data),
  updateGrowthMeasurement: (id: string, data: any) => api.put(`/growth/${id}`, data),
  deleteGrowthMeasurement: (id: string) => api.delete(`/growth/${id}`),
}

// Milestones API
export const milestonesAPI = {
  getMilestones: () => api.get('/milestones'),
  getMilestone: (id: string) => api.get(`/milestones/${id}`),
  initializeMilestones: () => api.post('/milestones/initialize'),
}

// Routines API
export const routinesAPI = {
  getRoutines: () => api.get('/routines'),
  getInfantRoutinesForDate: (infantId: string, date: string) => 
    api.get(`/routines/infants/${infantId}/date/${date}`),
  updateInfantRoutineStatus: (infantId: string, date: string, routineId: string, completed: boolean) => 
    api.put(`/routines/infants/${infantId}/date/${date}/routine/${routineId}`, { completed }),
  createPersonalizedRoutine: (data: { infantId: string; name: string; description: string; category?: string; duration?: number }) =>
    api.post('/routines/personalized', data),
}

// AI API
export const aiAPI = {
  getInsights: (infantId: string) => api.post(`/ai/insights/${infantId}`, {}),
  chatWithAI: (infantId: string, message: string) => api.post(`/ai/chat/${infantId}`, {
    message
  }),
  getChatHistory: (infantId: string) => api.get(`/ai/chat/${infantId}`),
  regenerateInsights: (infantId: string) => api.post(`/ai/insights/${infantId}/regenerate`, {})
}

export const progressAPI = {
  getProgressSummary: (infantId: string) => 
    Promise.resolve({ data: { overallStats: [] } }),
}

export const activitiesAPI = {
  getActivities: (params?: any) => 
    Promise.resolve({ data: { activities: [] } }),
  getRecommendations: (infantId: string) => 
    Promise.resolve({ data: { recommendations: [] } }),
}

export default api