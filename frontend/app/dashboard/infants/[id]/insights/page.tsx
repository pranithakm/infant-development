'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useInfantStore } from '@/store/infantStore'
import { Lightbulb, TrendingUp, Activity, Target, Sparkles, MessageCircle, Send, Loader, RotateCcw, Plus } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { aiAPI, routinesAPI } from '@/lib/api'

// Function to format AI response
const formatAIResponse = (response: string) => {
  // Remove any markdown code block wrappers
  let formattedResponse = response.trim();
  if (formattedResponse.startsWith('```json')) {
    formattedResponse = formattedResponse.substring(7, formattedResponse.length - 3);
  } else if (formattedResponse.startsWith('```')) {
    formattedResponse = formattedResponse.substring(3, formattedResponse.length - 3);
  }
  
  // Convert markdown-style bold to HTML bold
  formattedResponse = formattedResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown-style italics to HTML italics
  formattedResponse = formattedResponse.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert line breaks to HTML line breaks
  formattedResponse = formattedResponse.replace(/\n/g, '<br />');
  
  return formattedResponse;
};

export default function InsightsPage({ params }: { params: { id: string } }) {
  const { selectedInfant, loading, error, fetchInfant } = useInfantStore()
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const [aiInsights, setAiInsights] = useState<any>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (params.id !== 'new') {
      fetchInfant(params.id)
    }
  }, [params.id, fetchInfant])

  // Fetch AI insights and chat history when infant data is loaded
  useEffect(() => {
    if (selectedInfant) {
      // Set existing insights if available
      if (selectedInfant.insights) {
        setAiInsights(selectedInfant.insights)
      } else {
        // Fetch new insights if none exist
        fetchAIInsights()
      }
      
      // Set chat history if available
      if (selectedInfant.chatHistory) {
        setChatHistory(selectedInfant.chatHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })))
      }
    }
  }, [selectedInfant])

  const fetchAIInsights = async () => {
    if (!selectedInfant) return
    
    setInsightsLoading(true)
    setInsightsError(null)
    
    try {
      console.log('Fetching AI insights for infant:', selectedInfant._id)
      const response = await aiAPI.getInsights(selectedInfant._id)
      console.log('Received AI insights response:', response)
      setAiInsights(response.data.data.insights)
    } catch (err: any) {
      console.error('Error fetching AI insights:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.message || err.message || t('failed_to_load_ai_insights') || 'Failed to load AI insights'
      setInsightsError(errorMessage)
    } finally {
      setInsightsLoading(false)
    }
  }

  const fetchChatHistory = async () => {
    if (!selectedInfant) return
    
    try {
      const response = await aiAPI.getChatHistory(selectedInfant._id)
      setChatHistory(response.data.data.chatHistory)
    } catch (err: any) {
      console.error('Error fetching chat history:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedInfant || chatLoading) return
    
    // Add user message to chat
    const newUserMessage = { role: 'user', content: chatMessage }
    const updatedHistory = [...chatHistory, newUserMessage]
    setChatHistory(updatedHistory)
    setChatMessage('')
    setChatLoading(true)
    setChatError(null)
    
    try {
      const response = await aiAPI.chatWithAI(selectedInfant._id, chatMessage)
      const newAIMessage = { role: 'assistant', content: response.data.data.response }
      const finalHistory = [...updatedHistory, newAIMessage]
      setChatHistory(finalHistory)
    } catch (error: any) {
      console.error('Error chatting with AI:', error)
      // Extract more detailed error message from the response
      let errorMessage = t('failed_to_get_ai_response') || 'Failed to get response from AI'
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      setChatError(errorMessage)
      // Remove the user message if AI failed to respond
      setChatHistory(updatedHistory)
    } finally {
      setChatLoading(false)
    }
  }

  const handleRegenerateInsights = async () => {
    if (!selectedInfant) return
    
    setInsightsLoading(true)
    setInsightsError(null)
    
    try {
      const response = await aiAPI.regenerateInsights(selectedInfant._id)
      setAiInsights(response.data.data.insights)
    } catch (err: any) {
      console.error('Error regenerating AI insights:', err)
      console.error('Error response:', err.response)
      const errorMessage = err.response?.data?.message || err.message || t('failed_to_regenerate_ai_insights') || 'Failed to regenerate AI insights'
      setInsightsError(errorMessage)
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleAddRoutine = async (routine: string) => {
    try {
      if (!selectedInfant) {
        alert('No infant selected');
        return;
      }
      
      // Truncate routine name if it's too long (max 100 characters)
      const routineName = routine.length > 100 ? routine.substring(0, 97) + '...' : routine;
      
      // Create a personalized routine based on the AI suggestion
      const routineData = {
        infantId: selectedInfant._id,
        name: routineName,
        description: `Personalized routine for ${selectedInfant.name} based on AI insights`,
        category: 'personalized'
      };
      
      const response = await routinesAPI.createPersonalizedRoutine(routineData);
      
      if (response.data.success) {
        alert(`Successfully added routine: "${routineName}" to your personalized routine list.`);
        // Refresh the infant data to include the new routine
        fetchInfant(params.id);
      } else {
        alert(`Failed to add routine: ${response.data.message || 'Please try again.'}`);
      }
    } catch (error: any) {
      console.error('Error adding routine:', error);
      let errorMessage = 'Failed to add routine. Please try again.';
      
      // Extract more detailed error message from the response
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                {t('developmental_insights')}
              </div>
              <Button 
                onClick={handleRegenerateInsights}
                variant="outline"
                size="sm"
                disabled={insightsLoading}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${insightsLoading ? 'animate-spin' : ''}`} />
                {t('regenerate')}
              </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                      {t('development_summary')}
                    </h3>
                    <p className="mb-4 text-gray-700">{aiInsights.development_summary}</p>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-green-500" />
                      {t('strengths')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.strengths && aiInsights.strengths.length > 0 ? (
                        aiInsights.strengths.map((strength: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700">{strength}</li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_strengths_identified')}</li>
                      )}
                    </ul>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-purple-500" />
                      {t('possible_delays')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.possible_delays && aiInsights.possible_delays.length > 0 ? (
                        aiInsights.possible_delays.map((delay: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700">{delay}</li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_delays_identified')}</li>
                      )}
                    </ul>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-teal-500" />
                      {t('nutrition_insights')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.nutrition_insights && aiInsights.nutrition_insights.length > 0 ? (
                        aiInsights.nutrition_insights.map((insight: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700">{insight}</li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_nutrition_insights_available')}</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                      {t('growth_analysis')}
                    </h3>
                    <p className="mb-4 text-gray-700">{aiInsights.growth_analysis}</p>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-indigo-500" />
                      {t('recommended_upcoming_milestones')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.recommended_upcoming_milestones && aiInsights.recommended_upcoming_milestones.length > 0 ? (
                        aiInsights.recommended_upcoming_milestones.map((milestone: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700">{milestone}</li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_milestones_recommended')}</li>
                      )}
                    </ul>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-teal-500" />
                      {t('suggested_routines')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.suggested_routines && aiInsights.suggested_routines.length > 0 ? (
                        aiInsights.suggested_routines.map((routine: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700 flex justify-between items-start">
                            <span>{routine}</span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="ml-2 flex-shrink-0"
                              onClick={() => handleAddRoutine(routine)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_new_routines_suggested')}</li>
                      )}
                    </ul>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-500" />
                      {t('eligible_schemes')}
                    </h3>
                    <ul className="list-disc pl-5 mb-4">
                      {aiInsights.eligible_schemes && aiInsights.eligible_schemes.length > 0 ? (
                        aiInsights.eligible_schemes.map((scheme: string, index: number) => (
                          <li key={index} className="mb-1 text-gray-700">{scheme}</li>
                        ))
                      ) : (
                        <li className="text-gray-700">{t('no_eligible_schemes')}</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-orange-500" />
                    {t('parenting_recommendations')}
                  </h3>
                  <ul className="list-disc pl-5 mb-4">
                    {aiInsights.parenting_recommendations && aiInsights.parenting_recommendations.length > 0 ? (
                      aiInsights.parenting_recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="mb-1 text-gray-700">{recommendation}</li>
                      ))
                    ) : (
                      <li className="text-gray-700">{t('no_recommendations_available')}</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">{t('no_insights_available')}</p>
                <Button 
                  onClick={fetchAIInsights} 
                  className="mt-4"
                  variant="outline"
                >
                  {t('generate_insights')}
                </Button>
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
                          className={`max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                          dangerouslySetInnerHTML={{ 
                            __html: message.role === 'assistant' 
                              ? formatAIResponse(message.content) 
                              : message.content.replace(/\n/g, '<br />')
                          }}
                        >
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-lg bg-gray-200 text-gray-800">
                          <div className="flex items-center">
                            <Loader className="h-4 w-4 animate-spin mr-1" />
                            {t('thinking')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Chat Error */}
              {chatError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-red-800 text-sm">{chatError}</p>
                </div>
              )}
              
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
                    disabled={!selectedInfant || chatLoading}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  className="ml-2"
                  disabled={!chatMessage.trim() || !selectedInfant || chatLoading}
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