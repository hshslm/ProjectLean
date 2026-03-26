import { Resend } from 'https://esm.sh/resend@2.0.0';

import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const FEEDBACK_RECIPIENT = 'karimzaki@projectleaneg.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  const rid = generateRequestId();

  try {
    const { message, email, name } = await req.json();

    if (!message?.trim()) {
      return errorResponse(req, 'Please enter a message.', 400, rid);
    }

    const userName = name || email || 'Anonymous';
    const userEmail = email || 'no-reply@projectlean.app';

    await resend.emails.send({
      from: 'Project Lean <noreply@projectlean.app>',
      to: [FEEDBACK_RECIPIENT],
      replyTo: userEmail,
      subject: `Lean Brain Feedback from ${userName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #C23B22; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0; font-size: 18px;">User Feedback</h2>
          </div>
          <div style="background: #ffffff; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 4px 0;"><strong>From:</strong> ${userName}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0;"><strong>Email:</strong> ${userEmail}</p>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 15px; color: #1a1a1a; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`[${rid}] Feedback sent from ${userEmail}`);

    return new Response(
      JSON.stringify({ success: true, requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return errorResponse(req, 'Could not send feedback. Please try again.', 500, rid, error?.message);
  }
});
