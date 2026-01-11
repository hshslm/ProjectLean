import { Resend } from 'https://esm.sh/resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthEmailPayload = await req.json();
    const { user, email_data } = payload;
    
    const userEmail = user.email;
    const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
    const { token_hash, redirect_to, email_action_type, site_url } = email_data;

    console.log("Auth email request:", { email_action_type, userEmail });

    let subject = "";
    let htmlContent = "";
    
    // Build the confirmation URL
    const baseUrl = redirect_to || site_url || "https://tracker.projectlean.app";
    const confirmationUrl = `${baseUrl.replace('/auth?reset=true', '')}/auth?token_hash=${token_hash}&type=${email_action_type}`;

    switch (email_action_type) {
      case "recovery":
        subject = "Reset Your Project Lean Password";
        htmlContent = `
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
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: #FF6B5B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
              <p style="color: #999999; font-size: 14px; margin: 24px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 32px;">
              © ${new Date().getFullYear()} Project Lean. All rights reserved.
            </p>
          </div>
        `;
        break;

      case "signup":
      case "email_confirmation":
        subject = "Confirm Your Project Lean Account";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Project Lean</h1>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
              <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Welcome to Project Lean!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${userName},<br><br>
                Thanks for signing up! Click the button below to confirm your email:
              </p>
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: #FF6B5B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Confirm Email
              </a>
              <p style="color: #999999; font-size: 14px; margin: 24px 0 0;">
                You're getting 10 free meal scans to start!
              </p>
            </div>
            <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 32px;">
              © ${new Date().getFullYear()} Project Lean. All rights reserved.
            </p>
          </div>
        `;
        break;

      case "invite":
        subject = "You've Been Invited to Project Lean";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Project Lean</h1>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
              <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">You're Invited!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${userName},<br><br>
                You've been invited to join Project Lean. Click the button below to accept:
              </p>
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: #FF6B5B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 32px;">
              © ${new Date().getFullYear()} Project Lean. All rights reserved.
            </p>
          </div>
        `;
        break;

      default:
        subject = "Project Lean Notification";
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0;">Project Lean</h1>
            </div>
            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hi ${userName},<br><br>
                Click the button below to continue:
              </p>
              <a href="${confirmationUrl}" 
                 style="display: inline-block; background: #FF6B5B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Continue
              </a>
            </div>
            <p style="color: #999999; font-size: 12px; text-align: center; margin-top: 32px;">
              © ${new Date().getFullYear()} Project Lean. All rights reserved.
            </p>
          </div>
        `;
    }

    const emailResponse = await resend.emails.send({
      from: "Project Lean <noreply@projectlean.app>",
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
