const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scheme = require('../models/Scheme');
const Infant = require('../models/Infant');
const Growth = require('../models/Growth');

// @desc    Process query for the AI Assistant
// @route   POST /api/assistant/chat
// @access  Private
exports.processAssistantQuery = async (req, res) => {
  try {
    const { message, language = 'en', infantId, history = [], location } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const schemes = await Scheme.find({});
    const schemesKnowledgeBase = schemes.map((s, index) => `[SCHEME ${index + 1}: ${s.Name}]\n- TYPE: ${s.Type || 'Health/Financial'}\n- ELIGIBILITY: ${s['Eligibility / Target Group']}\n- BENEFITS: ${s.Benefits}\n- OBJECTIVE: ${s.Objective}\n- DETAILS: ${s.Description}\n-------------------`).join('\n');

    let infantContext = null;
    if (infantId) {
      const infant = await Infant.findById(infantId);
      if (infant) {
        infantContext = {
          name: infant.name,
          ageInMonths: infant.ageInMonths,
          gender: infant.gender,
          currentWeight: infant.currentWeight,
          weightTrend: 'stable'
        };
        const latestGrowth = await Growth.find({ infant: infantId }).sort({ date: -1 }).limit(2);
        if (latestGrowth.length >= 2) {
          infantContext.weightTrend = latestGrowth[0].weight > latestGrowth[1].weight ? 'increasing' : 'stable/decreasing';
        }
      }
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const fs = require('fs');
    const logFile = 'assistant_debug.log';

    const lowerMsg = message.toLowerCase();
    const hasTamilScript = /[\u0B80-\u0BFF]/.test(message);
    const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(message);
    let targetLang = 'en';
    if (hasTamilScript || lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) targetLang = 'ta';
    else if (hasMalayalamScript || lowerMsg.includes('malayalam') || lowerMsg.includes('മലയാളം')) targetLang = 'ml';
    else if (lowerMsg.includes('english') || lowerMsg.includes('ஆங்கிலம்')) targetLang = 'en';
    else targetLang = language;

    const isTamil = targetLang === 'ta';
    const isMalayalam = targetLang === 'ml';

    const prompt = `
      You are "FirstSteps Assistant", an advanced, empathetic, and highly personalized AI expert acting just like ChatGPT, but specialized in infant development, baby care, health, vaccinations, nearby hospitals, and government schemes.
      
      Language Requirement: YOU MUST RESPOND COMPLETELY IN ${targetLang === 'ta' ? 'TAMIL' : targetLang === 'ml' ? 'MALAYALAM' : 'ENGLISH'}. If the user asked you to answer in a specific language in their message, you MUST strictly switch to that language.
      
      Current User Context:
      Baby: ${infantContext ? `${infantContext.name}, ${infantContext.ageInMonths} months, ${infantContext.currentWeight}kg` : 'No baby data provided by user currently'}.
      Available Government Schemes: ${schemesKnowledgeBase}
      Location Provided: ${location ? `Latitude ${location.lat}, Longitude ${location.lng}` : 'No exact GPS location provided.'}
      
      User Query: "${message}"
      
      Instructions: 
      1. Act as a personal, caring, and highly knowledgeable agent. Answer ALL questions the user has about baby care, health, developmental milestones, vaccinations, or hospitals completely and accurately.
      2. Provide deeply personalized answers using the baby's data (like their name and weight) if applicable to the question.
      3. If they ask about government schemes, financial support, or money, perfectly utilize the provided Knowledge Base to give exact scheme details.
      4. Avoid long unbroken paragraphs. Break the information down into clear, catchy bullet points for easy reading, especially for vaccination details or medical lists.
      5. IF the user asks about nearby hospitals, vaccinations, clinics, or doctors AND Location Provided is present: Give a brief, supportive summary and inform them that an interactive Google Map link is provided below to find the nearest facilities.
    `;

    // Dynamic Google Maps Generation
    let mapsUrl = null;
    const isHospitalQuery = ['hospital', 'clinic', 'doctor', 'மருத்துவமனை', 'ஆஸ்பத்திரி', 'ആശുപത്രി', 'nearby', 'specialized', 'pediatrician'].some(k => lowerMsg.includes(k));
    const isVaccineQueryForMap = ['vaccine', 'vaccination', 'injection', 'தடுப்பூசி', 'ஊசி', 'വാക്സിൻ'].some(k => lowerMsg.includes(k));
    
    if ((isHospitalQuery || isVaccineQueryForMap) && location && location.lat && location.lng) {
      if (isVaccineQueryForMap) {
        mapsUrl = `https://www.google.com/maps/search/vaccination+centers+and+primary+health+clinics+around+me/@${location.lat},${location.lng},14z`;
      } else {
        mapsUrl = `https://www.google.com/maps/search/pediatric+hospitals+around+me/@${location.lat},${location.lng},14z`;
      }
    }

    // Retry helper for transient 503/429 errors
    const callGemini = async (prompt, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (err) {
          const is503 = err.message.includes('503');
          const is429 = err.message.includes('429');
          if ((is503 || is429) && attempt < maxRetries) {
            console.log(`Gemini attempt ${attempt} failed (${is503 ? '503' : '429'}), retrying in 3s...`);
            await new Promise(r => setTimeout(r, 3000));
          } else {
            throw err;
          }
        }
      }
    };

    let aiText;
    try {
      aiText = await callGemini(prompt);
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] AI Success\n`);
    } catch (apiError) {
      console.error('AI Error:', apiError.message);
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] AI FAILED: ${apiError.message.substring(0, 80)}\n`);
      const lowerMsgTrim = lowerMsg.trim();
      const isGreeting = ['hi', 'hai', 'hello', 'hey'].some(g => lowerMsgTrim.includes(g));
      const hasTamilHealth = ['குழந்தை', 'நலன்', 'காய்ச்சல்', 'சளி', 'எடை'].some(k => lowerMsgTrim.includes(k));
      const hasMalayalamHealth = ['കുട്ടി', 'ആരോഗ്യം', 'പനി'].some(k => lowerMsgTrim.includes(k));
      const isHealthQuery = ['health', 'problem', 'sick', 'fever', 'cold', 'weight', 'growth', 'baby', 'doctor'].some(k => lowerMsgTrim.includes(k)) || hasTamilHealth || hasMalayalamHealth;
      
      const isHospitalQuery = ['hospital', 'clinic', 'மருத்துவமனை', 'ஆஸ்பத்திரி', 'ആശുപത്രി'].some(k => lowerMsgTrim.includes(k));
      const isVaccineQuery = ['vaccine', 'vaccination', 'injection', 'தடுப்பூசி', 'ஊசி', 'വാക്സിൻ'].some(k => lowerMsgTrim.includes(k));
      const isLanguageSwitch = ['tamil', 'தமிழ்', 'malayalam', 'മലയാളം', 'english', 'language', 'translate'].some(k => lowerMsgTrim.includes(k));
      
      if (isGreeting) {
        if (isTamil) aiText = `\u0BB5\u0BA3\u0B95\u0BCD\u0B95\u0BAE\u0BCD! \u0BA8\u0BBE\u0BA9\u0BCD \u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B8E\u0BAA\u0BCD\u0BAA\u0B9F\u0BBF \u0B89\u0BA4\u0BB5 \u0BAE\u0BC1\u0B9F\u0BBF\u0BAF\u0BC1\u0BAE\u0BCD?`;
        else if (isMalayalam) aiText = `\u0D39\u0D32\u0D4B! \u0D07\u0D28\u0D4D\u0D28\u0D4D \u0D0E\u0D28\u0D3F\u0D15\u0D4D\u0D15\u0D4D \u0D0E\u0D19\u0D4D\u0D19\u0D28\u0D46 \u0D38\u0D39\u0D3E\u0D2F\u0D3F\u0D15\u0D4D\u0D15\u0D3E\u0D7B \u0D15\u0D34\u0D3F\u0D2F\u0D41\u0D02?`;
        else aiText = `Hello! How can I help you today?`;
      } else if (isLanguageSwitch) {
        aiText = isTamil
          ? `நிச்சயமாக, நான் இனி தமிழில் பதிலளிக்கிறேன். உங்கள் கேள்வியை (உதாரணமாக: "அரசு திட்டங்கள்" அல்லது "குழந்தை நலன்") கேட்கவும்.`
          : isMalayalam
          ? `തീർച്ചയായും, ഞാൻ ഇനി മലയാളത്തിൽ മറുപടി നൽകാം. നിങ്ങളുടെ ചോദ്യം ചോദിക്കുക.`
          : `Sure, I will respond in English. Please ask your question (e.g., about schemes or health).`;
      } else if (isVaccineQuery) {
        aiText = isTamil
          ? `தடுப்பூசி அட்டவணை மற்றும் விவரங்களை அறிய, அருகிலுள்ள ஆரம்ப சுகாதார நிலையத்தை அல்லது உங்கள் மருத்துவரை அணுகவும்.`
          : isMalayalam
          ? `വാക്സിനേഷൻ വിവരങ്ങൾക്കായി അടുത്തുള്ള ആരോഗ്യ കേന്ദ്രവുമായി ബന്ധപ്പെടുക.`
          : `For vaccination schedules and details, please refer to your local health center or consult your pediatrician tightly.`;
      } else if (isHospitalQuery) {
        aiText = isTamil
          ? `அருகிலுள்ள மருத்துவமனைகள் அல்லது அவசர உதவிக்கு, தயவுசெய்து உங்கள் ஊரில் உள்ள அரசு ஆரம்ப சுகாதார நிலையம் அல்லது 108 என்ற எண்ணை தொடர்பு கொள்ளவும்.`
          : isMalayalam
          ? `അടുത്തുള്ള ആശുപത്രികൾക്കായി നിങ്ങളുടെ അടുത്തുള്ള ആരോഗ്യ കേന്ദ്രത്തെ സമീപിക്കുകയോ ഹെൽപ്പ് ലൈനിൽ വിളിക്കുകയോ ചെയ്യുക.`
          : `For nearby hospitals or urgent medical care, please search your local area directly or contact emergency services if needed.`;
      } else if (isHealthQuery) {
        if (infantContext && infantContext.currentWeight) {
          aiText = isTamil
            ? `உங்கள் குழந்தையான ${infantContext.name}-ன் தற்போதைய எடை ${infantContext.currentWeight}kg. எடை ${infantContext.weightTrend == 'increasing' ? 'சரியாக கூடி வருகிறது' : 'சற்று குறைவாக இருக்கலாம்'}. உடல்நலக் குறைவு ஏதேனும் இருந்தால் அருகில் உள்ள மருத்துவரை அணுகுவது நல்லது.`
            : `Based on my records, ${infantContext.name}'s current weight is ${infantContext.currentWeight}kg and the trend is ${infantContext.weightTrend}. Please monitor your baby closely, keep them hydrated, and visit a pediatrician if you observe persistent symptoms or fever.`;
        } else {
          aiText = isTamil
            ? `குழந்தையின் உடல்நலம் பற்றி கேட்டதற்கு நன்றி. காய்ச்சல் அல்லது சளி போன்ற அறிகுறிகள் தொடர்ந்து இருந்தால், தயவுசெய்து உங்கள் அருகில் உள்ள மருத்துவரை அணுகுவது சிறந்தது.`
            : `For general infant health issues, it is always recommended to ensure they stay well-hydrated, monitor your temperature, and consult a pediatrician directly if symptoms like cold or fever persist.`;
        }
      } else {
        // Smart local fallback: search schemes
        let matchedSchemes = schemes.filter(s =>
          lowerMsgTrim.includes('scheme') || lowerMsgTrim.includes('government') ||
          lowerMsgTrim.includes('money') || lowerMsgTrim.includes('\u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD') || lowerMsgTrim.includes('\u0B85\u0BB0\u0B9A\u0BC1')
        );
        if (matchedSchemes.length > 0) {
          const schemeList = matchedSchemes.slice(0, 3).map(s => `\u2022 ${s.Name}: ${s.Benefits}`).join('\n');
          aiText = isTamil
            ? `\u0B85\u0BB0\u0B9A\u0BC1 \u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD:\n${schemeList}\n\n\u0BAE\u0BC7\u0BB2\u0BC1\u0BAE\u0BCD \u0BB5\u0BBF\u0BB5\u0BB0\u0B99\u0BCD\u0B95\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BC1 \u0B95\u0BC1\u0BB1\u0BBF\u0BAA\u0BCD\u0BAA\u0BBF\u0B9F\u0BCD\u0B9F \u0BA4\u0BBF\u0B9F\u0BCD\u0B9F\u0BA4\u0BCD\u0BA4\u0BC8 \u0B95\u0BC7\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.`
            : `Here are some government schemes:\n${schemeList}\n\nAsk about a specific scheme for more details.`;
        } else {
          aiText = isTamil
            ? `\u0BAE\u0BA9\u0BCD\u0BA9\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD, AI \u0B9A\u0BC7\u0BB5\u0BC8 \u0BA4\u0BB1\u0BCD\u0BAA\u0BCB\u0BA4\u0BC1 \u0BAA\u0BBF\u0B9A\u0BBF\u0BAF\u0BBE\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA4\u0BC1. \u0B9A\u0BBF\u0BB1\u0BBF\u0BA4\u0BC1 \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD \u0B95\u0BB4\u0BBF\u0BA4\u0BCD\u0BA4\u0BC1 \u0BAE\u0BC0\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD \u0BAE\u0BC1\u0BAF\u0BB1\u0BCD\u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD.`
            : `I'm sorry, the AI service is currently busy. Please try again in a moment.`;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: { response: aiText, language: targetLang, mapsUrl }
    });
  } catch (error) {
    console.error('AI Assistant Critical Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
