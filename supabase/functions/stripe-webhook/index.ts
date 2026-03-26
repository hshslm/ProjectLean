import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
              subscription_updated_at: new Date().toISOString(),
              scan_count: 0,
              checkin_count: 0,
            })
            .eq("email", customerEmail);

          if (error) {
            console.error("Error updating profile:", error);
          } else {
            console.log("Successfully updated subscription for:", customerEmail, "Scans reset to 0");

            // Store stripe_customer_id in admin-only table
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("user_id")
              .eq("email", customerEmail)
              .maybeSingle();

            if (profile?.user_id && session.customer) {
              await supabaseAdmin
                .from("stripe_customers")
                .upsert({
                  user_id: profile.user_id,
                  stripe_customer_id: session.customer as string,
                  updated_at: new Date().toISOString(),
                }, { onConflict: "user_id" });
            }
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

        // Get customer email for renewal notification
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const customerEmail = customer.email;

        // Look up user via stripe_customers table
        const { data: stripeCustomer } = await supabaseAdmin
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (stripeCustomer?.user_id) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              scan_count: 0,
              checkin_count: 0,
              subscription_updated_at: new Date().toISOString(),
            })
            .eq("user_id", stripeCustomer.user_id);

          if (error) {
            console.error("Error resetting scan count:", error);
          } else {
            console.log("Reset scan count for customer:", customerId);
          }

          // Send renewal email
          if (customerEmail) {
            try {
              const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("full_name")
                .eq("user_id", stripeCustomer.user_id)
                .maybeSingle();

            const userName = profile?.full_name || customerEmail.split("@")[0];
            const appUrl = "https://theleanbrain.projectlean.app";

            await resend.emails.send({
              from: "Project Lean <noreply@projectlean.app>",
              to: [customerEmail],
              subject: "Your Lean Brain™ Subscription Has Renewed",
              html: `
                <!DOCTYPE html>
                <html>
                <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                  <div style="background: #C23B22; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <img src="https://theleanbrain.projectlean.app/email-logo-white.png" alt="Project Lean" style="height: 40px; margin-bottom: 12px;" />
                    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Subscription Renewed</h1>
                  </div>
                  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
                    <p style="font-size: 15px;">Your Lean Brain™ subscription has renewed for another month.</p>
                    <p style="font-size: 15px;">Good.</p>
                    <p style="font-size: 15px;">Now use it properly.</p>
                    <p style="font-size: 15px;">This month, focus on one thing:</p>
                    <p style="font-size: 15px;"><strong>Reduce the time between mistake and correction.</strong></p>
                    <p style="font-size: 15px;">That's your edge.</p>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px 0;">
                      <p style="margin: 0 0 8px 0; font-size: 15px;">Open the dashboard.</p>
                      <p style="margin: 0 0 8px 0; font-size: 15px;">Run your daily check-ins.</p>
                      <p style="margin: 0; font-size: 15px;">Study your patterns.</p>
                    </div>
                    <p style="font-size: 15px;">You don't need more motivation.</p>
                    <p style="font-size: 15px;">You need structure.</p>
                    <p style="font-size: 15px;">The Lean Brain™ gives you that.</p>
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${appUrl}" style="background: #C23B22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Open The Lean Brain™</a>
                    </div>
                    <p style="font-size: 14px; color: #374151; margin-top: 24px; margin-bottom: 0;">— <strong>Karim</strong></p>
                  </div>
                  <div style="text-align: center; padding: 16px 0; margin-top: 8px;">
                    <p style="font-size: 12px; color: #9ca3af; margin: 0;">Project Lean · Behavior Intelligence for Real-World Fat Loss</p>
                  </div>
                </body>
                </html>
              `,
            });
            console.log("Renewal email sent to:", customerEmail);
          } catch (emailErr) {
            console.error("Failed to send renewal email:", emailErr);
          }
          }
        } else {
          console.error("No stripe customer found for:", customerId);
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

        // Look up user via stripe_customers table
        const { data: stripeCustomer } = await supabaseAdmin
          .from("stripe_customers")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (stripeCustomer?.user_id) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({
              is_subscribed: isActive,
              subscription_updated_at: new Date().toISOString(),
            })
            .eq("user_id", stripeCustomer.user_id);

          if (error) {
            console.error("Error updating subscription status:", error);
          }
        } else {
          console.error("No stripe customer found for:", customerId);
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
