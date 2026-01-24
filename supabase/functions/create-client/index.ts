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
    
    // Get JWT from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Use admin client for all operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Verify the user from the token
    const { data: { user: requestingUser }, error: authError } = await adminClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
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
        JSON.stringify({ error: 'Only admins can create clients' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign client role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'client' });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    }

    // Update profile with created_by
    await adminClient
      .from('profiles')
      .update({ created_by: requestingUser.id })
      .eq('user_id', newUser.user.id);

    // Generate a password reset link so user can set their own password
    // Always use production URL for client-facing emails
    const appUrl = 'https://tracker.projectlean.app';
    
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/auth/reset-password`,
      },
    });

    if (linkError) {
      console.error('Error generating password reset link:', linkError);
    }

    // Send welcome email with secure link (NO PASSWORD)
    const resetLink = linkData?.properties?.action_link || `${appUrl}/auth`;
    
    try {
      const emailResponse = await resend.emails.send({
        from: 'Project Lean <noreply@projectlean.app>',
        to: [email],
        subject: 'Welcome to Project Lean - Set Up Your Account',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #DC2626; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <img src="https://tracker.projectlean.app/project-lean-logo.png" alt="Project Lean" style="width: 180px; height: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Project Lean! 🎉</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; color: #1a1a1a;">Hi ${fullName || 'there'},</p>
              
              <p style="font-size: 16px; color: #1a1a1a;">Your account has been created and you're ready to start tracking your meals!</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1a1a1a;">Your Account</h3>
                <p style="margin: 10px 0; color: #1a1a1a;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 10px 0; color: #6b7280;">Click the button below to set your password and get started.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: #DC2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Set Your Password & Log In</a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280;">This link will expire in 24 hours. If you need a new link, ask your coach to resend it.</p>

              <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #DC2626;">📱 Install the App on Your Phone</h3>
                <p style="font-size: 14px; color: #1a1a1a; margin-bottom: 10px;">For the best experience, add Project Lean to your home screen:</p>
                
                <p style="font-size: 14px; color: #1a1a1a; margin: 8px 0;"><strong>iPhone:</strong></p>
                <ol style="font-size: 13px; color: #4b5563; margin: 5px 0 15px 0; padding-left: 20px;">
                  <li>Open <a href="https://tracker.projectlean.app" style="color: #DC2626;">tracker.projectlean.app</a> in Safari</li>
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                </ol>
                
                <p style="font-size: 14px; color: #1a1a1a; margin: 8px 0;"><strong>Android:</strong></p>
                <ol style="font-size: 13px; color: #4b5563; margin: 5px 0 0 0; padding-left: 20px;">
                  <li>Open <a href="https://tracker.projectlean.app" style="color: #DC2626;">tracker.projectlean.app</a> in Chrome</li>
                  <li>Tap the menu (3 dots) in the top right</li>
                  <li>Tap "Add to Home Screen" or "Install App"</li>
                </ol>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you ever need to cancel your subscription, you can do so from your account settings or <a href="https://billing.stripe.com/p/login/4gw6rbcv63Gl4gw4gg" style="color: #DC2626; text-decoration: underline;">manage your subscription here</a>.</p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you have any questions, just reply to this email. We're here to help!</p>
              
              <p style="margin-bottom: 0; color: #1a1a1a;">Best regards,<br><strong>The Project Lean Team</strong></p>
            </div>
          </body>
          </html>
        `,
      });
      console.log('Welcome email sent successfully:', emailResponse);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the request if email fails - user is still created
    }

    console.log('Client created successfully:', newUser.user.id);

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating client:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});