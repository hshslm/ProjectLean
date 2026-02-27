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
- If stress > 7: Acknowledge stress load before coaching.
- If mood < 4: Lead with empathy, then pivot to one actionable step.

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

    // Build 7-day trend summary
    let trendSummary = "No previous data available.";
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

      trendSummary = `7-day average: ${avgHabits.toFixed(1)}/5 habits per day. ${history.length} days tracked.`;
      if (topPatterns) trendSummary += ` Recurring patterns: ${topPatterns}.`;
      if (resetCount > 0) trendSummary += ` Reset protocol used ${resetCount}x this week.`;
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
