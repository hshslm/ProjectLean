import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Received Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_email || session.customer_details?.email;

        if (customerEmail) {
          console.log("Checkout completed for:", customerEmail);

          // First, get the current profile to check if they've already received paid scans
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("scan_count, is_subscribed")
            .eq("email", customerEmail)
            .single();

          // Only add 50 scans on first payment (not renewals)
          // We check if is_subscribed was false before this payment
          const wasSubscribed = profile?.is_subscribed ?? false;
          const currentScans = profile?.scan_count ?? 0;
          
          // If first time subscribing, give them 50 scans (resetting from free tier)
          // If already subscribed (renewal), don't add more scans
          const newScanCount = wasSubscribed ? currentScans : 50;

          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_subscribed: true,
              stripe_customer_id: session.customer as string,
              subscription_updated_at: new Date().toISOString(),
              scan_count: newScanCount,
            })
            .eq("email", customerEmail);

          if (error) {
            console.error("Error updating profile:", error);
          } else {
            console.log("Successfully updated subscription for:", customerEmail, "Scans:", newScanCount);
          }
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const isActive = subscription.status === "active" || subscription.status === "trialing";

        console.log("Subscription update for customer:", customerId, "Active:", isActive);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            is_subscribed: isActive,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating subscription status:", error);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});
