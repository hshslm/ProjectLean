import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, imageBase64, notes } = await req.json();
    
    // Support both single image (imageBase64) and multiple images (images array)
    const imageList = images || (imageBase64 ? [imageBase64] : []);
    
    if (imageList.length === 0 && !notes) {
      return new Response(
        JSON.stringify({ error: 'Please provide an image or description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    console.log(`Calling AI gateway for meal analysis with ${imageList.length} image(s)...`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze meal. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No AI response content');
      return new Response(
        JSON.stringify({ error: 'No analysis received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to process analysis' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully analyzed meal');
    
    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-meal function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
