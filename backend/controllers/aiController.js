const { GoogleGenerativeAI } = require('@google/generative-ai');
const Infant = require('../models/Infant');
const Milestone = require('../models/Milestone');
const Growth = require('../models/Growth');

// @desc    Get AI insights for an infant
// @route   POST /api/ai/insights/:infantId
// @access  Private
exports.getAIInsights = async (req, res) => {
  try {
    const { infantId } = req.params;
    
    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
    const infant = await Infant.findOne({
      _id: infantId,
      'parents.user': req.user.id,
      isActive: true
    })
    .populate('milestones.milestoneId', 'name category description recommendedAge minMonths maxMonths');

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    // Get growth data for the infant
    const growthData = await Growth.find({ infant: infantId }).sort({ date: 1 });

    // Get all milestones with their status for this infant
    const milestonesWithStatus = infant.milestones.map(milestoneObj => ({
      ...milestoneObj.milestoneId.toObject(),
      status: milestoneObj.status
    }));

    // Prepare data for AI prompt
    const infantData = {
      name: infant.name,
      dateOfBirth: infant.dateOfBirth,
      gender: infant.gender,
      ageInMonths: infant.ageInMonths,
      birthWeight: infant.birthWeight,
      birthLength: infant.birthLength,
      birthHeadCircumference: infant.birthHeadCircumference,
      currentHeight: infant.currentHeight,
      currentWeight: infant.currentWeight,
      currentHeadCircumference: infant.currentHeadCircumference,
      medicalInfo: infant.medicalInfo,
      growthData: growthData.map(g => ({
        date: g.date,
        height: g.height,
        weight: g.weight,
        headCircumference: g.headCircumference
      })),
      milestones: milestonesWithStatus
    };

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for Gemini
    const prompt = `
      You are an expert infant development specialist and pediatrician. Analyze the following infant data and provide personalized insights and recommendations.
      
      Infant Data:
      Name: ${infantData.name}
      Age: ${infantData.ageInMonths} months old
      Gender: ${infantData.gender}
      Birth Weight: ${infantData.birthWeight} kg
      Birth Length: ${infantData.birthLength} cm
      Birth Head Circumference: ${infantData.birthHeadCircumference} cm
      Current Height: ${infantData.currentHeight} cm
      Current Weight: ${infantData.currentWeight} kg
      Current Head Circumference: ${infantData.currentHeadCircumference} cm
      
      Medical Information:
      ${infantData.medicalInfo ? JSON.stringify(infantData.medicalInfo, null, 2) : 'No medical information provided'}
      
      Growth Data (chronological):
      ${infantData.growthData.length > 0 ? 
        infantData.growthData.map(g => 
          `Date: ${new Date(g.date).toLocaleDateString()}, Height: ${g.height || 'N/A'} cm, Weight: ${g.weight || 'N/A'} kg, Head Circumference: ${g.headCircumference || 'N/A'} cm`
        ).join('\n') : 
        'No growth measurements recorded'}
      
      Milestones (with status):
      ${infantData.milestones.map(m => 
        `${m.name} (${m.category}): ${m.status} - Recommended Age: ${m.recommendedAge}`
      ).join('\n')}
      
      Please provide:
      1. Developmental assessment based on age and milestones achieved
      2. Growth analysis comparing current measurements to birth values and WHO standards
      3. Personalized recommendations for activities and support
      4. Any areas of concern that warrant attention
      5. Positive reinforcement for achievements
      
      Format your response in clear sections with actionable advice. Keep the response concise but informative.
    `;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiInsights = response.text();

    res.status(200).json({
      success: true,
      data: {
        insights: aiInsights,
        infantData: infantData
      }
    });
  } catch (error) {
    console.error('AI Insights error:', error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    
    // Handle Gemini API errors
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error. Please contact support.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while generating AI insights'
    });
  }
};

// @desc    Chat with AI about infant development
// @route   POST /api/ai/chat/:infantId
// @access  Private
exports.chatWithAI = async (req, res) => {
  try {
    const { infantId } = req.params;
    const { message } = req.body;
    
    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
    const infant = await Infant.findOne({
      _id: infantId,
      'parents.user': req.user.id,
      isActive: true
    })
    .populate('milestones.milestoneId', 'name category description recommendedAge minMonths maxMonths');

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    // Get growth data for the infant
    const growthData = await Growth.find({ infant: infantId }).sort({ date: 1 });

    // Get all milestones with their status for this infant
    const milestonesWithStatus = infant.milestones.map(milestoneObj => ({
      ...milestoneObj.milestoneId.toObject(),
      status: milestoneObj.status
    }));

    // Prepare data for AI prompt
    const infantData = {
      name: infant.name,
      dateOfBirth: infant.dateOfBirth,
      gender: infant.gender,
      ageInMonths: infant.ageInMonths,
      birthWeight: infant.birthWeight,
      birthLength: infant.birthLength,
      birthHeadCircumference: infant.birthHeadCircumference,
      currentHeight: infant.currentHeight,
      currentWeight: infant.currentWeight,
      currentHeadCircumference: infant.currentHeadCircumference,
      medicalInfo: infant.medicalInfo,
      growthData: growthData.map(g => ({
        date: g.date,
        height: g.height,
        weight: g.weight,
        headCircumference: g.headCircumference
      })),
      milestones: milestonesWithStatus
    };

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for Gemini chat
    const prompt = `
      You are an expert infant development specialist and pediatrician having a conversation with a parent about their infant.
      
      Infant Data:
      Name: ${infantData.name}
      Age: ${infantData.ageInMonths} months old
      Gender: ${infantData.gender}
      Birth Weight: ${infantData.birthWeight} kg
      Birth Length: ${infantData.birthLength} cm
      Birth Head Circumference: ${infantData.birthHeadCircumference} cm
      Current Height: ${infantData.currentHeight} cm
      Current Weight: ${infantData.currentWeight} kg
      Current Head Circumference: ${infantData.currentHeadCircumference} cm
      
      Medical Information:
      ${infantData.medicalInfo ? JSON.stringify(infantData.medicalInfo, null, 2) : 'No medical information provided'}
      
      Growth Data (chronological):
      ${infantData.growthData.length > 0 ? 
        infantData.growthData.map(g => 
          `Date: ${new Date(g.date).toLocaleDateString()}, Height: ${g.height || 'N/A'} cm, Weight: ${g.weight || 'N/A'} kg, Head Circumference: ${g.headCircumference || 'N/A'} cm`
        ).join('\n') : 
        'No growth measurements recorded'}
      
      Milestones (with status):
      ${infantData.milestones.map(m => 
        `${m.name} (${m.category}): ${m.status} - Recommended Age: ${m.recommendedAge}`
      ).join('\n')}
      
      Parent's Question: ${message}
      
      Please provide a helpful, evidence-based response to the parent's question considering all the infant data provided.
      Keep your response conversational, supportive, and focused on the specific question asked.
    `;

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse
      }
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    
    // Handle specific error cases
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    
    // Handle Gemini API errors
    if (error.message && error.message.includes('API_KEY')) {
      return res.status(500).json({
        success: false,
        message: 'AI service configuration error. Please contact support.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while chatting with AI'
    });
  }
};