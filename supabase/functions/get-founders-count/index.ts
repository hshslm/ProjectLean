import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Count subscribers OR coaching clients
    const { count: subCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_subscribed', true);

    const { count: coachCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_coaching_client', true)
      .eq('is_subscribed', false);

    const count = (subCount ?? 0) + (coachCount ?? 0);
    const error = null;

    if (error) throw error;

    return new Response(JSON.stringify({ claimed: count ?? 0, total: 50 }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-founders-count error:", e);
    return new Response(JSON.stringify({ claimed: 0, total: 50 }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
