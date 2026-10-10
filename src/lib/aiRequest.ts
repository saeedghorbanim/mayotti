import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';

export const functionUrl = (name: 'chat' | 'analyze-receipt' | 'transcribe') =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;

/**
 * Headers for calls to the AI edge functions. The server verifies the RevenueCat
 * customer's `premium` entitlement and enforces the monthly quota, so the app
 * user ID must be sent on native. Web has no RevenueCat, so requests from
 * `npm run dev` are rejected by deployed functions.
 */
export async function aiRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };

  if (Capacitor.isNativePlatform()) {
    try {
      const { appUserID } = await Purchases.getAppUserID();
      headers['x-rc-app-user-id'] = appUserID;
    } catch (error) {
      console.error('Failed to read RevenueCat app user ID:', error);
    }
  }

  return headers;
}

/** Error thrown for non-OK AI responses, carrying the server's error code. */
export class AiRequestError extends Error {
  constructor(public status: number, public code?: string) {
    super(`AI request failed (${status}${code ? `: ${code}` : ''})`);
  }
}

export async function toAiRequestError(response: Response): Promise<AiRequestError> {
  let code: string | undefined;
  try {
    code = (await response.json())?.code;
  } catch {
    // Non-JSON body
  }
  return new AiRequestError(response.status, code);
}
