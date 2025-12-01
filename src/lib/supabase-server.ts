import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Create a Supabase client for API routes
 * 
 * This app uses CLIENT-SIDE auth (localStorage), not cookie-based auth.
 * So API routes need to receive the access token in the Authorization header.
 * 
 * Usage in API route:
 *   const { supabase, userId } = await createAuthenticatedSupabase(request);
 */
export async function createAuthenticatedSupabase(request?: NextRequest) {
  // Service role client for database operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // If no request provided, return service client without user context
  if (!request) {
    return { supabase, userId: null };
  }

  // Try to get auth token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No Authorization header found');
    return { supabase, userId: null };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify the token and get the user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    console.log('[Auth] Token verification failed:', error?.message);
    return { supabase, userId: null };
  }

  console.log('[Auth] User verified:', user.id);
  return { supabase, userId: user.id };
}
