import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get user profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    const userName = profile?.full_name || email.split('@')[0];
    const appUrl = 'https://tracker.projectlean.app';
    const paymentLink = 'https://buy.stripe.com/14AbJ14z3fr23Xl1xG6c00B';

    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [email],
      subject: 'Your Lean Brain™ Subscription — Time to Renew',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.7; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: #C23B22; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <img src="https://snap-macro-sight.lovable.app/email-logo-white.png" alt="Project Lean" style="height: 40px; margin-bottom: 12px;" />
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Time to Renew 🔄</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            
            <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
            
            <p style="font-size: 15px;">A new month is here — and so is your next opportunity to stay consistent.</p>
            
            <p style="font-size: 15px;">Your <strong>Lean Brain™</strong> subscription is due for renewal. Click below to continue your access for another month.</p>

            <!-- Price -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Monthly Subscription</p>
              <p style="margin: 0; font-size: 28px; font-weight: 700; color: #C23B22;">79 AED<span style="font-size: 14px; color: #6b7280; font-weight: 400;">/month</span></p>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${paymentLink}" style="background: #C23B22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Renew Now</a>
            </div>

            <div style="background: #FFF8F6; padding: 16px; border-radius: 8px; border-left: 4px solid #C23B22; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>Remember:</strong> Consistency compounds. Every month you stay in the system, your recovery speed improves and all-or-nothing thinking weakens. Don't break the chain.
              </p>
            </div>

            <p style="font-size: 14px; color: #6b7280;">Already renewed? You can ignore this email. Your access continues automatically.</p>

            <p style="font-size: 14px; color: #374151; margin-top: 24px; margin-bottom: 0;">
              See you inside.<br><br>
              — <strong>Karim</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 16px 0; margin-top: 8px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Project Lean · Behavior Intelligence for Real-World Fat Loss</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Renewal email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending renewal email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
