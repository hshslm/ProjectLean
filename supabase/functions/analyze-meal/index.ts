import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const systemPrompt = `You are a supportive nutrition coach for Project Lean - a tool that helps people make informed meal decisions without obsessive tracking.

When analyzing a meal photo and/or description, you must:

1. **Identify what you see**: List the main food items visible (proteins, carbs, vegetables, sauces, fats). Be specific but concise.

2. **Estimate macros in RANGES** (not exact numbers - avoid false precision):
   - Calories (estimated range, MAXIMUM 100 kcal spread, e.g., 450-530 kcal or 620-700 kcal)
   - Protein (g range, keep tight)
   - Carbs (g range, keep tight)
   - Fat (g range, keep tight)

3. **Provide ingredient breakdown**: For each distinct food item, provide individual macro estimates.

4. **Assess confidence level**:
   - "high": Clear photo, identifiable portions, common foods
   - "medium": Some ambiguity in portions or ingredients
   - "low": Blurry photo, mixed dishes, hidden ingredients
   - Include a brief reason for your confidence level

5. **Provide coaching context** (Project Lean style):
   - Neutral, educational, non-judgmental
   - Note what's driving the calories (protein-forward? fat-heavy? carb-based?)
   - Keep it supportive

6. **Optional smart suggestion** (ONE line only):
   - A practical observation, not a plan
   - Examples: "If keeping calories lower, the sauce makes the biggest difference" or "Solid protein content for a recovery meal"

NEVER:
- Score the meal
- Label foods as good/bad
- Push perfection
- Mention tracking or daily goals
- Be preachy

Respond ONLY with valid JSON in this exact format:
{
  "foodIdentification": "string describing what you see",
  "macros": {
    "caloriesLow": number,
    "caloriesHigh": number,
    "proteinLow": number,
    "proteinHigh": number,
    "carbsLow": number,
    "carbsHigh": number,
    "fatLow": number,
    "fatHigh": number
  },
  "ingredients": [
    {
      "name": "ingredient name",
      "estimatedWeight": "e.g., 150g or 5oz",
      "calories": { "low": number, "high": number },
      "protein": { "low": number, "high": number },
      "carbs": { "low": number, "high": number },
      "fat": { "low": number, "high": number }
    }
  ],
  "confidence": {
    "level": "high" | "medium" | "low",
    "reason": "brief explanation of confidence level"
  },
  "coachingContext": "string with supportive context",
  "suggestion": "optional one-line suggestion or null"
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const rid = generateRequestId();

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(req, 'Your session has expired. Please sign out and back in.', 401, rid);
    }
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(req, 'Your session has expired. Please sign out and back in.', 401, rid);
    }

    // Server-side paywall + rate limiting: run both checks concurrently
    const SCAN_LIMIT = 1;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [{ data: profile }, { count: recentScans }] = await Promise.all([
      supabase
        .from('profiles')
        .select('is_subscribed, is_coaching_client, scan_count')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('meal_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('logged_at', oneHourAgo),
    ]);

    if (profile && !profile.is_subscribed && !profile.is_coaching_client && profile.scan_count >= SCAN_LIMIT) {
      return errorResponse(req, 'Scan limit reached. Subscribe to continue scanning meals.', 403, rid);
    }

    if (recentScans !== null && recentScans >= 15) {
      return errorResponse(req, 'Rate limit exceeded. Please try again later.', 429, rid);
    }

    const { images, imageBase64, notes } = await req.json();

    // Support both single image (imageBase64) and multiple images (images array)
    const imageList = images || (imageBase64 ? [imageBase64] : []);

    if (imageList.length === 0 && !notes) {
      return errorResponse(req, 'Please provide an image or description', 400, rid);
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return errorResponse(req, 'AI service not configured', 500, rid);
    }

    // Build the user message content
    const userContent: any[] = [];

    let textPrompt = "Analyze this meal and estimate the macros.";
    if (imageList.length > 1) {
      textPrompt = `Analyze this meal from ${imageList.length} different angles and estimate the macros. Use all images to get the most accurate assessment of portions and ingredients.`;
    }
    if (notes) {
      textPrompt += ` Additional context from user: "${notes}"`;
    }
    if (imageList.length === 0) {
      textPrompt = `Based on this description, estimate the macros for the meal: "${notes}"`;
    }

    userContent.push({ type: "text", text: textPrompt });

    // Add all images to the request
    for (const img of imageList) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: img
        }
      });
    }

    console.log(`Calling Gemini API for meal analysis with ${imageList.length} image(s)...`);

    const PRIMARY_MODEL = 'gemini-2.5-flash';
    const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
    const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
    const DEADLINE = Date.now() + 120_000;

    const geminiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    const fetchGemini = (model: string) => {
      const remaining = DEADLINE - Date.now();
      if (remaining < 5000) throw new Error('Not enough time for another attempt');
      return fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, temperature: 0, messages: geminiMessages }),
        signal: AbortSignal.timeout(Math.min(45000, remaining - 2000)),
      });
    };

    const parseGeminiError = (body: string): string => {
      try {
        const parsed = JSON.parse(body);
        return (Array.isArray(parsed) ? parsed[0]?.error?.message : parsed?.error?.message) || body;
      } catch { return body; }
    };

    let response: Response;
    let usedModel = PRIMARY_MODEL;
    try {
      // Attempt 1: primary model
      response = await fetchGemini(PRIMARY_MODEL);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[${rid}] Gemini API error (attempt 1, ${PRIMARY_MODEL}): status=${response.status} body=${errorBody}`);

        if (!RETRYABLE_STATUSES.has(response.status)) {
          return errorResponse(req, `Meal analysis error: ${parseGeminiError(errorBody)}`, response.status, rid);
        }

        // Attempt 2: retry primary after jittered delay
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
        response = await fetchGemini(PRIMARY_MODEL);
        if (!response.ok) {
          const retryBody = await response.text();
          console.error(`[${rid}] Gemini API error (attempt 2, ${PRIMARY_MODEL}): status=${response.status} body=${retryBody}`);

          // Attempt 3: fallback model after jittered delay
          await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
          console.log(`[${rid}] Falling back to ${FALLBACK_MODEL}`);
          usedModel = FALLBACK_MODEL;
          response = await fetchGemini(FALLBACK_MODEL);
          if (!response.ok) {
            const fallbackBody = await response.text();
            const detail = parseGeminiError(fallbackBody);
            console.error(`[${rid}] Gemini API error (attempt 3, ${FALLBACK_MODEL}): status=${response.status} detail=${detail}`);
            if (response.status === 429) {
              return errorResponse(req, 'Meal analysis is temporarily busy. Please try again in a minute.', 429, rid);
            }
            if (response.status === 503) {
              return errorResponse(req, 'Meal analysis is temporarily unavailable due to high demand. Please try again in a moment.', 503, rid);
            }
            return errorResponse(req, 'Meal analysis is temporarily unavailable. Please try again.', 502, rid);
          }
        }
      }
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === 'TimeoutError') {
        console.error(`[${rid}] Gemini API timeout (model: ${usedModel})`);
        return errorResponse(req, 'Meal analysis timed out. Please try again.', 504, rid);
      }
      throw fetchError;
    }

    console.log(`[${rid}] Gemini response OK (model: ${usedModel})`);

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return errorResponse(req, 'No analysis received', 500, rid);
    }

    console.log('AI response received:', aiResponse.substring(0, 200));

    // Parse the JSON response from AI
    let parsedResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      parsedResult = JSON.parse(cleanedResponse.trim());
    } catch (parseError) {
      console.error(`[${rid}] Failed to parse AI response as JSON:`, parseError);
      console.error(`[${rid}] Raw response:`, aiResponse);
      return errorResponse(req, 'Failed to process analysis', 500, rid);
    }

    console.log('Successfully analyzed meal');

    // Fire-and-forget: increment scan_count without blocking the response
    supabase
      .from('profiles')
      .update({ scan_count: (profile?.scan_count ?? 0) + 1 })
      .eq('user_id', user.id)
      .then(({ error }) => { if (error) console.error(`[${rid}] Failed to increment scan_count:`, error); });

    return new Response(
      JSON.stringify({ ...parsedResult, requestId: rid }),
      { headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, error?.message);
  }
});
