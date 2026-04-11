import { create } from 'zustand'

/**
 * agentStore.ts
 *
 * Zustand store for the global AI agent.
 * Tracks context (currentPage, selectedInfantId, lastAction)
 * and manages chat UI state (messages, isOpen, isLoading).
 */

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

export interface SuggestedRoutine {
  name: string
  description: string
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
  toolsUsed?: string[]
  contextUsed?: boolean
  navigateTo?: string | null
  suggestedRoutines?: SuggestedRoutine[]
}

interface AgentState {
  // --- Context ---
  currentPage: string
  selectedInfantId: string | null
  lastUserAction: string

  // --- Chat UI ---
  messages: AgentMessage[]
  isOpen: boolean
  isLoading: boolean
  error: string | null
  pendingNavigation: string | null

  // --- Actions ---
  setCurrentPage: (page: string) => void
  setSelectedInfantId: (id: string | null) => void
  setLastUserAction: (action: string) => void
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
  sendMessage: (question: string) => Promise<void>
  clearMessages: () => void
  clearMemory: () => Promise<void>
  clearPendingNavigation: () => void
}

// -------------------------------------------------------------------
// Helper — generate unique message IDs
// -------------------------------------------------------------------

let messageCounter = 0
const generateId = () => `msg_${Date.now()}_${++messageCounter}`

// -------------------------------------------------------------------
// Store
// -------------------------------------------------------------------

export const useAgentStore = create<AgentState>()((set, get) => ({
  // Initial state
  currentPage: '',
  selectedInfantId: null,
  lastUserAction: '',
  messages: [],
  isOpen: false,
  isLoading: false,
  error: null,
  pendingNavigation: null,

  // --- Context setters ---
  setCurrentPage: (page: string) => set({ currentPage: page }),
  setSelectedInfantId: (id: string | null) => set({ selectedInfantId: id }),
  setLastUserAction: (action: string) => set({ lastUserAction: action }),

  // --- Chat UI ---
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),

  clearMessages: () => set({ messages: [], error: null }),

  // --- Send message to agent ---
  sendMessage: async (question: string) => {
    const { currentPage, selectedInfantId, lastUserAction } = get()

    // Add user message to the chat immediately
    const userMsg: AgentMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
    }))

    try {
      // Dynamic import to avoid SSR issues with localStorage-based auth
      const { default: api } = await import('@/lib/api')

      const response = await api.post('/agent/chat', {
        infantId: selectedInfantId,
        question,
        currentPage,
        lastAction: lastUserAction,
      })

      const data = response.data?.data

      const navigateTo = data?.navigateTo || null
      const suggestedRoutines: SuggestedRoutine[] = data?.suggestedRoutines || []

      const assistantMsg: AgentMessage = {
        id: generateId(),
        role: 'assistant',
        content: data?.response || 'No response received.',
        timestamp: new Date(),
        provider: data?.provider,
        toolsUsed: data?.toolsUsed,
        contextUsed: data?.contextUsed,
        navigateTo,
        suggestedRoutines,
      }

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
        pendingNavigation: navigateTo,
      }))
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to get a response. Please try again.'

      const errorAssistantMsg: AgentMessage = {
        id: generateId(),
        role: 'assistant',
        content: `⚠ ${errorMsg}`,
        timestamp: new Date(),
        provider: 'error',
      }

      set((state) => ({
        messages: [...state.messages, errorAssistantMsg],
        isLoading: false,
        error: errorMsg,
      }))
    }
  },

  // --- Navigation ---
  clearPendingNavigation: () => set({ pendingNavigation: null }),

  // --- Clear server-side memory ---
  clearMemory: async () => {
    try {
      const { default: api } = await import('@/lib/api')
      await api.delete('/agent/memory')
      set({ messages: [], error: null })
    } catch (err: any) {
      console.error('Failed to clear memory:', err.message)
    }
  },
}))
