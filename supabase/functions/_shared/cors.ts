const ALLOWED_ORIGINS = [
  'https://theleanbrain.projectlean.app',
  'https://project-lean.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];

export function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}

export function errorResponse(
  req: Request,
  message: string,
  status: number,
  requestId: string,
  details?: string,
): Response {
  if (details) console.error(`[${requestId}] ${message}:`, details);
  else console.error(`[${requestId}] ${message}`);
  return new Response(
    JSON.stringify({ error: message, requestId }),
    { status, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
  );
}

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  };
}
