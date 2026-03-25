import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2.0.0';

import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface WelcomeEmailRequest {
  email: string;
  fullName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const rid = generateRequestId();

    const { email, fullName }: WelcomeEmailRequest = await req.json();

    if (!email) {
      return errorResponse(req, 'Email is required', 400, rid);
    }

    const appUrl = req.headers.get('origin') || 'https://theleanbrain.projectlean.app';
    
    // Send welcome email with Lean Brain positioning
    const emailResponse = await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [email],
      subject: 'Welcome to The Lean Brain™',
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
            
            <p style="font-size: 15px;">You now have access to <strong>The Lean Brain™</strong>.</p>
            
            <p style="font-size: 15px;">This is not a calorie tracker.<br>This is your <strong>behavior intelligence system</strong>.</p>

            <!-- Credentials -->
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280;">Your Login</p>
              <p style="margin: 0 0 4px 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 0; font-size: 13px; color: #6b7280;">You set your password during signup. Use it to log in below.</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${appUrl}/auth" style="background: #C23B22; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">Log In Now</a>
            </div>

            <!-- The Goal -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 24px;">
              <p style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">The goal is simple:</p>
              <ul style="font-size: 14px; padding-left: 20px; color: #374151;">
                <li>Eliminate all-or-nothing thinking.</li>
                <li>Increase recovery speed.</li>
                <li>Build minimum effective consistency.</li>
              </ul>
            </div>

            <!-- How to use -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
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

            <p style="font-size: 14px; color: #374151; font-style: italic;">If you ever feel stuck, ask yourself: "What's the next best action?" Then execute that.</p>

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

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id, requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, error?.message);
  }
});