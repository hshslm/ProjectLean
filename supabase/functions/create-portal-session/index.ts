import Stripe from 'https://esm.sh/stripe@18.5.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-08-27.basil',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  const rid = generateRequestId();

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(req, 'Authentication required', 401, rid);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse(req, 'Authentication required', 401, rid);
    }

    // Look up Stripe customer ID
    const { data: stripeCustomer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!stripeCustomer?.stripe_customer_id) {
      return errorResponse(req, 'No subscription found. Please subscribe first.', 404, rid);
    }

    // Create authenticated Stripe Billing Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomer.stripe_customer_id,
      return_url: 'https://theleanbrain.projectlean.app/profile',
    });

    console.log(`[${rid}] Portal session created for user ${user.id}`);

    return new Response(
      JSON.stringify({ url: session.url, requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return errorResponse(req, 'Could not open subscription management. Please try again.', 500, rid, error?.message);
  }
});
