import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

function buildSystemPrompt(clientContext: string): string {
  return `You are Karim Zaki - a behavior-change coach inside Lean Brain.

Client context: ${clientContext}

CHECK-IN RESPONSE FRAMEWORK

When a client submits a check-in, respond using this structure:

1. PATTERN FIRST (1-2 sentences)
- Name the behavioral pattern you observe from their data or message
- Do not open with praise or a report card
- Be direct but neutral - name it, don't judge it
- Example: "The all-or-nothing pattern is showing up again."

2. REFRAME (1-2 sentences)
- Shift the standard they're holding themselves to
- Move them from "perfect day" thinking to "minimum standard day" thinking
- Keep it concrete, not motivational

3. MICRO-COMMITMENT OR ANCHORING QUESTION (1 sentence)
- End with either:
  a) A forward-facing question that forces them to define their imperfect version BEFORE the next hard day
  b) A specific micro-commitment tied to their pattern
- Never end with a diagnostic-only question ("what got in the way?")
- The question should require a behavioral answer, not an emotional one

TONE RULES:
- Short. Mobile-first. No paragraph longer than 3-4 sentences.
- No filler praise ("great job", "you're doing well")
- Validation is only used if it connects directly to a pattern or reframe
- Match directness to client tenure: newer clients get slightly warmer framing, 30+ day clients get more direct

WHAT TO AVOID:
- Ending without a forward commitment or anchoring question
- Using vague language ("try to", "maybe consider")
- Responses longer than 4-5 sentences total`;
}

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

    // Server-side paywall: check subscription and free check-in limit
    // Use > 1 (not >= 1) because the counter may already be incremented for the
    // current check-in by the time this request arrives (race with client-side increment).
    // The client gates new check-in creation at checkin_count >= 1, so a free user
    // can only ever create 1 check-in. This server check is defense-in-depth.
    const FREE_CHECKIN_LIMIT = 1;
    const { data: subProfile } = await supabase
      .from('profiles')
      .select('is_subscribed, is_coaching_client, checkin_count')
      .eq('user_id', user.id)
      .single();

    if (subProfile && !subProfile.is_subscribed && !subProfile.is_coaching_client && (subProfile.checkin_count ?? 0) > FREE_CHECKIN_LIMIT) {
      return errorResponse(req, 'Check-in limit reached. Subscribe to continue using AI coaching.', 403, rid);
    }

    // Rate limiting: max 10 coaching responses per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCoaching } = await supabase
      .from('coaching_responses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (recentCoaching !== null && recentCoaching >= 10) {
      return errorResponse(req, 'Rate limit exceeded. Please try again later.', 429, rid);
    }

    const { checkin, history } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Build dynamic client context
    let daysActive = 0;
    let streak = 0;
    let lastPatternTag = "new client";

    try {
      // 1. days_active from profile created_at
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.created_at) {
        daysActive = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      }

      // 2. streak: count consecutive days with check-ins ending at today or yesterday
      const { data: recentCheckins } = await supabase
        .from('daily_checkins')
        .select('checkin_date')
        .eq('user_id', user.id)
        .order('checkin_date', { ascending: false })
        .limit(60);

      if (recentCheckins && recentCheckins.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = recentCheckins.map((c: any) => c.checkin_date);

        // Start from today or yesterday
        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let checkDate: Date;
        if (dates.includes(todayStr)) {
          checkDate = new Date(today);
        } else if (dates.includes(yesterdayStr)) {
          checkDate = new Date(yesterday);
        } else {
          checkDate = new Date(0); // no streak
        }

        if (checkDate.getTime() > 0) {
          streak = 1;
          for (let i = 1; i < 60; i++) {
            const prev = new Date(checkDate);
            prev.setDate(prev.getDate() - i);
            const prevStr = prev.toISOString().split('T')[0];
            if (dates.includes(prevStr)) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      // 3. last_pattern_tag from most recent coaching_response
      const { data: lastResponse } = await supabase
        .from('coaching_responses')
        .select('response_text')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastResponse?.response_text) {
        // Extract a short pattern label from the last response
        const text = lastResponse.response_text as string;
        const patternMatches = text.match(/(?:all-or-nothing|ruined.day|start.tomorrow|emotional.eating|compensation|restart|inconsistent|weekend|stress|recovery|minimum standard)/i);
        lastPatternTag = patternMatches ? patternMatches[0].toLowerCase() : "general coaching";
      } else {
        lastPatternTag = "first check-in";
      }
    } catch (contextError) {
      console.error(`[${rid}] Error building client context:`, contextError);
      // Use defaults set above
    }

    const clientContext = `${daysActive} days in program. Current streak: ${streak}. Last check-in pattern: ${lastPatternTag}.`;
    const SYSTEM_PROMPT = buildSystemPrompt(clientContext);

    // Build context for AI
    const habitsCompleted = [
      checkin.protein_hit, checkin.steps_hit, checkin.training_hit,
      checkin.sleep_hit, checkin.aligned_eating_hit
    ].filter(Boolean).length;

    const habitDetails = [
      checkin.protein_hit ? "Protein: HIT" : "Protein: MISSED",
      checkin.steps_hit ? "Steps: HIT" : "Steps: MISSED",
      checkin.training_hit ? "Training: HIT" : "Training: MISSED",
      checkin.sleep_hit ? "Sleep: HIT" : "Sleep: MISSED",
      checkin.aligned_eating_hit ? "Aligned Eating: HIT" : "Aligned Eating: MISSED",
    ].join("\n");

    const patterns = checkin.cognitive_patterns?.length > 0
      ? checkin.cognitive_patterns.join(", ")
      : "None reported";

    // Build 7-day trend summary with stress/mood intelligence
    let trendSummary = "No previous data available.";
    let stressAlert = "";

    if (history && history.length > 0) {
      const avgHabits = history.reduce((sum: number, day: any) => {
        return sum + [day.protein_hit, day.steps_hit, day.training_hit, day.sleep_hit, day.aligned_eating_hit].filter(Boolean).length;
      }, 0) / history.length;

      const patternFreq: Record<string, number> = {};
      history.forEach((day: any) => {
        (day.cognitive_patterns || []).forEach((p: string) => {
          if (p !== 'none') patternFreq[p] = (patternFreq[p] || 0) + 1;
        });
      });

      const topPatterns = Object.entries(patternFreq)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([p, c]) => `${p}: ${c}x`)
        .join(", ");

      const resetCount = history.filter((d: any) => d.reset_protocol_used).length;

      // Stress/mood streak detection — history is ordered by checkin_date descending
      const sortedHistory = [...history].sort((a: any, b: any) =>
        b.checkin_date.localeCompare(a.checkin_date)
      );

      // Count consecutive high-stress days (stress >= 7) leading up to today
      let stressStreak = 0;
      for (const day of sortedHistory) {
        if (day.stress_score !== null && day.stress_score >= 7) {
          stressStreak++;
        } else {
          break;
        }
      }
      // Include today in the streak count
      if (checkin.stress_score !== null && checkin.stress_score >= 7) {
        stressStreak++;
      }

      // Mood trend detection — check if mood has declined over last 3+ days
      const recentMoods = sortedHistory
        .filter((d: any) => d.mood_score !== null)
        .slice(0, 4)
        .map((d: any) => d.mood_score);

      let moodDeclining = false;
      if (recentMoods.length >= 3) {
        moodDeclining = recentMoods.every((m: number, i: number) =>
          i === 0 || m <= recentMoods[i - 1]
        ) && recentMoods[0] < recentMoods[recentMoods.length - 1];
      }

      // Stress/mood averages
      const stressDays = history.filter((d: any) => d.stress_score !== null);
      const moodDays = history.filter((d: any) => d.mood_score !== null);
      const avgStress = stressDays.length > 0
        ? (stressDays.reduce((s: number, d: any) => s + d.stress_score, 0) / stressDays.length).toFixed(1)
        : null;
      const avgMood = moodDays.length > 0
        ? (moodDays.reduce((s: number, d: any) => s + d.mood_score, 0) / moodDays.length).toFixed(1)
        : null;

      trendSummary = `7-day average: ${avgHabits.toFixed(1)}/5 habits per day. ${history.length} days tracked.`;
      if (avgStress) trendSummary += ` Avg stress: ${avgStress}/10.`;
      if (avgMood) trendSummary += ` Avg mood: ${avgMood}/10.`;
      if (topPatterns) trendSummary += ` Recurring patterns: ${topPatterns}.`;
      if (resetCount > 0) trendSummary += ` Reset protocol used ${resetCount}x this week.`;

      // Build stress alert section
      if (stressStreak >= 3) {
        stressAlert = `⚠️ STRESS ALERT: ${stressStreak} consecutive days of high stress (≥7/10). This is the coaching priority — shift from habit coaching to stress load management. Recommend Reset Protocol.`;
      } else if (stressStreak === 2) {
        stressAlert = `⚠️ STRESS ACCUMULATION: 2 consecutive days of high stress. Acknowledge the compound effect. Focus on what to subtract, not add.`;
      }

      if (moodDeclining) {
        stressAlert += stressAlert ? "\n" : "";
        stressAlert += `📉 MOOD TREND: Mood has been declining over the past ${recentMoods.length} days (${recentMoods.reverse().join(" → ")}). Name the trend and ask what shifted.`;
      }
    }

    const userMessage = `TODAY'S CHECK-IN:
Habits completed: ${habitsCompleted}/5
${habitDetails}
Mood: ${checkin.mood_score ?? "Not reported"}/10
Stress: ${checkin.stress_score ?? "Not reported"}/10
Thought patterns today: ${patterns}
Reset protocol used: ${checkin.reset_protocol_used ? "Yes" : "No"}

7-DAY TREND:
${trendSummary}
${stressAlert ? `\nSTRESS INTELLIGENCE:\n${stressAlert}` : ""}

Generate your coaching response for this client.`;

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
          try { detail = JSON.parse(retryBody)?.error?.message || retryBody; } catch { detail = retryBody; }
          if (response.status === 429) {
            return errorResponse(req, `Gemini rate limited: ${detail}`, 429, rid);
          }
          return errorResponse(req, `Gemini API error ${response.status}: ${detail}`, 502, rid);
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
    const coachingText = data.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ response: coachingText, requestId: rid }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });

  } catch (e) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, e instanceof Error ? e.message : undefined);
  }
});
