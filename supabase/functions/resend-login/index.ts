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
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Create a client with the user's token to verify their identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    
    // Verify the requesting user using getClaims for proper JWT validation
    const { data: claimsData, error: authError } = await userClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const requestingUserId = claimsData.claims.sub;

    // Check if requesting user is admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Only admins can resend login details' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { clientUserId } = await req.json();

    if (!clientUserId) {
      return new Response(
        JSON.stringify({ error: 'Client user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', clientUserId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a password reset link (secure - no plaintext password)
    const appUrl = req.headers.get('origin') || 'https://projectlean.app';
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating password reset link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate reset link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resetLink = linkData?.properties?.action_link;

    // Send email with secure reset link (NO PASSWORD)
    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [profile.email],
      subject: 'Your Project Lean Login Link',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B9A7D 0%, #6B7A5D 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Project Lean Login 🔐</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${profile.full_name || 'there'},</p>
            
            <p style="font-size: 16px;">Your coach has sent you a login link for Project Lean. Click the button below to access your account:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #8B9A7D 0%, #6B7A5D 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Access Your Account</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">This link will expire in 24 hours for security. If you need a new link, ask your coach to resend it.</p>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #166534;">📱 Install the App on Your Phone</h3>
              <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">For the best experience, add Project Lean to your home screen:</p>
              
              <p style="font-size: 14px; color: #374151; margin: 8px 0;"><strong>iPhone:</strong></p>
              <ol style="font-size: 13px; color: #6b7280; margin: 5px 0 15px 0; padding-left: 20px;">
                <li>Open <a href="https://tracker.projectlean.app" style="color: #166534;">tracker.projectlean.app</a> in Safari</li>
                <li>Tap the Share button (square with arrow)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
              </ol>
              
              <p style="font-size: 14px; color: #374151; margin: 8px 0;"><strong>Android:</strong></p>
              <ol style="font-size: 13px; color: #6b7280; margin: 5px 0 0 0; padding-left: 20px;">
                <li>Open <a href="https://tracker.projectlean.app" style="color: #166534;">tracker.projectlean.app</a> in Chrome</li>
                <li>Tap the menu (3 dots) in the top right</li>
                <li>Tap "Add to Home Screen" or "Install App"</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't request this, please contact your coach.</p>
            
            <p style="margin-bottom: 0; margin-top: 30px;">Best regards,<br><strong>The Project Lean Team</strong></p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Login link email sent:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, email: profile.email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error resending login details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});