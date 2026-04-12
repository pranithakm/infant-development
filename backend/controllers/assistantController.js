const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateTextWithModelFallback } = require('../utils/geminiFallback');
const axios = require('axios');
const Scheme = require('../models/Scheme');
const Infant = require('../models/Infant');
const Growth = require('../models/Growth');

// ---------------------------------------------------------------------------
// Navigation detection — maps keywords to frontend routes
// ---------------------------------------------------------------------------

const NAVIGATION_PATTERNS = [
  { keywords: /\b(scheme|schemes|government|benefits|subsidy|subsidies)\b/i,       route: '/dashboard/schemes',                    infantRoute: null },
  { keywords: /\b(routine|routines|daily routine|schedule|tracker)\b/i,            route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/tracker' },
  { keywords: /\b(growth|growing|weight|height|head circumference|measurements?|gained weight|put on weight|percentile)\b/i, route: '/dashboard', infantRoute: '/dashboard/infants/{id}/growth' },
  { keywords: /\b(milestone|milestones|development|developmental)\b/i,             route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/milestones' },
  { keywords: /\b(insight|insights|ai insight|ai analysis)\b/i,                    route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/insights' },
  { keywords: /\b(calendar|dates?)\b/i,                                            route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/calendar' },
  { keywords: /\b(progress|report|summary|overview)\b/i,                           route: '/dashboard',                            infantRoute: '/dashboard/infants/{id}/progress' },
  { keywords: /\b(dashboard|home|main)\b/i,                                        route: '/dashboard',                            infantRoute: null },
];

const detectNavigation = (question, infantId) => {
  const q = (question || '').toLowerCase();
  for (const pattern of NAVIGATION_PATTERNS) {
    if (pattern.keywords.test(q)) {
      if (infantId && pattern.infantRoute) {
        return pattern.infantRoute.replace('{id}', infantId);
      }
      return pattern.route;
    }
  }
  return null;
};

// ---------------------------------------------------------------------------
// Parse suggested routines from AI response
// ---------------------------------------------------------------------------

const parseSuggestedRoutines = (text) => {
  const match = text.match(/\[SUGGESTED_ROUTINES\]([\s\S]*?)\[\/SUGGESTED_ROUTINES\]/);
  if (!match) return [];

  const lines = match[1].trim().split('\n');
  const routines = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[\s\-•*]+/, '').trim();
    if (!cleaned) continue;
    const parts = cleaned.split('|');
    if (parts.length >= 1 && parts[0].trim()) {
      routines.push({
        name: (parts[0] || '').trim().substring(0, 100),
        description: (parts[1] || '').trim(),
      });
    }
  }
  return routines;
};

/** Strip optional [NAVIGATE:path] hint from model output (used for scheme/page answers). */
const parseNavigateFromResponse = (text) => {
  const m = text.match(/\[NAVIGATE:\s*([^\]\s]+)\s*\]/);
  return m ? m[1].trim() : null;
};

const HEALTH_SYMPTOM_RE =
  /\b(fever|temperature|cold|cough|rash|diarrhea|diarrhoea|vomit|vomiting|teething|ear\s*ache|congestion|dehydration|flu|infection)\b/i;

function formatYmd(d) {
  if (!d) return '—';
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return '—';
  }
}

/**
 * Full infant snapshot for the model (user message) — personalize answers without dumping everything aloud.
 */
function buildInfantDossierText(infant, growthCollectionRows) {
  const lines = [];
  lines.push(`Name: ${infant.name}`);
  lines.push(`Date of birth: ${formatYmd(infant.dateOfBirth)}`);
  lines.push(`Age now: ${infant.ageInMonths} months (${infant.ageInDays} days since birth)`);
  lines.push(`Gender: ${infant.gender}`);
  lines.push(
    `At birth: weight ${infant.birthWeight ?? '—'} kg, length ${infant.birthLength ?? '—'} cm, head ${infant.birthHeadCircumference ?? '—'} cm`
  );
  lines.push(
    `Latest recorded (profile): weight ${infant.currentWeight ?? '—'} kg, height ${infant.currentHeight ?? '—'} cm, head ${infant.currentHeadCircumference ?? '—'} cm`
  );

  const med = infant.medicalInfo || {};
  if (med.bloodType && med.bloodType !== 'Unknown') lines.push(`Blood type: ${med.bloodType}`);
  if (med.allergies?.length) lines.push(`Allergies: ${med.allergies.join(', ')}`);
  if (med.medications?.length) lines.push(`Current medications: ${med.medications.join(', ')}`);
  if (med.conditions?.length) lines.push(`Medical conditions: ${med.conditions.join(', ')}`);

  const gd = (infant.growthData || []).slice(-6);
  if (gd.length) {
    lines.push('Growth history (in profile, oldest→newest of last few):');
    gd.forEach((g) => {
      lines.push(
        `  ${formatYmd(g.date)}: weight ${g.weight ?? '—'} kg, height ${g.height ?? '—'} cm, head ${g.headCircumference ?? '—'} cm`
      );
    });
  }

  if (growthCollectionRows?.length) {
    lines.push('Growth measurements (log, most recent first):');
    growthCollectionRows.forEach((g) => {
      lines.push(
        `  ${formatYmd(g.date)}: weight ${g.weight ?? '—'} kg, height ${g.height ?? '—'} cm, head ${g.headCircumference ?? '—'} cm${g.notes ? ` — note: ${g.notes}` : ''}`
      );
    });
  }

  const ms = infant.milestones || [];
  if (ms.length) {
    lines.push(`Development milestones on file (${ms.length} total, sample):`);
    ms.slice(0, 20).forEach((m) => {
      const ref = m.milestoneId;
      const label = ref && ref.name ? ref.name : 'Milestone';
      lines.push(`  - ${label}: ${m.status}`);
    });
    if (ms.length > 20) lines.push(`  … plus ${ms.length - 20} more milestones in the app`);
  }

  const ins = infant.insights;
  if (ins && typeof ins === 'object') {
    const summaryParts = [];
    if (ins.development_summary) summaryParts.push(String(ins.development_summary).slice(0, 350));
    if (ins.growth_analysis) summaryParts.push(String(ins.growth_analysis).slice(0, 350));
    if (summaryParts.length) {
      lines.push('Prior AI insight summaries (may be outdated):');
      summaryParts.forEach((p) => lines.push(`  ${p}`));
    }
  }

  const cal = (infant.calendarActivities || []).slice(-6);
  if (cal.length) {
    lines.push('Recent calendar entries:');
    cal.forEach((c) => lines.push(`  ${formatYmd(c.date)}: ${c.activity} (${c.type})`));
  }

  return lines.join('\n');
}

function isPureGreetingMessage(message) {
  const t = String(message || '').trim();
  if (t.length > 52) return false;
  if (/\b(fever|cold|cough|rash|pain|hurt|sick|ill|vomit|puke|diarrhea|diarrhoea|temp|temperature|days?|weeks?|hours?|growth|weight|milestone)\b/i.test(t)) {
    return false;
  }
  return /^(hi|hello|hey|hai|hiya|yo|sup|good\s+(morning|afternoon|evening)|namaste|vanakkam|hola)[\s!.,?]*$/i.test(t);
}

// @desc    Process query for the AI Assistant
// @route   POST /api/assistant/chat
// @access  Private
exports.processAssistantQuery = async (req, res) => {
  try {
    const { message, language = 'en', infantId, history = [], location } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // ── Fetch context data ──
    const schemes = await Scheme.find({});
    const schemesKnowledgeBase = schemes.map((s, index) =>
      `[SCHEME ${index + 1}: ${s.Name}]\n- TYPE: ${s.Type || 'Health/Financial'}\n- ELIGIBILITY: ${s['Eligibility / Target Group']}\n- BENEFITS: ${s.Benefits}\n- OBJECTIVE: ${s.Objective}\n- DETAILS: ${s.Description}\n---`
    ).join('\n');

    let infantContext = null;
    let infantDossierText = 'No infant selected — ask the user to select a baby profile for personalized answers.';
    let latestGrowthSamples = [];

    if (infantId) {
      const infant = await Infant.findById(infantId).populate(
        'milestones.milestoneId',
        'name category minMonths maxMonths'
      );
      if (infant) {
        latestGrowthSamples = await Growth.find({ infant: infantId }).sort({ date: -1 }).limit(8).lean();
        const latestTwo = latestGrowthSamples.slice(0, 2);
        let weightTrend = 'stable or unknown';
        if (latestTwo.length >= 2 && latestTwo[0].weight != null && latestTwo[1].weight != null) {
          weightTrend =
            latestTwo[0].weight > latestTwo[1].weight
              ? 'increasing'
              : latestTwo[0].weight < latestTwo[1].weight
                ? 'decreasing'
                : 'stable';
        }
        infantContext = {
          name: infant.name,
          ageInMonths: infant.ageInMonths,
          ageInDays: infant.ageInDays,
          gender: infant.gender,
          currentWeight: infant.currentWeight,
          weightTrend,
        };
        infantDossierText = buildInfantDossierText(infant, latestGrowthSamples);
      }
    }

    // ── Language detection ──
    const lowerMsg = message.toLowerCase();
    const hasTamilScript = /[\u0B80-\u0BFF]/.test(message);
    const hasMalayalamScript = /[\u0D00-\u0D7F]/.test(message);
    let targetLang = 'en';
    if (hasTamilScript || lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) targetLang = 'ta';
    else if (hasMalayalamScript || lowerMsg.includes('malayalam') || lowerMsg.includes('മലയാളം')) targetLang = 'ml';
    else if (lowerMsg.includes('english') || lowerMsg.includes('ஆங்கிலம்')) targetLang = 'en';
    else targetLang = language;

    const langName = targetLang === 'ta' ? 'TAMIL' : targetLang === 'ml' ? 'MALAYALAM' : 'ENGLISH';

    const isHealthSymptomQuestion = HEALTH_SYMPTOM_RE.test(message);
    const growthOrWeightIntent = /\b(weight|growth|height|kg|kilogram|percentile|chart)\b/i.test(message);
    const shortSymptomOnlyFocus =
      isHealthSymptomQuestion &&
      !growthOrWeightIntent &&
      String(message).trim().length < 72;
    const pureGreeting = isPureGreetingMessage(message);
    const prolongedSymptom =
      isHealthSymptomQuestion && /\b\d+\s*(day|days|week|weeks|hour|hours)\b/i.test(message);

    const isHospitalQuery = ['hospital', 'clinic', 'doctor', 'மருத்துவமனை', 'ஆஸ்பத்திரி', 'ആശുപത്രി', 'nearby', 'specialized', 'pediatrician'].some(k => lowerMsg.includes(k));
    const isVaccineQueryForMap = ['vaccine', 'vaccination', 'injection', 'தடுப்பூசி', 'ஊசி', 'വാക്സിൻ'].some(k => lowerMsg.includes(k));

    let reqLat = location?.lat;
    let reqLng = location?.lng;

    // MAGICAL OVERRIDE: Desktop IP geolocation often defaults to Chennai for TN users.
    // If the user explicitly mentions a city, use Nominatim to geocode it dynamically instead of hardcoding.
    const cityMatch = lowerMsg.match(/\b(?:in|near|at|around)\s+([a-zA-Z]{3,}(?:\s+[a-zA-Z]{3,})?)\b/i);
    if (cityMatch) {
      const extractedCity = cityMatch[1].trim();
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(extractedCity)}&format=json&limit=1`;
        const geoRes = await axios.get(geocodeUrl, { timeout: 3000, headers: { 'User-Agent': 'InfantCareApp/1.0' } });
        if (geoRes.data && geoRes.data.length > 0) {
          reqLat = parseFloat(geoRes.data[0].lat);
          reqLng = parseFloat(geoRes.data[0].lon);
        }
      } catch (err) {
        console.warn('Nominatim Geocoding error:', err.message);
      }
    }

    let nearbyHospitalsText = '';
    if ((isHospitalQuery || prolongedSymptom || isVaccineQueryForMap) && reqLat && reqLng) {
      try {
        const overpassQuery = `[out:json];node(around:5000,${reqLat},${reqLng})[amenity=hospital];out 5;`;
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
        const resOverpass = await axios.get(overpassUrl, { timeout: 4000 });
        if (resOverpass.data && resOverpass.data.elements && resOverpass.data.elements.length > 0) {
          const hospitals = resOverpass.data.elements.map(e => {
            const name = e.tags.name || 'Nearby Hospital';
            const phone = e.tags.phone || e.tags['contact:phone'] || 'Phone number not available';
            return `- ${name} (Ph: ${phone})`;
          });
          nearbyHospitalsText = `\n\n=== NEARBY HOSPITALS (from dynamic location search) ===\n${hospitals.join('\n')}\n(Note: Instead of a fake doctor name, use these real hospitals if the user needs pediatric care nearby.)`;
        }
      } catch (err) {
        console.warn('Overpass API error:', err.message);
      }
    }

    const babySummaryLine = infantContext
      ? `${infantContext.name} is ${infantContext.ageInMonths} months old (${infantContext.ageInDays} days), ${infantContext.gender}. Weight trend (from logs): ${infantContext.weightTrend}.`
      : 'No infant profile.';
    const agePhraseForRules = infantContext ? `${infantContext.ageInMonths} months` : 'this child’s age';

    const systemInstruction = `You are "FirstSteps Assistant", an expert in infant and toddler care.

INPUT STRUCTURE
- The user's message includes an "INFANT RECORD" section with everything we store for this baby (growth, milestones, medical notes, insights, calendar). Use it to personalize silently.
- You still answer ONLY what the user asked — do not dump the record back unless they asked for an overview.

CORE BEHAVIOR
- Answer ONLY the user's latest question. No unrelated stats.
- Be concise: short bullets for care topics; no filler; never say "based on my records".
- Unless the turn is a pure greeting, do not open with "Hello!" or "Hi!" — start directly with useful content.
- Respond ONLY in ${langName}. Never mix languages.
- Quick reference: ${babySummaryLine}

GREETINGS (hi / hello / good morning — with NO symptom or topic in the same message)
- Reply in at most TWO short sentences total.
- Warm and friendly; you may use the baby's first name once if the record shows it.
- End with something like asking if they have any concerns or what they'd like help with today.
- Do NOT give medical tips, bullet lists, or fever/care advice unless they asked.

KNOWN AGE — HEALTH & FEVER (CRITICAL)
- The INFANT RECORD states the child's exact age in months and days. You MUST use it.
- For "when to see a doctor" or urgency, write advice for THIS child only (e.g. "At ${agePhraseForRules}, call your pediatrician if …").
- Do NOT use generic if/else age branches such as "if under 3 months … otherwise …" when the age is already known — omit branches that do not apply to this child.
- Mention allergies/conditions from the record only if relevant to the symptom (e.g. medication or allergy-aware care).

PROLONGED SYMPTOMS
- If the user states a duration (e.g. fever for several days), acknowledge it and clearly recommend timely in-person pediatric assessment for this age; still give brief home care if appropriate.

TOPIC LOCK — SYMPTOMS
- For symptom questions: home care + monitoring + when to seek care (personalized). Do NOT mention weight percentiles, growth curves, or milestone progress unless the user asked about those.
- IF nearby hospitals are provided in the LOCATION context below, list them gracefully and suggest the user contacts or visits them for immediate care.

GOVERNMENT SCHEMES
- Use scheme facts only when the user asks about schemes, benefits, eligibility, or a named programme.
- After using the schemes database, add a final line exactly: [NAVIGATE:/dashboard/schemes]

GROWTH / MILESTONES / DEVELOPMENT (when the user asks)
- Give a crisp, personalized summary using the INFANT RECORD (latest measurements, trend, milestone highlights).
- Do not paste raw tables; 3–5 tight bullets maximum unless they asked for detail.

HEALTH SYMPTOMS — ROUTINES BLOCK
- After care bullets and "when to see a doctor", end with EXACTLY (3–4 lines):
[SUGGESTED_ROUTINES]
Routine Name | Brief description
Another Routine | Brief description
[/SUGGESTED_ROUTINES]
- Skip the [SUGGESTED_ROUTINES] block ONLY for pure greetings with no health topic.`;

    const userPrompt = `=== INFANT RECORD (full app data for this child — use to personalize; do not recite wholesale unless asked) ===
${infantDossierText}

=== GOVERNMENT SCHEMES DATABASE (use only if the question is about schemes) ===
${schemesKnowledgeBase}

=== LOCATION ===
${location ? `Latitude ${location.lat}, Longitude ${location.lng}` : 'Not provided.'}${nearbyHospitalsText}

=== CONVERSATION HISTORY ===
${history.slice(-4).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.substring(0, 200)}`).join('\n') || 'None'}

=== USER'S QUESTION ===
"${message}"
${pureGreeting ? '\n(TAG: PURE_GREETING — follow greeting rules only. No medical bullets. No [SUGGESTED_ROUTINES].)\n' : ''}
${prolongedSymptom ? '\n(TAG: USER_STATED_DURATION — factor duration into urgency; age-specific pediatric follow-up.)\n' : ''}
${shortSymptomOnlyFocus ? '\n(TAG: SHORT_SYMPTOM — stay on this symptom only; no weight/growth/milestone trivia.)\n' : ''}`;

    // ── Google Maps URL ──
    let mapsUrl = null;

    if ((isHospitalQuery || isVaccineQueryForMap) && reqLat && reqLng) {
      mapsUrl = isVaccineQueryForMap
        ? `https://www.google.com/maps/search/vaccination+centers+and+primary+health+clinics+around+me/@${reqLat},${reqLng},14z`
        : `https://www.google.com/maps/search/pediatric+hospitals+around+me/@${reqLat},${reqLng},14z`;
    }

    // ── Detect navigation intent ──
    const navigateTo = detectNavigation(message, infantId);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let aiText;
    try {
      aiText = await generateTextWithModelFallback(genAI, {
        userPrompt,
        systemInstruction,
        maxRetriesPerModel: 3,
      });
    } catch (apiError) {
      console.error('AI Error:', apiError.message);
      // Fallback responses based on topic
      const q = lowerMsg.trim();
      const isGreeting = ['hi', 'hai', 'hello', 'hey'].some(g => q.startsWith(g) || q === g);
      const isFever = ['fever', 'temperature', 'காய்ச்சல்', 'പനി'].some(k => q.includes(k));
      const isCold = ['cold', 'cough', 'சளி', 'இருமல்'].some(k => q.includes(k));
      
      if (isGreeting) {
        aiText = targetLang === 'ta' ? 'வணக்கம்! உங்களுக்கு எப்படி உதவ முடியும்?'
               : targetLang === 'ml' ? 'ഹലോ! എങ്ങനെ സഹായിക്കാൻ കഴിയും?'
               : 'Hello! How can I help you today?';
      } else if (isFever) {
        aiText = `Here are some tips for infant fever:\n\n- Keep your baby lightly dressed\n- Offer extra fluids (breast milk/water)\n- Give a lukewarm sponge bath\n- Use age-appropriate fever medication (consult your doctor for dosage)\n\n**When to see a doctor:** If fever exceeds 100.4°F (38°C) for infants under 3 months, or persists more than 24 hours.\n\n[SUGGESTED_ROUTINES]\nTemperature Check Every 2 Hours | Monitor baby's temperature regularly\nExtra Fluids & Hydration | Increase breastfeeding or water intake\nLukewarm Sponge Bath | Gently sponge to reduce fever\n[/SUGGESTED_ROUTINES]`;
      } else if (isCold) {
        aiText = `Tips for managing your baby's cold:\n\n- Use saline nasal drops to clear congestion\n- Keep the room humid with a humidifier\n- Elevate the head slightly during sleep\n- Ensure plenty of fluids\n\n**When to see a doctor:** If breathing becomes labored or symptoms last more than a week.\n\n[SUGGESTED_ROUTINES]\nSaline Drops Every 4 Hours | Clear nasal congestion gently\nSteam Inhalation Before Sleep | Use warm steam to ease breathing\nFluid Tracking | Ensure adequate hydration through the day\n[/SUGGESTED_ROUTINES]`;
      } else {
        aiText = targetLang === 'ta' ? 'மன்னிக்கவும், AI சேவை தற்போது பிசியாக உள்ளது. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
               : 'I\'m sorry, the AI service is currently busy. Please try again in a moment.';
      }
    }

    // ── Parse routines & optional navigate hint from response ──
    let suggestedRoutines = parseSuggestedRoutines(aiText);
    if (pureGreeting) {
      suggestedRoutines = [];
    }
    const navigateFromModel = parseNavigateFromResponse(aiText);
    let cleanResponse = aiText
      .replace(/\[SUGGESTED_ROUTINES\][\s\S]*?\[\/SUGGESTED_ROUTINES\]/g, '')
      .replace(/\[NAVIGATE:\s*[^\]\s]+\s*\]/g, '')
      .trim();

    // If the model cited schemes but forgot the tag, still offer the schemes page when appropriate
    const schemeIntent = /\b(schemes?|pmmvy|pmjay|anganwadi|ayushman|poshan|icds|government schemes?|welfare schemes?)\b/i.test(
      message
    );
    const resolvedNavigate =
      navigateFromModel ||
      navigateTo ||
      (schemeIntent ? '/dashboard/schemes' : null);

    res.status(200).json({
      success: true,
      data: {
        response: cleanResponse,
        language: targetLang,
        mapsUrl,
        navigateTo: resolvedNavigate,
        suggestedRoutines,
      }
    });
  } catch (error) {
    console.error('AI Assistant Critical Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
