'use client'

/**
 * SpeechAssistant.tsx
 *
 * Unified AI chat widget combining:
 *  - Voice recognition (mic input) & text-to-speech (TTS) from SpeechAssistant
 *  - Beautiful glassmorphism UI, suggestion chips, navigation links from AIAssistant
 *  - Multi-language support (EN, TA, HI, TE, ML)
 *  - Google Maps integration for hospital queries
 *  - Bug fix: stops mic while AI is speaking to prevent feedback loop
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, X, Loader2, Trash2, Maximize2, Minimize2 } from 'lucide-react'
import { assistantAPI, routinesAPI } from '@/lib/api'
import { useInfantStore } from '@/store/infantStore'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

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
// Language mapping
// ──────────────────────────────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  'en': 'en-US',
  'ta': 'ta-IN',
  'hi': 'hi-IN',
  'te': 'te-IN',
  'ml': 'ml-IN',
}

// ──────────────────────────────────────────────────────────────────
// Hospital & vaccine keywords for location-based queries
// ──────────────────────────────────────────────────────────────────

const HOSPITAL_KEYWORDS = [
  'hospital', 'clinic', 'doctor', 'மருத்துவமனை', 'ஆஸ்பத்திரி', 
  'ആശുപത്രി', 'nearby', 'vaccin', 'தடுப்பூசி', 'ஊசி', 'വാക്സിൻ',
  'fever', 'sick', 'emergency', 'prolonged', 'days'
]

// ──────────────────────────────────────────────────────────────────
// Navigation links for quick access
// ──────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: '📊 Dashboard', path: '/dashboard', icon: '📊' },
  { label: '📈 Growth', path: '/growth', icon: '📈' },
  { label: '🎯 Milestones', path: '/milestones', icon: '🎯' },
  { label: '📅 Calendar', path: '/calendar', icon: '📅' },
  { label: '🔍 Tracker', path: '/tracker', icon: '🔍' },
  { label: '💡 Insights', path: '/insights', icon: '💡' },
  { label: '🏛️ Schemes', path: '/dashboard/schemes', icon: '🏛️', absolute: true },
]

type AssistantChatMessage = {
  role: 'user' | 'assistant'
  content: string
  mapsUrl?: string
  navigateTo?: string | null
  suggestedRoutines?: { name: string; description: string }[]
}

function toYmdLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysLocal(base: Date, days: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  d.setDate(d.getDate() + days)
  return d
}

function navigatePathLabel(path: string): string {
  if (path.includes('/schemes')) return '🏛️ Government schemes'
  if (path.includes('/tracker')) return '🔍 Daily tracker'
  if (path.includes('/growth')) return '📈 Growth'
  if (path.includes('/milestones')) return '🎯 Milestones'
  if (path.includes('/insights')) return '💡 Insights'
  if (path.includes('/calendar')) return '📅 Calendar'
  if (path.includes('/progress')) return '📊 Progress'
  if (path === '/dashboard' || path.endsWith('/dashboard')) return '🏠 Dashboard'
  return '🔗 Open page'
}

function SuggestedRoutineRow({
  routine,
  infantId,
}: {
  routine: { name: string; description: string }
  infantId: string | undefined
}) {
  const [start, setStart] = useState(() => toYmdLocal(new Date()))
  const [end, setEnd] = useState(() => toYmdLocal(addDaysLocal(new Date(), 7)))
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!infantId) {
      toast.error('Select an infant first')
      return
    }
    if (start > end) {
      toast.error('End date must be on or after the start date')
      return
    }
    setAdding(true)
    try {
      await routinesAPI.createPersonalizedRoutine({
        infantId,
        name: routine.name,
        description: routine.description || `Care routine: ${routine.name}`,
        category: 'health',
        fromDate: start,
        toDate: end,
      })
      toast.success('Routine saved — view it on the tracker')
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      toast.error(ax.response?.data?.message || 'Could not add routine')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="ai-suggested-routine">
      <div className="ai-suggested-routine-head">
        <span className="ai-suggested-routine-name">{routine.name}</span>
        {routine.description ? (
          <span className="ai-suggested-routine-desc">{routine.description}</span>
        ) : null}
      </div>
      <div className="ai-suggested-routine-actions">
        <label className="ai-suggested-routine-date">
          <span>Start</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={adding} />
        </label>
        <label className="ai-suggested-routine-date">
          <span>End</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} disabled={adding} />
        </label>
        <button
          type="button"
          className="ai-suggested-routine-add"
          onClick={handleAdd}
          disabled={adding || !infantId}
        >
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────

export default function SpeechAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const { i18n } = useTranslation()
  const router = useRouter()

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Track speaking state in a ref so recognition callbacks always see latest value
  const isSpeakingRef = useRef(false)

  const { selectedInfant } = useInfantStore()
  const { isAuthenticated } = useAuthStore()

  // ── Initialize speech recognition & synthesis ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = LANG_MAP[i18n.language] || 'en-US'

        recognition.onresult = (event: any) => {
          // BUG FIX: Ignore speech input while the AI is speaking (TTS)
          // This prevents the AI's voice from being captured as user input
          if (isSpeakingRef.current) return

          let finalTranscript = ''
          let interimTranscript = ''
          for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += (finalTranscript ? ' ' : '') + transcript
            } else {
              interimTranscript += (interimTranscript ? ' ' : '') + transcript
            }
          }
          const currentText = (finalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim()
          setInputText(currentText)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied')
          }
        }
        recognitionRef.current = recognition
      }

      synthRef.current = window.speechSynthesis

      // Pre-load voices
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = () => {
          console.log('Voices loaded')
        }
      }
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel()
      if (recognitionRef.current) recognitionRef.current.stop()
    }
  }, [i18n.language])

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Focus input when chat opens ──
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  // ── Clear chat when switching infants ──
  useEffect(() => {
    setMessages([])
    setInputText('')
    if (synthRef.current) synthRef.current.cancel()
    setIsSpeaking(false)
  }, [selectedInfant?._id])

  // ── Keep isSpeakingRef in sync ──
  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  // ── Toggle mic ──
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      if (inputText.trim()) {
        handleSendMessage(inputText)
      }
    } else {
      // Don't start listening while AI is speaking
      if (isSpeaking) {
        toast('Wait for the assistant to finish speaking', { icon: '🔊' })
        return
      }
      if (!recognitionRef.current) {
        toast.error('Speech recognition not supported in this browser.')
        return
      }
      try {
        setInputText('')
        setIsListening(true)
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start recognition:', error)
        setIsListening(false)
      }
    }
  }, [isListening, inputText, isSpeaking])

  // ── Text-to-Speech ──
  const speak = useCallback((text: string, lang?: string) => {
    if (!synthRef.current) return

    // Stop any current speech
    synthRef.current.cancel()

    // BUG FIX: Stop microphone while AI speaks to prevent feedback loop
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    const voiceLang = lang || i18n.language

    // For Tamil and Malayalam, try Google TTS first
    if (voiceLang === 'ta' || voiceLang === 'ml') {
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voiceLang}&client=gtx`
        const audio = new Audio(url)
        audio.volume = 1.0

        audio.onplay = () => { setIsSpeaking(true) }
        audio.onended = () => { setIsSpeaking(false) }
        audio.onerror = () => {
          console.warn(`Google TTS (${voiceLang}) failed, falling back to local synthesis`)
          fallbackToSynthesis(text, voiceLang)
        }

        setTimeout(() => {
          if (audio.paused && !isSpeakingRef.current) {
            audio.pause()
            fallbackToSynthesis(text, voiceLang)
          }
        }, 3000)

        audio.play().catch(() => {
          fallbackToSynthesis(text, voiceLang)
        })
        return
      } catch {
        console.warn('Google TTS setup failed')
      }
    }

    fallbackToSynthesis(text, voiceLang)
  }, [i18n.language, isListening])

  const fallbackToSynthesis = (text: string, lang: string) => {
    if (!synthRef.current) return

    const utterance = new SpeechSynthesisUtterance(text)
    const voiceLang = LANG_MAP[lang] || 'en-US'
    utterance.lang = voiceLang

    // Select best available voice
    const voices = synthRef.current.getVoices()
    const matchingVoice =
      voices.find(v => v.name.includes('Neural') && v.lang.startsWith(voiceLang.split('-')[0])) ||
      voices.find(v => v.name.includes('Google') && v.lang.startsWith(voiceLang.split('-')[0])) ||
      voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]))

    if (matchingVoice) utterance.voice = matchingVoice

    utterance.rate = lang === 'ta' ? 0.85 : 0.95
    utterance.pitch = 1.0
    utterance.onstart = () => { setIsSpeaking(true) }
    utterance.onend = () => { setIsSpeaking(false) }
    utterance.onerror = () => { setIsSpeaking(false) }

    synthRef.current.speak(utterance)
  }

  // ── Location request for hospital queries ──
  const requestLocation = (): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      if (userLocation) { resolve(userLocation); return }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          resolve(loc)
        },
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  // ── Send message ──
  const handleSendMessage = useCallback(async (text?: string) => {
    const messageToSend = (typeof text === 'string' ? text : inputText).trim()
    if (!messageToSend || loading) return

    const infant = useInfantStore.getState().selectedInfant
    const infantId = infant?._id

    setMessages(prev => [...prev, { role: 'user' as const, content: messageToSend }])
    setInputText('')
    setLoading(true)

    // Auto-request location for hospital queries
    let location = userLocation
    const isHospitalQuery = HOSPITAL_KEYWORDS.some(k => messageToSend.toLowerCase().includes(k))
    if (isHospitalQuery && !userLocation) {
      location = await requestLocation()
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await assistantAPI.chat(messageToSend, i18n.language, infantId, history, location ?? undefined)

      const { success, data, message: errorMsg } = response.data
      if (success) {
        const assistantMessage = data.response
        const responseLanguage = data.language || i18n.language
        const mapsUrl = data.mapsUrl as string | null | undefined
        const navigateTo = data.navigateTo as string | null | undefined
        const suggestedRoutines = data.suggestedRoutines as { name: string; description: string }[] | undefined

        // Sync language if AI detected a different one
        if (responseLanguage !== i18n.language) {
          i18n.changeLanguage(responseLanguage)
        }

        setMessages(prev => [
          ...prev,
          {
            role: 'assistant' as const,
            content: assistantMessage,
            mapsUrl: mapsUrl || undefined,
            navigateTo: navigateTo || undefined,
            suggestedRoutines:
              suggestedRoutines && suggestedRoutines.length > 0 ? suggestedRoutines : undefined,
          },
        ])
        speak(assistantMessage, responseLanguage)
      } else {
        toast.error(errorMsg || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error in assistant chat:', error)
      toast.error('Error connecting to assistant')
    } finally {
      setLoading(false)
    }
  }, [inputText, loading, messages, userLocation, i18n, speak])

  // ── Suggestion chip click ──
  const handleSuggestion = useCallback((text: string) => {
    handleSendMessage(text)
  }, [handleSendMessage])

  // ── Clear conversation ──
  const handleClear = useCallback(() => {
    setMessages([])
    if (synthRef.current) synthRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  // ── Stop speaking ──
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel()
    setIsSpeaking(false)
  }, [])

  // ── Navigate handler ──
  const handleNavigate = useCallback((path: string, absolute?: boolean) => {
    const infant = useInfantStore.getState().selectedInfant
    if (!absolute && !infant) {
      toast.error('Please select an infant first')
      return
    }
    const url = absolute ? path : `/dashboard/infants/${infant!._id}${path}`
    router.push(url)
  }, [router])

  const openAssistantDestination = useCallback(
    (path: string) => {
      if (!path) return
      router.push(path)
      setIsOpen(false)
    },
    [router]
  )

  // ── Toggle maximize ──
  const toggleMaximize = useCallback(() => {
    setIsMaximized(prev => !prev)
  }, [])

  // ── Don't render for unauthenticated users ──
  if (!isAuthenticated) return null

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          id="ai-assistant-fab"
          onClick={() => setIsOpen(true)}
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
        <div className={`ai-panel ${isMaximized ? 'ai-panel-maximized' : ''}`} id="ai-assistant-panel">
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
                  {isSpeaking && <span style={{marginLeft: '6px', fontSize: '10px'}}>🔊 Speaking...</span>}
                  {isListening && <span style={{marginLeft: '6px', fontSize: '10px', color: '#ef4444'}}>🎤 Listening...</span>}
                </span>
              </div>
            </div>

            <div className="ai-panel-header-actions">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="ai-panel-btn"
                  title="Stop speaking"
                >
                  <VolumeX width={16} height={16} />
                </button>
              )}
              <button
                onClick={handleClear}
                className="ai-panel-btn"
                title="Clear conversation"
              >
                <Trash2 width={16} height={16} />
              </button>
              <button
                onClick={toggleMaximize}
                className="ai-panel-btn"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 width={16} height={16} /> : <Maximize2 width={16} height={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="ai-panel-btn"
                title="Close"
              >
                <X width={16} height={16} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="ai-panel-messages">
            {/* Welcome state */}
            {messages.length === 0 && !loading && (
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

                {/* Quick navigation links */}
                <div className="ai-nav-section">
                  <p className="ai-nav-section-title">📍 Quick Navigation</p>
                  <div className="ai-nav-links">
                    {NAV_LINKS.map((link) => (
                      <button
                        key={link.path}
                        className="ai-nav-chip"
                        onClick={() => handleNavigate(link.path, link.absolute)}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, index) => {
              const displayContent = msg.content.trim()
              const mapsUrl = msg.mapsUrl

              return (
                <div
                  key={index}
                  className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}
                >
                  <div className="ai-msg-bubble">
                    {msg.role === 'assistant' ? (
                      <div className="ai-markdown-content">
                        <ReactMarkdown>{displayContent}</ReactMarkdown>
                      </div>
                    ) : (
                      displayContent
                    )}
                  </div>
                  {msg.role === 'assistant' && msg.navigateTo ? (
                    <div className="ai-nav-page-row">
                      <button
                        type="button"
                        className="ai-nav-page-btn"
                        onClick={() => openAssistantDestination(msg.navigateTo!)}
                      >
                        {navigatePathLabel(msg.navigateTo)}
                      </button>
                    </div>
                  ) : null}
                  {msg.role === 'assistant' &&
                  msg.suggestedRoutines &&
                  msg.suggestedRoutines.length > 0 ? (
                    <div className="ai-suggested-routines-block">
                      <p className="ai-suggested-routines-title">Suggested care routines</p>
                      {msg.suggestedRoutines.map((r, ri) => (
                        <SuggestedRoutineRow
                          key={`${index}-${ri}-${r.name}`}
                          routine={r}
                          infantId={selectedInfant?._id}
                        />
                      ))}
                    </div>
                  ) : null}
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-nav-link"
                      style={{ marginTop: '4px', display: 'inline-block' }}
                    >
                      📍 Open Nearby Hospitals on Google Maps
                    </a>
                  ) : null}
                  {msg.role === 'assistant' ? (
                    <button
                      onClick={() => speak(displayContent)}
                      className="ai-panel-btn"
                      title="Replay audio"
                      style={{
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        opacity: 0.6,
                      }}
                    >
                      <Volume2 width={14} height={14} /> Replay
                    </button>
                  ) : null}
                </div>
              )
            })}

            {/* Loading indicator */}
            {loading && (
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

          {/* Input area with mic & text */}
          <form
            className="ai-panel-input"
            onSubmit={(e) => { e.preventDefault(); handleSendMessage() }}
            style={{gap: '8px'}}
          >
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`ai-mic-btn ${isListening ? 'ai-mic-btn-active' : ''}`}
              title={isListening ? 'Stop listening & send' : 'Start voice input'}
              disabled={loading}
            >
              {isListening ? <MicOff width={20} height={20} /> : <Mic width={20} height={20} />}
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              id="ai-assistant-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening...'
                  : selectedInfant
                    ? `Ask about ${selectedInfant.name}...`
                    : 'Ask a question...'
              }
              disabled={loading}
              autoComplete="off"
            />

            {/* Send button */}
            <button
              type="submit"
              className="ai-send-btn"
              disabled={loading || !inputText.trim()}
              aria-label="Send message"
            >
              <Send width={18} height={18} />
            </button>
          </form>

          {/* Multi-language hint */}
          <div style={{
            textAlign: 'center',
            fontSize: '10px',
            color: '#9ca3af',
            padding: '4px 0 8px',
            background: 'white',
            borderRadius: '0 0 16px 16px',
          }}>
            Speak in English, Tamil, Malayalam, Hindi, or Telugu
          </div>
        </div>
      )}
    </>
  )
}
