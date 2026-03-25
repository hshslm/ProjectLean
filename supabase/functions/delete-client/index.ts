import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.2.0';
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const rid = generateRequestId();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse(req, 'Missing authorization header', 401, rid);
    }
    
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify JWT using JWKS (works with ES256 signing keys)
    const JWKS = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
    
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(jwt, JWKS, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      });
      payload = verifiedPayload;
    } catch (jwtError) {
      console.error(`[${rid}] JWT verification failed:`, jwtError);
      return errorResponse(req, 'Unauthorized', 401, rid);
    }
    
    const requestingUserId = payload.sub as string;
    console.log('Verified user:', requestingUserId);
    
    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if requesting user is admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return errorResponse(req, 'Only admins can delete clients', 403, rid);
    }

    const { clientUserId } = await req.json();

    if (!clientUserId) {
      return errorResponse(req, 'Client user ID is required', 400, rid);
    }

    // Prevent admin from deleting themselves
    if (clientUserId === requestingUserId) {
      return errorResponse(req, 'Cannot delete your own account', 400, rid);
    }

    // Check that the user being deleted is not an admin
    const { data: targetRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', clientUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (targetRoleData) {
      return errorResponse(req, 'Cannot delete admin accounts', 403, rid);
    }

    // Delete the user from auth.users (this will cascade delete related records)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(clientUserId);

    if (deleteError) {
      console.error(`[${rid}] Error deleting user:`, deleteError);
      return errorResponse(req, deleteError.message, 400, rid);
    }

    console.log('Client deleted successfully:', clientUserId);

    return new Response(
      JSON.stringify({ success: true, requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, error?.message);
  }
});
