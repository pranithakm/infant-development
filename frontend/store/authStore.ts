import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  name: string
  email: string
  role: string
  preferences: any
  isVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      isInitialized: false,

      login: (token: string, user: User) => {
        // Also set token in localStorage for API interceptor compatibility
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
        })
      },

      logout: () => {
        // Set logout flag before clearing storage
        localStorage.setItem('logout-redirect', 'true')
        
        // Clear all storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        })
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          set({
            user: updatedUser,
          })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      initialize: () => {
        const state = get()
        if (state.token && state.user) {
          // Sync with localStorage
          localStorage.setItem('token', state.token)
          localStorage.setItem('user', JSON.stringify(state.user))
          set({
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          })
        } else {
          set({
            isLoading: false,
            isInitialized: true,
          })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialize()
        }
      },
    }
  )
)