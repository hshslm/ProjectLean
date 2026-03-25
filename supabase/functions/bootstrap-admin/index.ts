import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, generateRequestId, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: getCorsHeaders(req) });
  }

  try {
    const rid = generateRequestId();

    const { email, password, secret } = await req.json();

    // Require a bootstrap secret to prevent unauthorized access
    const bootstrapSecret = Deno.env.get('BOOTSTRAP_SECRET');
    if (!bootstrapSecret || secret !== bootstrapSecret) {
      return errorResponse(req, 'Unauthorized. Invalid bootstrap secret.', 401, rid);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if any admins exist
    const { data: existingAdmins, error: checkError } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      return errorResponse(req, checkError.message, 500, rid);
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return errorResponse(req, 'An admin already exists. This function can only be used for initial setup.', 403, rid);
    }

    if (!email || !password) {
      return errorResponse(req, 'Email and password are required', 400, rid);
    }

    // Create the admin user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Admin' },
    });

    if (createError) {
      return errorResponse(req, createError.message, 400, rid);
    }

    // Assign admin role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'admin' });

    if (roleError) {
      return errorResponse(req, roleError.message, 500, rid);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin account created successfully', requestId: rid }),
      { status: 200, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const rid = generateRequestId();
    return errorResponse(req, 'Something went wrong. Please try again.', 500, rid, error?.message);
  }
});
