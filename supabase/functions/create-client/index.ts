import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://theleanbrain.projectlean.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
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

    // Generate a custom invitation token with 24-hour expiry
    const appUrl = 'https://theleanbrain.projectlean.app';
    
    // Create a secure random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const invitationToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Store the invitation in the database
    const { error: inviteError } = await adminClient
      .from('client_invitations')
      .insert({
        user_id: newUser.user.id,
        token: invitationToken,
        email: email,
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
    }

    // Create the invitation link
    const inviteLink = `${appUrl}/set-password?token=${invitationToken}`;
    
    try {
      const emailResponse = await resend.emails.send({
        from: 'Project Lean <noreply@projectlean.app>',
        to: [email],
        subject: 'Welcome to The Lean Brain™ — Set Up Your Account',
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
              <img src="https://theleanbrain.projectlean.app/email-logo-white.png" alt="Project Lean" style="height: 40px; margin-bottom: 12px;" />
              <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Welcome to The Lean Brain™</h1>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              
              <p style="font-size: 16px; margin-top: 0;">Hi ${fullName || 'there'},</p>
              
              <p style="font-size: 15px;">Your account has been created. You now have access to <strong>The Lean Brain™</strong> — your behavior intelligence system.</p>

              <p style="font-size: 15px;">This is not a calorie tracker.<br>This is how you build <strong>minimum effective consistency</strong>.</p>

              <!-- Account Details -->
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Your Account</p>
                <p style="margin: 0 0 4px 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 0; font-size: 13px; color: #6b7280;">Click the button below to set your password and get started.</p>
              </div>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${inviteLink}" style="background: #C23B22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Set Your Password & Log In</a>
              </div>
              
              <p style="font-size: 13px; color: #6b7280; text-align: center;">This link expires in 24 hours. If you need a new one, ask your coach.</p>

              <!-- How to use -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
                <p style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">Here's how to use it properly:</p>
                <ol style="font-size: 14px; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;"><strong>Complete the daily check-in.</strong> It takes 60 seconds.</li>
                  <li style="margin-bottom: 8px;"><strong>Select the thought pattern that showed up.</strong> Be honest. That's where progress happens.</li>
                  <li style="margin-bottom: 8px;"><strong>Read the AI response carefully.</strong> It's designed to challenge your thinking — not motivate you temporarily.</li>
                  <li><strong>Review your weekly behavior insights.</strong> Consistency and recovery matter more than perfection.</li>
                </ol>
              </div>

              <!-- Important -->
              <div style="background: #FFF8F6; padding: 16px; border-radius: 8px; border-left: 4px solid #C23B22; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #374151;">
                  <strong>Important:</strong> You are not trying to have perfect days. You are trying to reduce the time between a mistake and a correction. That's how sustainable fat loss happens.
                </p>
              </div>

              <!-- Install the App -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <p style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">📱 Install the App on Your Phone</p>
                <p style="font-size: 13px; color: #374151; margin-bottom: 10px;">For the best experience, add The Lean Brain™ to your home screen:</p>
                
                <p style="font-size: 13px; color: #1a1a1a; margin: 8px 0;"><strong>iPhone:</strong></p>
                <ol style="font-size: 13px; color: #4b5563; margin: 5px 0 12px 0; padding-left: 20px;">
                  <li>Open <a href="https://theleanbrain.projectlean.app" style="color: #C23B22;">theleanbrain.projectlean.app</a> in Safari</li>
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                </ol>
                
                <p style="font-size: 13px; color: #1a1a1a; margin: 8px 0;"><strong>Android:</strong></p>
                <ol style="font-size: 13px; color: #4b5563; margin: 5px 0 0 0; padding-left: 20px;">
                  <li>Open <a href="https://theleanbrain.projectlean.app" style="color: #C23B22;">theleanbrain.projectlean.app</a> in Chrome</li>
                  <li>Tap the menu (3 dots) in the top right</li>
                  <li>Tap "Add to Home Screen" or "Install App"</li>
                </ol>
              </div>

              <p style="font-size: 14px; color: #374151; margin-top: 24px; margin-bottom: 0;">
                Welcome to The Lean Brain™.<br><br>
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