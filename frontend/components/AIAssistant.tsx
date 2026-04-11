'use client'

/**
 * AIAssistant.tsx
 *
 * Global floating AI chat widget that appears on every page.
 * Features:
 *   - Floating action button with pulse animation
 *   - Expandable chat panel with glassmorphism design
 *   - Auto-scrolls to latest message
 *   - Shows provider & tools metadata per response
 *   - Syncs context (current page, selected infant) from stores
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAgentStore, AgentMessage, SuggestedRoutine } from '@/store/agentStore'
import { useInfantStore } from '@/store/infantStore'
import { useAuthStore } from '@/store/authStore'
import { usePathname, useRouter } from 'next/navigation'
import { routinesAPI } from '@/lib/api'

// ──────────────────────────────────────────────────────────────────
// Helper — readable page name from pathname
// ──────────────────────────────────────────────────────────────────

const pageNameFromPath = (pathname: string): string => {
  if (!pathname || pathname === '/') return 'home'
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1] || 'home'
}

// ──────────────────────────────────────────────────────────────────
// Quick-suggestion chips
// ──────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'How is my baby growing?',
  'Show milestone progress',
  'Any sleep concerns?',
  'Feeding recommendations',
  'Eligible government schemes',
]

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

export default function AIAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [addingRoutine, setAddingRoutine] = useState<string | null>(null)

  // Stores
  const { isAuthenticated } = useAuthStore()
  const { selectedInfant } = useInfantStore()

  const {
    isOpen,
    isLoading,
    messages,
    pendingNavigation,
    toggleChat,
    closeChat,
    sendMessage,
    clearMessages,
    clearMemory,
    setCurrentPage,
    setSelectedInfantId,
    clearPendingNavigation,
  } = useAgentStore()

  // ── Sync context on navigation / infant change ──
  useEffect(() => {
    setCurrentPage(pageNameFromPath(pathname))
  }, [pathname, setCurrentPage])

  useEffect(() => {
    setSelectedInfantId(selectedInfant?._id || null)
  }, [selectedInfant, setSelectedInfantId])

  // ── Auto-scroll to bottom when new messages arrive ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Focus input when chat opens ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // ── Manual navigate handler (for clickable links) ──
  const handleNavigate = useCallback(
    (url: string) => {
      router.push(url)
      clearPendingNavigation()
    },
    [router, clearPendingNavigation]
  )

  // ── Add suggested routine handler ──
  const handleAddRoutine = useCallback(
    async (routine: SuggestedRoutine) => {
      const { selectedInfantId } = useAgentStore.getState()
      if (!selectedInfantId) {
        alert('Select an infant first to add routines.')
        return
      }
      setAddingRoutine(routine.name)
      try {
        // Set date range: today → today + 5 days
        const from = new Date()
        const to = new Date()
        to.setDate(to.getDate() + 5)

        await routinesAPI.createPersonalizedRoutine({
          infantId: selectedInfantId,
          name: routine.name.substring(0, 100),
          description: routine.description || `Suggested by AI assistant`,
          category: 'personalized',
          fromDate: from.toISOString(),
          toDate: to.toISOString(),
        })
        alert(`✅ Added "${routine.name}" for the next 6 days!`)
      } catch (err: any) {
        alert(`Failed to add routine: ${err.response?.data?.message || err.message}`)
      } finally {
        setAddingRoutine(null)
      }
    },
    []
  )

  // ── Submit handler ──
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = input.trim()
      if (!trimmed || isLoading) return
      setInput('')
      await sendMessage(trimmed)
    },
    [input, isLoading, sendMessage]
  )

  const handleSuggestion = useCallback(
    (text: string) => {
      setInput('')
      sendMessage(text)
    },
    [sendMessage]
  )

  // ── Don't render for unauthenticated users ──
  if (!isAuthenticated) return null

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          id="ai-assistant-fab"
          onClick={toggleChat}
          className="ai-fab"
          aria-label="Open AI Assistant"
        >
          {/* Brain / sparkle icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.6 2.1-1.4 2.7l-.6.4V12h2a4 4 0 0 1 0 8h-1v-2h1a2 2 0 0 0 0-4h-4v6H8v-6H4a2 2 0 0 0 0 4h1v2H4a4 4 0 0 1 0-8h2V9.1l-.6-.4A4 4 0 0 1 4 6a4 4 0 0 1 4-4c1 0 2 .4 2.7 1" />
            <path d="m15.4 8.6.6-.4" />
            <path d="M12 2v4" />
          </svg>
          {/* Pulse ring */}
          <span className="ai-fab-pulse" />
        </button>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div className="ai-panel" id="ai-assistant-panel">
          {/* Header */}
          <div className="ai-panel-header">
            <div className="ai-panel-header-left">
              <div className="ai-panel-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.1-.6 2.1-1.4 2.7l-.6.4V12h2a4 4 0 0 1 0 8h-1v-2h1a2 2 0 0 0 0-4h-4v6H8v-6H4a2 2 0 0 0 0 4h1v2H4a4 4 0 0 1 0-8h2V9.1l-.6-.4A4 4 0 0 1 4 6a4 4 0 0 1 4-4c1 0 2 .4 2.7 1" />
                </svg>
              </div>
              <div>
                <h3 className="ai-panel-title">FirstSteps AI</h3>
                <span className="ai-panel-subtitle">
                  {selectedInfant ? selectedInfant.name : 'No infant selected'}
                </span>
              </div>
            </div>

            <div className="ai-panel-header-actions">
              <button
                onClick={() => { clearMessages(); clearMemory(); }}
                className="ai-panel-btn"
                title="Clear conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
              <button
                onClick={closeChat}
                className="ai-panel-btn"
                title="Close"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="ai-panel-messages">
            {/* Welcome state */}
            {messages.length === 0 && !isLoading && (
              <div className="ai-welcome">
                <div className="ai-welcome-icon">🍼</div>
                <p className="ai-welcome-title">Hi there!</p>
                <p className="ai-welcome-text">
                  I&apos;m your infant care assistant. Ask me anything about
                  growth, milestones, routines, or government schemes.
                </p>
                {!selectedInfant && (
                  <p className="ai-welcome-hint">
                    💡 Select an infant first for personalised answers.
                  </p>
                )}
                <div className="ai-suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      className="ai-suggestion-chip"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg: AgentMessage) => (
              <div
                key={msg.id}
                className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}
              >
                <div className="ai-msg-bubble">
                  {msg.content}
                </div>
                {/* Metadata for assistant messages */}
                {msg.role === 'assistant' && msg.provider && msg.provider !== 'error' && (
                  <div className="ai-msg-meta">
                    <span className="ai-meta-provider">{msg.provider}</span>
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <span className="ai-meta-tools">
                        🔧 {msg.toolsUsed.join(', ')}
                      </span>
                    )}
                    {msg.contextUsed && (
                      <span className="ai-meta-context">📊 context</span>
                    )}
                  </div>
                )}
                {/* Navigation link */}
                {msg.role === 'assistant' && msg.navigateTo && (
                  <button
                    className="ai-nav-link"
                    onClick={() => handleNavigate(msg.navigateTo!)}
                  >
                    📍 Go to page →
                  </button>
                )}
                {/* Suggested routines */}
                {msg.role === 'assistant' && msg.suggestedRoutines && msg.suggestedRoutines.length > 0 && (
                  <div className="ai-routines-block">
                    <div className="ai-routines-header">📋 Suggested Routines</div>
                    {msg.suggestedRoutines.map((r, i) => (
                      <div key={i} className="ai-routine-item">
                        <div className="ai-routine-info">
                          <span className="ai-routine-name">{r.name}</span>
                          {r.description && (
                            <span className="ai-routine-desc">{r.description}</span>
                          )}
                        </div>
                        <button
                          className="ai-routine-add-btn"
                          onClick={() => handleAddRoutine(r)}
                          disabled={addingRoutine === r.name}
                        >
                          {addingRoutine === r.name ? '...' : '+ Add'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-bubble ai-msg-loading">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form className="ai-panel-input" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              id="ai-assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedInfant
                  ? `Ask about ${selectedInfant.name}...`
                  : 'Ask a question...'
              }
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
