import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Shared request guard for the paid AI endpoints (chat, analyze-receipt, transcribe).
//
// The Supabase publishable key ships inside the app bundle, so it proves nothing
// about the caller. Every AI request must instead identify a RevenueCat customer
// (x-rc-app-user-id) whose `premium` entitlement is verified server-side with the
// RevenueCat secret key, and is then charged against a server-side monthly quota.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-rc-app-user-id',
};

export type AiRequestKind = 'chat' | 'receipt' | 'transcribe';

// Keep `chat` in sync with MONTHLY_PROMPT_LIMIT in src/hooks/usePromptLimit.ts.
// A receipt send also triggers a chat call, and voice is transcribed before it is
// sent as chat, so those get their own (looser) caps rather than sharing chat's.
const MONTHLY_LIMITS: Record<AiRequestKind, number> = {
  chat: 30,
  receipt: 30,
  transcribe: 60,
};

const ENTITLEMENT_ID = 'premium';
const APP_USER_ID_PATTERN = /^[A-Za-z0-9$:._-]{1,100}$/;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function hasActiveEntitlement(appUserId: string, secretKey: string): Promise<boolean> {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  if (!response.ok) {
    console.error('RevenueCat lookup failed:', response.status);
    return false;
  }

  const data = await response.json();
  const entitlement = data?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  if (!entitlement) return false;

  // A null expires_date means a non-expiring (lifetime) entitlement.
  const expiresAt = entitlement.grace_period_expires_date ?? entitlement.expires_date;
  return expiresAt === null || new Date(expiresAt).getTime() > Date.now();
}

/**
 * Returns null when the request may proceed, or an error Response to send back.
 * Fails closed: if verification can't be performed, the request is rejected.
 */
export async function authorizeAiRequest(req: Request, kind: AiRequestKind): Promise<Response | null> {
  const appUserId = req.headers.get('x-rc-app-user-id')?.trim();
  if (!appUserId || !APP_USER_ID_PATTERN.test(appUserId)) {
    return jsonResponse({ error: 'Subscription required.', code: 'subscription_required' }, 401);
  }

  const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!revenueCatSecretKey || !supabaseUrl || !serviceRoleKey) {
    console.error('AI guard is missing REVENUECAT_SECRET_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse({ error: 'Service configuration error' }, 500);
  }

  try {
    if (!(await hasActiveEntitlement(appUserId, revenueCatSecretKey))) {
      return jsonResponse({ error: 'Subscription required.', code: 'subscription_required' }, 403);
    }
  } catch (error) {
    console.error('Entitlement check error:', error);
    return jsonResponse({ error: 'Unable to verify subscription.' }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: allowed, error } = await admin.rpc('consume_ai_quota', {
    p_app_user_id: appUserId,
    p_kind: kind,
    p_limit: MONTHLY_LIMITS[kind],
  });
  if (error) {
    console.error('Quota check error:', error);
    return jsonResponse({ error: 'Service temporarily unavailable.' }, 503);
  }
  if (!allowed) {
    return jsonResponse({ error: 'Monthly limit reached.', code: 'quota_exceeded' }, 429);
  }

  return null;
}
