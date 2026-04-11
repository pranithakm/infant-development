'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Lightbulb, TrendingUp, Activity, Target, Sparkles, MessageCircle, Send, Loader } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { aiAPI } from '@/lib/api'

export default function InsightsPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore()
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
    }
  }, [params.id, fetchInfant])

  // Fetch AI insights when infant data is loaded
  useEffect(() => {
    if (selectedInfant && !aiInsights && !insightsLoading) {
      fetchAIInsights()
    }
  }, [selectedInfant])

  const fetchAIInsights = async () => {
    if (!selectedInfant) return
    
    setInsightsLoading(true)
    setInsightsError(null)
    
    try {
      const response = await aiAPI.getInsights(selectedInfant._id)
      setAiInsights(response.data.data.insights)
    } catch (err: any) {
      console.error('Error fetching AI insights:', err)
      setInsightsError(t('failed_to_load_ai_insights') || 'Failed to load AI insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  const getAIResponse = async (message: string) => {
    if (!selectedInfant) return t('infant_not_found')
    
    try {
      const response = await aiAPI.chatWithAI(selectedInfant._id, message)
      return response.data.data.response
    } catch (err: any) {
      console.error('Error chatting with AI:', err)
      return t('failed_to_get_ai_response') || 'Failed to get response from AI'
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedInfant) return
    
    // Add user message to chat
    const newUserMessage = { role: 'user', content: chatMessage }
    const updatedHistory = [...chatHistory, newUserMessage]
    setChatHistory(updatedHistory)
    setChatMessage('')
    
    // Show loading indicator for AI response
    const loadingMessage = { role: 'ai', content: '...' }
    setChatHistory([...updatedHistory, loadingMessage])
    
    try {
      const aiResponse = await getAIResponse(chatMessage)
      const newAIMessage = { role: 'ai', content: aiResponse }
      setChatHistory([...updatedHistory, newAIMessage])
    } catch (error) {
      const errorMessage = { role: 'ai', content: t('failed_to_get_ai_response') || 'Failed to get response from AI' }
      setChatHistory([...updatedHistory, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
            <p className="mt-4 text-gray-600">{t('loading_insights')}</p>
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
                  <h3 className="text-sm font-medium text-red-800">{t('error')}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline">{t('back_to_dashboard')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedInfant) {
    return (
      <div className="flex-1 p-8">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <Lightbulb className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-xl font-medium text-gray-900">{t('infant_not_found')}</h3>
            <p className="mt-2 text-gray-600">{t('infant_not_found_desc')}</p>
            <div className="mt-6">
              <Link href="/dashboard">
                <Button variant="outline">{t('back_to_dashboard')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('ai_insights')}</h1>
        <p className="text-gray-600 mb-6">{t('personalized_recommendations')}</p>

        {/* AI Insights */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
              {t('developmental_insights')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">{t('generating_insights')}</span>
              </div>
            ) : insightsError ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{insightsError}</p>
                <Button 
                  onClick={fetchAIInsights} 
                  className="mt-2"
                  variant="outline"
                >
                  {t('retry')}
                </Button>
              </div>
            ) : aiInsights ? (
              <div className="prose max-w-none">
                {aiInsights.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">{t('no_insights_available')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
              {t('ask_ai_assistant')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Chat History */}
              <div className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                {chatHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p>{t('start_conversation_with_ai')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.role === 'ai' && message.content === '...' ? (
                            <div className="flex items-center">
                              <Loader className="h-4 w-4 animate-spin mr-1" />
                              {t('thinking')}
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Chat Input */}
              <div className="flex">
                <div className="flex-1 relative">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('ask_about_development')}
                    className="block w-full pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    rows={2}
                    disabled={!selectedInfant}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  className="ml-2"
                  disabled={!chatMessage.trim() || !selectedInfant}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}