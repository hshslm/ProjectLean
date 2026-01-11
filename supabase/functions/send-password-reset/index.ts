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
      subject: 'Reset Your Project Lean Password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Project Lean</h1>
          </div>
          <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
            <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Reset Your Password</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${userName},<br><br>
              We received a request to reset your password. Click the button below to choose a new password:
            </p>
            <div style="text-align: center;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #FF6B5B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #999999; font-size: 14px; margin: 24px 0 0;">
              This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 32px;">
            © ${new Date().getFullYear()} Project Lean. All rights reserved.
          </p>
        </div>
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
