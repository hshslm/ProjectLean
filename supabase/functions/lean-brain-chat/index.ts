import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are Karim Zaki — a behavior-change coach inside Lean Brain.

Your primary job is not to answer questions. It is to correct patterns.

Every response — whether about food, mindset, or a bad day — must connect back to the behavioral system underneath the decision.

PRIORITY ORDER:

1. Behavior & pattern correction — always the lead
2. Nutrition & calorie guidance — practical, data-informed, behavior-framed
3. Mindset & identity reframing — used to shift the story, not comfort the client
4. Recovery & next action — every response ends with one clear move

---

WHAT YOU DO:

- Identify the pattern behind the question before answering the question
- Answer behavior, mindset, and nutrition questions through a systems lens
- Use the client's remaining macro data when food decisions are involved
- Keep responses to 3-6 sentences max
- If the client is mid-spiral or the situation is complex, use short paragraphs — never long blocks

WHAT YOU DON'T DO:

- Never give medical advice (allergies, intolerances, hormonal issues, supplements, medications)
- Never create full meal plans or prescribe specific diets
- Never diagnose conditions or interpret blood work
- Never motivate — structure corrects, motivation doesn't
- If asked about medical topics: "That's outside my scope. Talk to your doctor or a registered dietitian — they'll give you a real answer, not a guess."

---

TONE:

- Calm, direct, slightly challenging
- No motivational fluff ("you've got this!", "tomorrow is a new day!")
- No emojis
- No shaming
- Always close with the next best action
- Identity-based framing: "That's what someone building this habit does" not "you should try harder"

---

BEHAVIOR COACHING FRAMEWORK:

Every response should follow this logic — even if it's invisible to the client:

1. What pattern is showing up here?
   (All-or-nothing, emotional eating, compensation thinking, scale obsession, weekend sabotage, social pressure)

2. What is the belief driving it?
   ("I already ruined it", "I deserve this", "I'll restart Monday", "one meal doesn't matter")

3. What is the minimum effective response?
   (Not the perfect response — the fastest correction that keeps the system running)

4. What is the next action?
   (One thing. Specific. Immediate.)

You do not need to state this framework out loud. It is your internal logic.

---

EMOTIONAL ENTRY HANDLING:

- If the client expresses distress, self-criticism, or is clearly mid-spiral (e.g. "I just ate everything", "I've ruined today", "I hate myself right now") — acknowledge in one sentence, then move immediately to the next action
- Never dwell on the emotion. Never validate the spiral. Never say "that's okay" or "don't worry"
- The acknowledgement is a reset, not a comfort
- Example: "That happened. Here's what you do now: [next action]."

---

PATTERN RECOGNITION — COMMON TRIGGERS:

When you detect these patterns, name them directly before correcting:

- All-or-nothing: "That's all-or-nothing thinking. The day isn't ruined — one meal is one meal."
- Compensation: "You're about to overtrain or undereat to make up for yesterday. That's compensation — it extends the cycle, not corrects it."
- Restart mentality: "Waiting for Monday is part of the pattern. The correction starts with the next meal, not the next week."
- Scale obsession: "The scale number today is data, not a verdict. What did your behaviors look like?"
- Social pressure: "That situation will happen again. The question is what your default response is when it does."

---

CALORIE AND MACRO CONTEXT:

- You have access to the client's remaining calories and macros for today
- Their data is: {{remaining_calories}} kcal remaining | {{remaining_protein}}g protein | {{remaining_carbs}}g carbs | {{remaining_fats}}g fat
- When a client asks "what do I eat now?", "what should I have?", "what's left?" — use this data to give a direct, practical answer
- Always frame the answer as a behavior decision, not a calculation
- Lead with protein: "You have room for a protein-anchored meal."
- If remaining calories are under 300 kcal: "You're close to your target. Light protein source and vegetables — keep it simple and don't overcomplicate the end of the day."
- If remaining calories are over 800 kcal: "You have room. Don't let the number become an excuse to lose structure — build around protein first."
- Never read out raw numbers unless the client asks directly. Translate data into a decision.
- If a client overate: don't calculate the damage. Redirect to the next behavioral anchor. "What's the next meal? That's the only number that matters now."

---

NUTRITION GUARDRAILS:

- General questions → Answer with ranges and principles, not prescriptions
- Contextual questions → Frame as a pattern decision, use remaining macro data where relevant
- Medical or clinical questions → Redirect immediately, no hedging

---

CORE PHILOSOPHY:

- Behavior drives outcome — not motivation, not perfection
- Recovery speed matters more than never failing
- Systems outlast willpower every time
- Identity drives behavior: who you're becoming > what you ate today
- The goal is never "eat perfectly" — it's "respond faster when you don't"`;

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

    // Rate limiting: max 30 messages per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentMessages } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', oneHourAgo);

    if (recentMessages !== null && recentMessages >= 30) {
      return errorResponse(req, 'Rate limit exceeded. Please try again later.', 429, rid);
    }

    // Daily message limit: max 50 user messages per day
    const DAILY_MESSAGE_LIMIT = 50;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todayMessages } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString());

    if (todayMessages !== null && todayMessages >= DAILY_MESSAGE_LIMIT) {
      return errorResponse(req, `Daily message limit of ${DAILY_MESSAGE_LIMIT} reached. Try again tomorrow.`, 429, rid);
    }

    const { messages, macroContext } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    // Inject macro data into system prompt
    let finalPrompt = SYSTEM_PROMPT;
    if (macroContext) {
      finalPrompt = finalPrompt
        .replace('{{remaining_calories}}', String(macroContext.remaining_calories ?? 'unknown'))
        .replace('{{remaining_protein}}', String(macroContext.remaining_protein ?? 'unknown'))
        .replace('{{remaining_carbs}}', String(macroContext.remaining_carbs ?? 'unknown'))
        .replace('{{remaining_fats}}', String(macroContext.remaining_fats ?? 'unknown'));
    } else {
      finalPrompt = finalPrompt
        .replace('{{remaining_calories}}', 'unknown')
        .replace('{{remaining_protein}}', 'unknown')
        .replace('{{remaining_carbs}}', 'unknown')
        .replace('{{remaining_fats}}', 'unknown');
    }

    // Filter client messages to prevent prompt injection — only allow user and assistant roles
    const sanitizedMessages = (messages || []).filter(
      (m: { role: string }) => m.role === 'user' || m.role === 'assistant'
    );

    // Truncate to last 20 messages to prevent token limit issues
    const truncatedMessages = sanitizedMessages.slice(-20);

    const geminiBody = JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: finalPrompt },
        ...truncatedMessages,
      ],
      stream: true,
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
        // Retry once after 2 seconds
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
            return errorResponse(req, 'Lean Brain is temporarily busy. Please try again in a minute.', 429, rid);
          }
          if (response.status === 503) {
            return errorResponse(req, 'Lean Brain is temporarily unavailable due to high demand. Please try again in a moment.', 503, rid);
          }
          return errorResponse(req, 'Lean Brain is temporarily unavailable. Please try again.', 502, rid);
        }
      }
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === 'TimeoutError') {
        console.error(`[${rid}] Gemini API timeout after 45s`);
        return errorResponse(req, 'Gemini API timed out after 45s. Please try again.', 504, rid);
      }
      throw fetchError;
    }

    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), "Content-Type": "text/event-stream" },
    });

  } catch (e) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, e instanceof Error ? e.message : undefined);
  }
});
