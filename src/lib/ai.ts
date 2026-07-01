// --- Phase 0 + Phase 4: browser-side AI client ---
// The browser NEVER sees the Gemini API key. It POSTs the (system, prompt, schema)
// to our own Express endpoint (server.js → POST /api/ai/generate), which holds the
// key and calls Gemini. This module has no @google/genai import, so the key and the
// SDK stay out of the client bundle.
//
// In `vite` dev the request is proxied to the Express server (see vite.config.ts).
// If the endpoint is unreachable or unconfigured, generateStructured throws and the
// feature modules (goalCoach, teamGoalsCoach) fall back to their local mock output.

// Mirror of @google/genai's `Type` enum values (plain strings) so schemas can be
// built client-side and serialized to the server without importing the SDK.
export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;

export interface GenerateOptions {
  /** System instruction — the agent's role and rules. */
  system: string;
  /** The user/task prompt, already grounded with real platform data. */
  prompt: string;
  /** A responseSchema (built with the exported `Type`) forcing valid JSON. */
  schema: object;
}

// Once we learn AI is unavailable (no server, or key not configured) we stop
// hitting the network on every action and let callers use their mock output.
let aiUnavailable = false;

/**
 * Structured generation via the server proxy. Returns a validated object of type T.
 * Throws (so callers fall back to a local mock) when AI is unavailable or errors.
 */
export async function generateStructured<T>(opts: GenerateOptions): Promise<T> {
  if (aiUnavailable) throw new Error('AI_UNAVAILABLE');

  let res: Response;
  try {
    res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
  } catch {
    // No server / network error (e.g. plain `vite` dev with no proxy target).
    aiUnavailable = true;
    throw new Error('AI_UNAVAILABLE');
  }

  if (res.status === 503) {
    // Server is up but has no API key configured.
    aiUnavailable = true;
    throw new Error('AI_NOT_CONFIGURED');
  }
  if (!res.ok) throw new Error(`AI_ERROR_${res.status}`);

  return (await res.json()) as T;
}
