import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  password: string;
  fullName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName }: WelcomeEmailRequest = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appUrl = req.headers.get('origin') || 'https://snap-macro-sight.lovable.app';
    
    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectleaneg.com>',
      to: [email],
      subject: 'Welcome to Project Lean - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #8B9A7D 0%, #6B7A5D 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Project Lean! 🎉</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px;">Hi ${fullName || 'there'},</p>
            
            <p style="font-size: 16px;">Your account has been created and you're ready to start tracking your meals with AI-powered macro analysis!</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Your Login Details</h3>
              <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Password:</strong> ${password}</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">Keep these credentials safe. You can change your password anytime from your account settings.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/auth" style="background: linear-gradient(135deg, #8B9A7D 0%, #6B7A5D 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Log In Now</a>
            </div>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #8B9A7D; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #374151;"><strong>🎁 You have 6 free meal scans!</strong><br>Just snap a photo of your meal and our AI will analyze the macros for you.</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">If you have any questions, just reply to this email. We're here to help!</p>
            
            <p style="margin-bottom: 0;">Best regards,<br><strong>The Project Lean Team</strong></p>
          </div>
        </body>
        </html>
      `,
    });

    console.log('Welcome email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending welcome email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});