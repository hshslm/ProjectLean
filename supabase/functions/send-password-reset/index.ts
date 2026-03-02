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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Password reset requested for:', email);

    // Get user by email
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.log('User not found, but returning success for security');
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's name from profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const userName = profile?.full_name || email.split('@')[0];

    // Generate a password reset link using Supabase's generateLink
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://tracker.projectlean.app/auth/reset-password',
      },
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token from the link
    const resetUrl = linkData.properties.action_link;
    console.log('Generated reset URL');

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [email],
      subject: 'Reset Your Password — The Lean Brain™',
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
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Reset Your Password</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            
            <p style="font-size: 16px; margin-top: 0;">Hi ${userName},</p>
            
            <p style="font-size: 15px;">We received a request to reset your password for <strong>The Lean Brain™</strong>.</p>
            
            <p style="font-size: 15px;">Click the button below to set a new password and get back on track.</p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background: #C23B22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Reset Password</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>

            <div style="background: #FFF8F6; padding: 16px; border-radius: 8px; border-left: 4px solid #C23B22; margin: 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;">
                <strong>Remember:</strong> Progress isn't about perfection — it's about reducing the time between a mistake and a correction. Get back in, stay consistent.
              </p>
            </div>

            <p style="font-size: 14px; color: #374151; margin-top: 24px; margin-bottom: 0;">
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

    console.log('Password reset email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-password-reset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
