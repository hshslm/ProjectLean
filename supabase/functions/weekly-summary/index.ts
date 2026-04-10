import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are Karim Zaki — a performance-driven fitness and behavior coach writing a personalized weekly summary for your client.

PERSONALITY & TONE:
- Performance-driven, behavior-focused, identity-based
- Strategic and direct — no fluff, no emojis
- Calm confidence. Never patronizing.
- Write as if composing a brief weekly coaching note to a real client.

STRUCTURE (follow this exactly):
1. Open with the WEEKLY THEME (one word/phrase that captures the week, e.g. "Consistency", "Recovery", "Rebuilding")
2. 2-3 sentences summarizing what went well
3. 1-2 sentences on the main area to improve
4. Close with ONE specific action item for next week

RULES:
- Keep total response under 120 words
- Never shame. Never use generic motivation.
- Connect behavior to identity ("You trained 5/7 days — that's an athlete's schedule.")
- If recovery happened after a bad day, highlight resilience
- If patterns are recurring, name them directly and offer a structural fix
- If mood/stress data exists, weave it into the narrative naturally
- Use markdown: bold the theme, use line breaks between sections`;

serve(async (req) => {
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

    const { weekData, weeklyTheme, recoveryScore, recoveryOpportunities, recoveries } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    if (!weekData || weekData.length === 0) {
      return errorResponse(req, 'No check-in data provided', 400, rid);
    }

    const habitKeys = ['protein_hit', 'steps_hit', 'training_hit', 'sleep_hit', 'aligned_eating_hit'];
    const daysTracked = weekData.length;

    // Habit rates
    const habitRates = habitKeys.map(key => {
      const count = weekData.filter((d: any) => d[key]).length;
      return `${key.replace('_hit', '').replace('_', ' ')}: ${count}/${daysTracked}`;
    }).join(", ");

    // Average habits per day
    const avgHabits = weekData.reduce((sum: number, day: any) => {
      return sum + habitKeys.filter(k => day[k]).length;
    }, 0) / daysTracked;

    // Pattern frequency
    const patternCounts: Record<string, number> = {};
    weekData.forEach((day: any) => {
      (day.cognitive_patterns || []).forEach((p: string) => {
        if (p !== 'none') patternCounts[p] = (patternCounts[p] || 0) + 1;
      });
    });
    const patterns = Object.entries(patternCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([p, c]) => `${p}: ${c}x`)
      .join(", ") || "None";

    // Mood & stress
    const moodDays = weekData.filter((d: any) => d.mood_score != null);
    const stressDays = weekData.filter((d: any) => d.stress_score != null);
    const avgMood = moodDays.length > 0
      ? (moodDays.reduce((s: number, d: any) => s + d.mood_score, 0) / moodDays.length).toFixed(1)
      : "N/A";
    const avgStress = stressDays.length > 0
      ? (stressDays.reduce((s: number, d: any) => s + d.stress_score, 0) / stressDays.length).toFixed(1)
      : "N/A";

    const resetCount = weekData.filter((d: any) => d.reset_protocol_used).length;

    const userMessage = `WEEKLY CHECK-IN DATA:
Days tracked: ${daysTracked}/7
Average habits/day: ${avgHabits.toFixed(1)}/5
Habit breakdown: ${habitRates}
Weekly theme detected: ${weeklyTheme || "Unknown"}
Recovery score: ${recoveryScore ?? "N/A"}/100
Recoveries: ${recoveries ?? 0} out of ${recoveryOpportunities ?? 0} tough days
Avg mood: ${avgMood}/10
Avg stress: ${avgStress}/10
Cognitive patterns this week: ${patterns}
Reset protocol used: ${resetCount}x

Generate a personalized weekly coaching summary for this client.`;

    const geminiBody = JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const fetchGemini = () =>
      fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: geminiBody,
        signal: AbortSignal.timeout(45000),
      });

    let response: Response;
    try {
      response = await fetchGemini();
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[${rid}] Gemini API error (attempt 1): status=${response.status} body=${errorBody}`);
        await new Promise(r => setTimeout(r, 2000));
        response = await fetchGemini();
        if (!response.ok) {
          const retryBody = await response.text();
          console.error(`[${rid}] Gemini API error (attempt 2): status=${response.status} body=${retryBody}`);
          let detail = '';
          try {
            const parsed = JSON.parse(retryBody);
            detail = (Array.isArray(parsed) ? parsed[0]?.error?.message : parsed?.error?.message) || retryBody;
          } catch { detail = retryBody; }
          console.error(`[${rid}] Gemini final error detail: ${detail}`);
          if (response.status === 429) {
            return errorResponse(req, 'Weekly summary is temporarily busy. Please try again in a minute.', 429, rid);
          }
          if (response.status === 503) {
            return errorResponse(req, 'Weekly summary is temporarily unavailable due to high demand. Please try again in a moment.', 503, rid);
          }
          return errorResponse(req, 'Weekly summary is temporarily unavailable. Please try again.', 502, rid);
        }
      }
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === 'TimeoutError') {
        console.error(`[${rid}] Gemini API timeout after 45s`);
        return errorResponse(req, 'Gemini API timed out after 45s. Please try again.', 504, rid);
      }
      throw fetchError;
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "No summary generated.";

    return new Response(JSON.stringify({ summary, requestId: rid }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, e instanceof Error ? e.message : undefined);
  }
});
