import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const rid = generateRequestId();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { token, newPassword } = await req.json();

    if (!token) {
      return errorResponse(req, 'Token is required', 400, rid);
    }

    // Find the invitation by token
    const { data: invitation, error: fetchError } = await adminClient
      .from('client_invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (fetchError) {
      console.error(`[${rid}] Error fetching invitation:`, fetchError);
      return errorResponse(req, 'Failed to validate token', 500, rid);
    }

    if (!invitation) {
      return errorResponse(req, 'Invalid or expired invitation link', 400, rid);
    }

    // Check if already used
    if (invitation.used_at) {
      return errorResponse(req, 'This invitation link has already been used', 400, rid);
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return errorResponse(req, 'This invitation link has expired. Please contact your coach for a new link.', 400, rid);
    }

    // If just validating (no password provided), return success
    if (!newPassword) {
      return new Response(
        JSON.stringify({ valid: true, email: invitation.email, requestId: rid }),
        { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      );
    }

    // Set the user's password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      invitation.user_id,
      { password: newPassword }
    );

    if (updateError) {
      console.error(`[${rid}] Error updating password:`, updateError);
      return errorResponse(req, 'Failed to set password', 500, rid);
    }

    // Mark invitation as used
    await adminClient
      .from('client_invitations')
      .update({ used_at: new Date().toISOString() })
      .eq('id', invitation.id);

    console.log('Password set successfully for user:', invitation.user_id);

    return new Response(
      JSON.stringify({ success: true, email: invitation.email, requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, error?.message);
  }
});
