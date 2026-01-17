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

// Only process events for the Project Lean AI Meal Tracker product
const MEAL_TRACKER_PRODUCT_ID = "prod_TltJhHN2HGhoaq";
const MEAL_TRACKER_PRICE_ID = "price_1SoLWcEEn5vGaL1PyAqAWoc9";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log("Received Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this checkout is for our meal tracker product
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const isMealTrackerPurchase = lineItems.data.some(
          (item: Stripe.LineItem) => item.price?.id === MEAL_TRACKER_PRICE_ID || item.price?.product === MEAL_TRACKER_PRODUCT_ID
        );

        if (!isMealTrackerPurchase) {
          console.log("Checkout not for Meal Tracker product, skipping");
          break;
        }

        const customerEmail = session.customer_email || session.customer_details?.email;

        if (customerEmail) {
          console.log("Meal Tracker checkout completed for:", customerEmail);

          // Reset scan count to 0 on payment (giving them fresh 50 scans)
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_subscribed: true,
              stripe_customer_id: session.customer as string,
              subscription_updated_at: new Date().toISOString(),
              scan_count: 0,
            })
            .eq("email", customerEmail);

          if (error) {
            console.error("Error updating profile:", error);
          } else {
            console.log("Successfully updated subscription for:", customerEmail, "Scans reset to 0");
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Handle subscription renewals - reset scans on each billing cycle
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Only reset for subscription invoices (not one-time payments)
        if (!invoice.subscription) {
          console.log("Not a subscription invoice, skipping");
          break;
        }

        // Check if this invoice is for the meal tracker subscription
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const isMealTrackerSubscription = subscription.items.data.some(
          (item: Stripe.SubscriptionItem) => item.price.id === MEAL_TRACKER_PRICE_ID || item.price.product === MEAL_TRACKER_PRODUCT_ID
        );

        if (!isMealTrackerSubscription) {
          console.log("Invoice not for Meal Tracker subscription, skipping");
          break;
        }

        console.log("Meal Tracker invoice payment succeeded for customer:", customerId);

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            scan_count: 0,
            subscription_updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error resetting scan count:", error);
        } else {
          console.log("Reset scan count for customer:", customerId);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Check if this subscription is for the meal tracker
        const isMealTrackerSubscription = subscription.items.data.some(
          (item: Stripe.SubscriptionItem) => item.price.id === MEAL_TRACKER_PRICE_ID || item.price.product === MEAL_TRACKER_PRODUCT_ID
        );

        if (!isMealTrackerSubscription) {
          console.log("Subscription update not for Meal Tracker, skipping");
          break;
        }

        const customerId = subscription.customer as string;
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        console.log("Meal Tracker subscription update for customer:", customerId, "Active:", isActive);

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
