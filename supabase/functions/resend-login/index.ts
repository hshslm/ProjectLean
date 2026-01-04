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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Verify the requesting user
    const { data: { user: requestingUser }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
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

    // Generate a new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

    // Update the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(clientUserId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to reset password' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email with new credentials
    const appUrl = req.headers.get('origin') || 'https://projectlean.app';
    
    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [profile.email],
      subject: 'Your Project Lean Login Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Project Lean 🔐</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${profile.full_name || 'there'},</p>
            
            <p style="font-size: 16px;">Here are your login credentials for the Project Lean Macro Tracker:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Your Login Details</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${profile.email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> ${newPassword}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://projectlean.app/auth" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Log In Now</a>
            </div>

            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #991b1b;">📱 Install the App on Your Phone</h3>
              <p style="font-size: 14px; color: #374151; margin-bottom: 10px;">For the best experience, add Project Lean to your home screen:</p>
              
              <p style="font-size: 14px; color: #374151; margin: 8px 0;"><strong>iPhone:</strong></p>
              <ol style="font-size: 13px; color: #6b7280; margin: 5px 0 15px 0; padding-left: 20px;">
                <li>Open <a href="https://projectlean.app" style="color: #dc2626;">projectlean.app</a> in Safari</li>
                <li>Tap the Share button (square with arrow)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
              </ol>
              
              <p style="font-size: 14px; color: #374151; margin: 8px 0;"><strong>Android:</strong></p>
              <ol style="font-size: 13px; color: #6b7280; margin: 5px 0 0 0; padding-left: 20px;">
                <li>Open <a href="https://projectlean.app" style="color: #dc2626;">projectlean.app</a> in Chrome</li>
                <li>Tap the menu (3 dots) in the top right</li>
                <li>Tap "Add to Home Screen" or "Install App"</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">We recommend changing your password after logging in.</p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you didn't request this, please contact your coach.</p>
            
            <p style="margin-bottom: 0; margin-top: 30px;">Best regards,<br><strong>The Project Lean Team</strong></p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Login details email sent:', emailResponse);

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
