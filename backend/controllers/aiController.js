'use strict';

const Infant = require('../models/Infant');
const Milestone = require('../models/Milestone');
const Routine = require('../models/Routine');
const Scheme = require('../models/Scheme');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateTextWithModelFallback, getModelChain } = require('../utils/geminiFallback');

// Global variables to store common data and LLM instance
let commonData = null;
let genAI = null;
let model = null; // primary model handle (first in fallback chain); calls use full fallback

// Initialize LLM and load common data
const initializeAI = async () => {
  try {
    console.log('Initializing AI service...');
    
    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found. AI features will be disabled.');
      return;
    }
    
    // Initialize Google Generative AI (runtime calls use multi-model fallback)
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const primaryModel = getModelChain()[0];
    model = genAI.getGenerativeModel({ model: primaryModel });
    console.log(`AI initialized (primary Gemini model: ${primaryModel}; fallback chain enabled)`);
    
    // Load common data from MongoDB
    console.log('Loading common data...');
    const milestones = await Milestone.find({});
    const routines = await Routine.find({ isPersonalized: { $ne: true } }); // Only get non-personalized routines
    const schemes = await Scheme.find({});
    // Store in memory
    commonData = {
      milestones,
      routines,
      schemes
    };
    
    console.log('AI service initialized successfully with common data loaded.');
  } catch (error) {
    console.error('Failed to initialize AI service:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

// Get common data (for internal use)
const getCommonData = () => {
  return commonData;
};

// Helper function to check if insights exist and are complete
const hasValidInsights = (insights) => {
  // Check if insights object exists and has content
  if (!insights) return false;
  
  // Check if insights is an object with at least one non-empty field
  if (typeof insights !== 'object' || Array.isArray(insights)) return false;
  
  // Check if any of the required fields have content
  const hasContent = insights.development_summary || 
                    (insights.strengths && insights.strengths.length > 0) ||
                    (insights.possible_delays && insights.possible_delays.length > 0) ||
                    (insights.recommended_upcoming_milestones && insights.recommended_upcoming_milestones.length > 0);
  
  return hasContent;
};

// Generate developmental insights
const getAIInsights = async (req, res) => {
  try {
    const { infantId } = req.params;
    console.log(`Generating insights for infant ID: ${infantId}`);
    
    // Check if AI is initialized
    if (!model || !commonData) {
      console.log('AI service not initialized');
      return res.status(503).json({
        success: false,
        message: 'AI service not available'
      });
    }
    
    // Fetch infant data with populated references
    const infant = await Infant.findById(infantId)
      .populate('milestones.milestoneId')
      .populate('parents.user', 'name email');
    
    if (!infant) {
      console.log(`Infant not found with ID: ${infantId}`);
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }
    
    console.log(`Found infant: ${infant.name}`);
    
    // Check if valid insights already exist
    if (hasValidInsights(infant.insights)) {
      console.log('Valid insights already exist, returning them');
      return res.status(200).json({
        success: true,
        data: {
          insights: infant.insights
        }
      });
    }
    
    console.log('No valid insights found, generating new ones');
    
    // Generate new insights
    const insights = await generateInsightsForInfant(infant);
    
    // Save insights to the infant document
    infant.insights = insights;
    await infant.save();
    
    console.log('Insights saved successfully');
    
    res.status(200).json({
      success: true,
      data: {
        insights
      }
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
};

// Regenerate insights
const regenerateInsights = async (req, res) => {
  try {
    const { infantId } = req.params;
    console.log(`Regenerating insights for infant ID: ${infantId}`);
    
    // Check if AI is initialized
    if (!model || !commonData) {
      console.log('AI service not initialized');
      return res.status(503).json({
        success: false,
        message: 'AI service not available'
      });
    }
    
    // Fetch infant data with populated references
    const infant = await Infant.findById(infantId)
      .populate('milestones.milestoneId')
      .populate('parents.user', 'name email');
    
    if (!infant) {
      console.log(`Infant not found with ID: ${infantId}`);
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }
    
    console.log(`Found infant: ${infant.name}`);
    
    // Generate new insights (regardless of existing insights)
    const insights = await generateInsightsForInfant(infant);
    
    // Save insights to the infant document
    infant.insights = insights;
    await infant.save();
    
    console.log('Insights regenerated and saved successfully');
    
    res.status(200).json({
      success: true,
      data: {
        insights
      }
    });
  } catch (error) {
    console.error('Error regenerating AI insights:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate insights',
      error: error.message
    });
  }
};

// Helper function to generate insights for an infant
const generateInsightsForInfant = async (infant) => {
  try {
    console.log(`Generating insights for infant: ${infant.name}`);
    
    // Get personalized routines for this infant
    const personalizedRoutines = await Routine.find({
      isPersonalized: true,
      infantId: infant._id
    });
    
    // Prepare prompt with infant data and common data
    const prompt = `
      You are an expert in infant development and nutrition. Based on the following information about an infant, 
      provide personalized developmental insights and recommendations.
      
      Infant Information:
      Name: ${infant.name}
      Age: ${infant.ageInMonths} months (${infant.ageInDays} days)
      Gender: ${infant.gender}
      Birth Weight: ${infant.birthWeight} kg
      Birth Length: ${infant.birthLength} cm
      Birth Head Circumference: ${infant.birthHeadCircumference} cm
      Current Weight: ${infant.currentWeight} kg
      Current Height: ${infant.currentHeight} cm
      Current Head Circumference: ${infant.currentHeadCircumference} cm
      
      Medical Information:
      Blood Type: ${infant.medicalInfo.bloodType || 'Not provided'}
      Allergies: ${infant.medicalInfo.allergies?.join(', ') || 'None reported'}
      Medications: ${infant.medicalInfo.medications?.join(', ') || 'None'}
      Conditions: ${infant.medicalInfo.conditions?.join(', ') || 'None'}
      
      Milestone Progress:
      ${infant.milestones.map(m => {
        const milestone = m.milestoneId;
        return `${milestone?.name || 'Unknown'}: ${m.status}`;
      }).join('\n')}
      
      Growth Data:
      ${infant.growthData && infant.growthData.map(g => {
        return `Date: ${g.date}, Weight: ${g.weight}kg, Height: ${g.height}cm, Head Circumference: ${g.headCircumference}cm`;
      }).join('\n') || 'No growth data available'}
      
      Available Milestones (${commonData.milestones.length} total):
      ${commonData.milestones.map(m => {
        return `${m.name} (${m.category}, ${m.minMonths}-${m.maxMonths} months): ${m.description}`;
      }).join('\n')}
      
      Available Routines (${commonData.routines.length} total):
      ${commonData.routines.map(r => {
        return `${r.name} (${r.category}): ${r.description}`;
      }).join('\n')}
      
      Personalized Routines for this Infant (${personalizedRoutines.length} total):
      ${personalizedRoutines.map(r => {
        return `${r.name} (${r.category}): ${r.description}`;
      }).join('\n') || 'No personalized routines'}
      
      Available Government Schemes (${commonData.schemes.length} total):
      ${commonData.schemes.map(s => {
        return `${s.name} (${s.type}, ${s.stateScope}): ${s.description}`;
      }).join('\n')}
      
      Please provide a response in STRICT JSON format with the following structure:
      {
        "development_summary": "Brief summary of overall development",
        "growth_analysis": "Analysis of growth patterns",
        "strengths": ["List of developmental strengths"],
        "possible_delays": ["List of possible developmental delays"],
        "recommended_upcoming_milestones": ["List of milestones to focus on next"],
        "routine_compliance": "Analysis of routine adherence",
        "suggested_routines": ["List of only NEW routines to be added (do not suggest existing routines) each routine must not exceed 80 characters"],
        "eligible_schemes": ["List of government schemes the family might benefit from"],
        "parenting_recommendations": ["List of parenting recommendations"],
        "nutrition_insights": ["List of nutrition-related insights and recommendations"]
      }
      
      Important instructions:
      1. Respond ONLY with valid JSON
      2. Do not include any explanations outside the JSON structure
      3. If information is not available, use empty strings or arrays
      4. Be concise but informative
      5. Use simple language that parents can easily understand
      6. Focus especially on nutrition insights that are age-appropriate
      7. For suggested_routines, ONLY suggest NEW routines that are not already available or personalized for this infant
      8. Don't give more than 10 in the list and list atleast 2 items
    `;
    
    console.log('Sending prompt to Gemini API');
    
    // Generate insights using Google Gemini (tries fallback models on failure)
    const aiResponse = await generateTextWithModelFallback(genAI, {
      userPrompt: prompt,
      maxRetriesPerModel: 3,
    });
    console.log(aiResponse);
    console.log('Received response from Gemini API');
    
    // Parse JSON safely
    let insights;
    try {
      // Extract JSON from potential markdown code blocks
      let jsonString = aiResponse;
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3);
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3);
      }
      insights = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiResponse);
      // Return a default structure if parsing fails
      insights = {
        development_summary: "Unable to generate detailed insights at this time.",
        growth_analysis: "Growth analysis unavailable.",
        strengths: [],
        possible_delays: [],
        recommended_upcoming_milestones: [],
        routine_compliance: "Routine analysis unavailable.",
        suggested_routines: [],
        eligible_schemes: [],
        parenting_recommendations: ["Please try regenerating insights later."],
        nutrition_insights: []
      };
    }
    
    // Ensure suggested_routines and eligible_schemes are always arrays, not null
    if (!insights.suggested_routines || !Array.isArray(insights.suggested_routines)) {
      insights.suggested_routines = [];
    }
    
    if (!insights.eligible_schemes || !Array.isArray(insights.eligible_schemes)) {
      insights.eligible_schemes = [];
    }
    
    // Also ensure all other fields are properly initialized
    if (!insights.development_summary) insights.development_summary = "";
    if (!insights.growth_analysis) insights.growth_analysis = "";
    if (!insights.strengths || !Array.isArray(insights.strengths)) insights.strengths = [];
    if (!insights.possible_delays || !Array.isArray(insights.possible_delays)) insights.possible_delays = [];
    if (!insights.recommended_upcoming_milestones || !Array.isArray(insights.recommended_upcoming_milestones)) insights.recommended_upcoming_milestones = [];
    if (!insights.routine_compliance) insights.routine_compliance = "";
    if (!insights.parenting_recommendations || !Array.isArray(insights.parenting_recommendations)) insights.parenting_recommendations = [];
    if (!insights.nutrition_insights || !Array.isArray(insights.nutrition_insights)) insights.nutrition_insights = [];
    
    console.log('Insights generated successfully');
    return insights;
  } catch (error) {
    console.error('Error in generateInsightsForInfant:', error);
    console.error('Stack trace:', error.stack);
    // Return a default structure if generation fails
    return {
      development_summary: "Unable to generate insights due to an error.",
      growth_analysis: "Growth analysis unavailable.",
      strengths: [],
      possible_delays: [],
      recommended_upcoming_milestones: [],
      routine_compliance: "Routine analysis unavailable.",
      suggested_routines: [],
      eligible_schemes: [],
      parenting_recommendations: ["Please try again later or contact support."],
      nutrition_insights: []
    };
  }
};

// Chat with AI
const chatWithAI = async (req, res) => {
  try {
    const { infantId } = req.params;
    const { message } = req.body;
    
    console.log(`Chat request for infant ID: ${infantId} with message: ${message}`);
    
    // Check if AI is initialized
    if (!model || !commonData) {
      console.log('AI service not initialized');
      return res.status(503).json({
        success: false,
        message: 'AI service not available. Please check the API configuration.'
      });
    }
    
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Fetch infant data with populated references and existing chat history
    const infant = await Infant.findById(infantId)
      .populate('milestones.milestoneId')
      .populate('parents.user', 'name email');
    
    if (!infant) {
      console.log(`Infant not found with ID: ${infantId}`);
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }
    
    console.log(`Found infant: ${infant.name}`);
    
    // Prepare the conversation history
    let conversationHistory = '';
    if (infant.chatHistory && infant.chatHistory.length > 0) {
      conversationHistory = '\nPrevious conversation:\n';
      infant.chatHistory.slice(-5).forEach((msg, index) => { // Only use last 5 messages for context
        conversationHistory += `${msg.role}: ${msg.content}\n`;
      });
    }
    
    // Get personalized routines for this infant
    const personalizedRoutines = await Routine.find({
      isPersonalized: true,
      infantId: infant._id
    });
    
    // Prepare prompt with infant data, common data, and conversation history
    const prompt = `
      You are an expert in infant development, nutrition, and childcare. 
      You are having a conversation with a parent asking about their infant.
      
      Infant Information:
      Name: ${infant.name}
      Age: ${infant.ageInMonths} months (${infant.ageInDays} days)
      Gender: ${infant.gender}
      Birth Weight: ${infant.birthWeight} kg
      Birth Length: ${infant.birthLength} cm
      Birth Head Circumference: ${infant.birthHeadCircumference} cm
      Current Weight: ${infant.currentWeight} kg
      Current Height: ${infant.currentHeight} cm
      Current Head Circumference: ${infant.currentHeadCircumference} cm
      
      Medical Information:
      Blood Type: ${infant.medicalInfo.bloodType || 'Not provided'}
      Allergies: ${infant.medicalInfo.allergies?.join(', ') || 'None reported'}
      Medications: ${infant.medicalInfo.medications?.join(', ') || 'None'}
      Conditions: ${infant.medicalInfo.conditions?.join(', ') || 'None'}
      
      Milestone Progress:
      ${infant.milestones.map(m => {
        const milestone = m.milestoneId;
        return `${milestone?.name || 'Unknown'}: ${m.status}`;
      }).join('\n')}
      
      Growth Data:
      ${infant.growthData && infant.growthData.map(g => {
        return `Date: ${g.date}, Weight: ${g.weight}kg, Height: ${g.height}cm, Head Circumference: ${g.headCircumference}cm`;
      }).join('\n') || 'No growth data available'}
      
      Available Milestones (${commonData.milestones.length} total):
      ${commonData.milestones.map(m => {
        return `${m.name} (${m.category}, ${m.minMonths}-${m.maxMonths} months): ${m.description}`;
      }).join('\n')}
      
      Available Routines (${commonData.routines.length} total):
      ${commonData.routines.map(r => {
        return `${r.name} (${r.category}): ${r.description}`;
      }).join('\n')}
      
      Personalized Routines for this Infant (${personalizedRoutines.length} total):
      ${personalizedRoutines.map(r => {
        return `${r.name} (${r.category}): ${r.description}`;
      }).join('\n') || 'No personalized routines'}
      
      Available Government Schemes (${commonData.schemes.length} total):
      ${commonData.schemes.map(s => {
        return `${s.name} (${s.type}, ${s.stateScope}): ${s.description}`;
      }).join('\n')}
      
      ${conversationHistory}
      
      Parent's Question: ${message}
      
      Please provide a helpful, accurate, and concise response to the parent's question.
      Focus on infant development, health, nutrition, and age-appropriate activities.
      If the question is unrelated to infant care, politely redirect to relevant topics.
      Keep your response under 200 words.
      Do not use markdown formatting in your response.
    `;
    
    console.log('Sending prompt to Gemini API');
    
    // Generate response using Google Gemini (tries fallback models on failure)
    let aiResponse = await generateTextWithModelFallback(genAI, {
      userPrompt: prompt,
      maxRetriesPerModel: 3,
    });
    
    console.log('Received response from Gemini API');
    
    // Clean up the response by removing markdown code blocks if present
    if (aiResponse.startsWith('```json')) {
      aiResponse = aiResponse.substring(7, aiResponse.length - 3);
    } else if (aiResponse.startsWith('```')) {
      aiResponse = aiResponse.substring(3, aiResponse.length - 3);
    }
    
    // Remove extra whitespace
    aiResponse = aiResponse.trim();
    
    // Add the new messages to chat history
    const userMessage = {
      role: 'user',
      content: message
    };
    
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse
    };
    
    // Update chat history in the infant document
    infant.chatHistory.push(userMessage);
    infant.chatHistory.push(assistantMessage);
    
    // Limit chat history to last 20 messages (10 exchanges) to prevent document bloat
    if (infant.chatHistory.length > 20) {
      infant.chatHistory = infant.chatHistory.slice(-20);
    }
    
    await infant.save();
    
    console.log('Chat history updated successfully');
    
    res.status(200).json({
      success: true,
      data: {
        response: aiResponse
      }
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    
    // Provide more specific error messages
    if (error.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'AI model not found. Please check the model configuration.',
        error: error.message
      });
    } else if (error.status === 403) {
      return res.status(403).json({
        success: false,
        message: 'Access to AI service forbidden. Please check your API key.',
        error: error.message
      });
    } else if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        error: error.message
      });
    } else if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message: 'AI service temporarily unavailable. Please try again later.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response. Please try again.',
      error: error.message
    });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  try {
    const { infantId } = req.params;
    
    console.log(`Fetching chat history for infant ID: ${infantId}`);
    
    // Fetch infant data with chat history
    const infant = await Infant.findById(infantId, 'chatHistory');
    
    if (!infant) {
      console.log(`Infant not found with ID: ${infantId}`);
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }
    
    console.log(`Found ${infant.chatHistory ? infant.chatHistory.length : 0} chat messages`);
    
    res.status(200).json({
      success: true,
      data: {
        chatHistory: infant.chatHistory || []
      }
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
};

module.exports = {
  initializeAI,
  getCommonData,
  getAIInsights,
  chatWithAI,
  getChatHistory,
  regenerateInsights
};