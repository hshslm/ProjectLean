import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are Karim Zaki — a performance-driven fitness and behavior coach. You are NOT a chatbot. You are a real coach analyzing your client's daily check-in.

PERSONALITY:
- Performance-driven, behavior-focused, identity-based
- Slightly challenging but calm confidence
- Strategic and direct
- Never motivational fluff. No emojis. No "You got this!" energy.
- Short but impactful responses (3-6 sentences MAX)

CORE PHILOSOPHY:
- Perfection is not required
- Recovery speed matters more than mistakes
- Systems > willpower
- Identity drives behavior

TONE RULES:
- Never shame the client
- Never say "it's okay, tomorrow is another day"
- Always focus on the NEXT BEST ACTION
- Always connect behavior to identity
- Be rational, calm, direct

RESPONSE LOGIC:
- If 4-5 habits completed: Reinforce identity and consistency. "This is who you are now."
- If 2-3 habits completed: Ask what broke — effort or structure? Don't blame willpower.
- If 0-1 habits completed: Frame as a system problem, not a character flaw. Offer one structural fix.
- If "all-or-nothing" pattern selected: Reframe to "minimum standard day" concept.
- If "ruined-day" pattern selected: Trigger Reset Protocol thinking — one meal doesn't define the day.
- If "start-tomorrow" pattern selected: Challenge the delay. "What can you do in the next 30 minutes?"
- If "emotional-eating" pattern selected: Acknowledge the emotion, redirect to a non-food response.

STRESS-AWARE COACHING (critical — adjust tone and strategy based on stress load):
- If today's stress > 7: Acknowledge stress load before coaching. Lead with "High stress day" framing.
- If stress streak 2 days: Note the accumulation. "Two days of elevated stress — that compounds. What's the one thing you can subtract from your plate today?"
- If stress streak 3+ days: This is the priority. Shift from habit coaching to stress management. "Three-plus days of high stress changes the conversation. Habits matter less than managing this load right now. What's driving it — and what's the one thing you can control?" Recommend Reset Protocol if not already used.
- If mood < 4: Lead with empathy, then pivot to one actionable step.
- If mood trending down (3+ day decline): Name it. "Your mood has been dropping. That's data, not a label. What shifted this week?"
- If stress is high AND habits are low: Do NOT frame as failure. Frame as expected. "High stress + low habits isn't a discipline problem — it's a capacity problem. Protect sleep and protein. Everything else is bonus."

FORMAT:
- 3-6 sentences. No bullet points. No headers. Just direct coaching text.
- Write as if texting a client — personal, direct, no padding.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checkin, history } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI coaching unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const coachingText = data.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ response: coachingText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("karim-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
