import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface EdgeFunctionResponse<T = any> {
  data: T | null;
  status: number;
  error: string | null;
}

/**
 * Invoke a Supabase Edge Function via direct fetch for full control over
 * response status codes and error bodies.
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body?: Record<string, any>,
): Promise<EdgeFunctionResponse<T>> {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      data: null,
      status: response.status,
      error: errorData.error || `Request failed with status ${response.status}`,
    };
  }

  const data = await response.json();
  return { data, status: response.status, error: null };
}
