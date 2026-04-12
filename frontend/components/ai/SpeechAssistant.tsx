'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Send, X, MessageSquare, Loader2 } from 'lucide-react'
import { assistantAPI } from '@/lib/api'
import { useInfantStore } from '@/store/infantStore'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function SpeechAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const { i18n } = useTranslation()

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        
        const langMap: Record<string, string> = {
          'en': 'en-US',
          'ta': 'ta-IN',
          'hi': 'hi-IN',
          'te': 'te-IN',
          'ml': 'ml-IN'
        }
        recognition.lang = langMap[i18n.language] || 'en-US'

        let finalTranscript = ''
        recognition.onresult = (event: any) => {
          let interimTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            } else {
              interimTranscript += event.results[i][0].transcript
            }
          }
          const currentText = finalTranscript + interimTranscript
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
      
      // Pre-load voices for better response time
      if (synthRef.current.getVoices().length === 0) {
        synthRef.current.onvoiceschanged = () => {
          console.log('Voices loaded');
        };
      }
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [i18n.language])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      if (inputText.trim()) {
        handleSendMessage(inputText)
      }
    } else {
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
  }

  const speak = (text: string, lang?: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    
    const voiceLang = lang || i18n.language
    
    // For Tamil and Malayalam, try to use a high-quality online voice first (Google's natural voice)
    if (voiceLang === 'ta' || voiceLang === 'ml') {
      try {
        // Higher stability with client=gtx or client=tw-ob (optimized)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${voiceLang}&client=gtx`;
        const audio = new Audio(url);
        audio.volume = 1.0;
        
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = (e) => {
          console.warn(`Google TTS (${voiceLang}) failed, falling back to local synthesis`, e);
          fallbackToSynthesis(text, voiceLang);
        };
        
        // Timeout check for cases where it doesn't play or error
        setTimeout(() => {
          if (audio.paused && !isSpeaking) {
            console.warn(`Google TTS (${voiceLang}) timed out, switching to local`);
            audio.pause();
            fallbackToSynthesis(text, voiceLang);
          }
        }, 3000);

        audio.play().catch(err => {
          console.warn('Audio play failed (interaction required or blocked)', err);
          fallbackToSynthesis(text, voiceLang);
        });
        return;
      } catch (err) {
        console.warn('Google TTS setup failed', err);
      }
    }
    
    fallbackToSynthesis(text, voiceLang);
  }

  const fallbackToSynthesis = (text: string, lang: string) => {
    if (!synthRef.current) return;
    
    const utterance = new SpeechSynthesisUtterance(text)
    const langMap: Record<string, string> = {
      'en': 'en-US',
      'ta': 'ta-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'ml': 'ml-IN'
    }
    
    const voiceLang = langMap[lang] || 'en-US'
    utterance.lang = voiceLang

    // Select the best available local voice (Prioritize Neural/High-Quality)
    const voices = synthRef.current.getVoices()
    let matchingVoice = voices.find(v => v.name.includes('Neural') && v.lang.startsWith(voiceLang.split('-')[0])) ||
                        voices.find(v => v.name.includes('Google') && v.lang.startsWith(voiceLang.split('-')[0])) ||
                        voices.find(v => v.name.includes('Lekha') && v.lang.startsWith('ml')) ||
                        voices.find(v => v.name.includes('Valluvar') && v.lang.startsWith('ta')) ||
                        voices.find(v => v.name.includes('Meera')) || 
                        voices.find(v => v.name.includes('Pallavi')) || 
                        // Better Tamil/Malayalam voice detection for various platforms
                        voices.find(v => v.lang.startsWith('ta')) || 
                        voices.find(v => v.lang.startsWith('ml')) ||
                        voices.find(v => v.lang.startsWith(voiceLang.split('-')[0]));
    
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }
    
    // Slower rate for better clarity (especially for uneducated users)
    utterance.rate = lang === 'ta' ? 0.85 : 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    synthRef.current.speak(utterance)
  }

  const HOSPITAL_KEYWORDS = ['hospital', 'clinic', 'doctor', 'மருத்துவமனை', 'ஆஸ்பத்திரி', 'ആശുപത്രി', 'nearby', 'vaccin', 'தடுப்பூசி', 'ஊசி', 'വാക്സിൻ']

  const requestLocation = (): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      if (userLocation) { resolve(userLocation); return; }
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

  const handleSendMessage = async (text?: string) => {
    const messageToSend = (typeof text === 'string' ? text : inputText).trim()
    if (!messageToSend) return

    const selectedInfant = useInfantStore.getState().selectedInfant
    const infantId = selectedInfant?._id

    const newMessages = [...messages, { role: 'user' as const, content: messageToSend }]
    setMessages(newMessages)
    setInputText('')
    setLoading(true)

    // Auto-request location for hospital queries
    let location = userLocation
    const isHospitalQuery = HOSPITAL_KEYWORDS.some(k => messageToSend.toLowerCase().includes(k))
    if (isHospitalQuery && !userLocation) {
      location = await requestLocation()
    }

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await assistantAPI.chat(messageToSend, i18n.language, infantId, history, location ?? undefined);
      
      const { success, data, message: errorMsg } = response.data;
      if (success) {
        const assistantMessage = data.response
        const responseLanguage = data.language || i18n.language
        const mapsUrl = data.mapsUrl
        
        // SYNC: Update the global language state if the AI detected a different language
        if (responseLanguage !== i18n.language) {
          i18n.changeLanguage(responseLanguage);
        }
        
        const fullMessage = mapsUrl ? `${assistantMessage}\n\n[MAPS_LINK:${mapsUrl}]` : assistantMessage
        setMessages(prev => [...prev, { role: 'assistant' as const, content: fullMessage }])
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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-110"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-[350px] md:w-[400px] shadow-2xl flex flex-col max-h-[600px] border-blue-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <div className={`w-3 h-3 rounded-full ${isSpeaking || loading ? 'bg-green-400 animate-pulse' : 'bg-blue-300'}`} />
              FirstSteps Assistant
            </CardTitle>
            <div className="flex gap-1">
              {isSpeaking && (
                <Button variant="ghost" size="icon" onClick={() => synthRef.current?.cancel()} className="text-white hover:bg-blue-700 h-8 w-8">
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700 h-8 w-8">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[350px] max-h-[40vh] bg-gray-50/50">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="text-blue-600 w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">How can I help you?</h3>
                <p className="text-sm text-gray-500 px-6">
                  You can ask me about:
                  <br />• Your baby's health
                  <br />• Government schemes & benefits
                  <br />• Nearby specialized hospitals
                </p>
              </div>
            )}
            {messages.map((msg, index) => {
              const mapsMatch = msg.content.match(/\[MAPS_LINK:(.*?)\]/)
              const displayContent = msg.content.replace(/\[MAPS_LINK:.*?\]/, '').trim()
              const mapsUrl = mapsMatch ? mapsMatch[1] : null
              return (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm relative group ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border text-gray-800 rounded-tl-none'
                  }`}
                >
                  {displayContent}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-blue-600 font-semibold text-xs border border-blue-200 rounded-lg px-3 py-1.5 bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      📍 Open Nearby Hospitals on Google Maps
                    </a>
                  )}
                  {msg.role === 'assistant' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => speak(displayContent)}
                      className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-blue-600"
                      title="Replay Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )})}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-4 border-t bg-white flex flex-col gap-3">
            <div className="flex gap-2 w-full">
              <Button 
                size="icon" 
                variant={isListening ? "destructive" : "outline"} 
                onClick={toggleListening}
                className={`rounded-full h-12 w-12 shrink-0 transition-all ${isListening ? 'ring-4 ring-red-100' : ''}`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6 text-blue-600" />}
              </Button>
              
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Ask me anything..." 
                  className="w-full bg-gray-100 border-none rounded-full px-5 h-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => handleSendMessage()}
                  className="absolute right-1 top-1 rounded-full h-10 w-10 text-blue-600 hover:bg-transparent"
                  disabled={!inputText.trim() || loading}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <p className="text-[10px] text-center text-gray-400">
              Speak in English, Tamil, Malayalam, Hindi, or Telugu. I'm here to help!
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
