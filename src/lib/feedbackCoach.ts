// --- Feedback Coach agent ---
// Polishes a rough feedback note into specific, behavioural, constructive feedback
// matching the chosen type, and flags biased/vague/personality-based language.
// Falls back to a light deterministic rewrite when AI is off.

import { generateStructured, Type } from './ai';

export interface FeedbackPolish {
  polished: string;
  biasFlags: { phrase: string; suggestion: string }[];
  isMock?: boolean;
}

const SYSTEM = `You are Feedback Coach, helping someone write better peer feedback.
Rewrite the draft into clear, specific, BEHAVIOURAL feedback (what was observed → impact →
a forward-looking suggestion), matching the requested feedback type.
Rules:
- Keep it professional, concise (<= 400 characters) and in the first person.
- Prefer concrete observations over personality judgments.
- Flag any biased, vague or personality-based phrases in the ORIGINAL draft (e.g. "not a team
  player", "lacks presence") and give a specific behavioural replacement. If none, return [].
- Do not invent facts not implied by the draft. Plain text, no markdown.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    polished: { type: Type.STRING },
    biasFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { phrase: { type: Type.STRING }, suggestion: { type: Type.STRING } },
        required: ['phrase', 'suggestion'],
      },
    },
  },
  required: ['polished', 'biasFlags'],
};

// Very small heuristic rewrite + bias scan for the no-API fallback.
const BIAS_TERMS: { phrase: string; suggestion: string }[] = [
  { phrase: 'not a team player', suggestion: 'describe a specific collaboration moment and its impact' },
  { phrase: 'lacks presence', suggestion: 'name the specific situation where more visible input would have helped' },
  { phrase: 'not leadership material', suggestion: 'cite a concrete leadership behaviour to develop' },
  { phrase: 'difficult', suggestion: 'describe the specific behaviour you observed' },
  { phrase: 'lazy', suggestion: 'reference the specific missed commitment or deadline' },
  { phrase: 'always', suggestion: 'give a specific example instead of a generalisation' },
  { phrase: 'never', suggestion: 'give a specific example instead of a generalisation' },
];

function mockPolish(message: string, type: string): FeedbackPolish {
  const draft = message.trim().replace(/\s+/g, ' ');
  const lower = draft.toLowerCase();
  const flags = BIAS_TERMS.filter((b) => lower.includes(b.phrase));
  let polished = draft.charAt(0).toUpperCase() + draft.slice(1);
  if (!/[.!?]$/.test(polished)) polished += '.';
  if (type === 'Constructive') {
    polished += ' Going forward, it would help to agree a specific, measurable next step.';
  } else if (type === 'Recognition') {
    polished = 'Thank you — ' + polished.charAt(0).toLowerCase() + polished.slice(1) + ' The impact on the team was clear.';
  }
  return { polished: polished.slice(0, 400), biasFlags: flags, isMock: true };
}

/** Polish a feedback draft. Never rejects — returns a light local rewrite when AI is off. */
export async function polishFeedback(input: { message: string; type: string; recipient?: string }): Promise<FeedbackPolish> {
  if (!input.message.trim()) return { polished: '', biasFlags: [], isMock: true };
  try {
    const prompt = [
      `Feedback type: ${input.type}`,
      input.recipient ? `Recipient: ${input.recipient}` : null,
      `Draft: "${input.message.trim()}"`,
    ].filter(Boolean).join('\n');
    const raw = await generateStructured<FeedbackPolish>({ system: SYSTEM, prompt, schema: SCHEMA });
    return {
      polished: (raw.polished || '').trim().slice(0, 400) || mockPolish(input.message, input.type).polished,
      biasFlags: Array.isArray(raw.biasFlags) ? raw.biasFlags.filter((b) => b && b.phrase) : [],
    };
  } catch {
    return mockPolish(input.message, input.type);
  }
}
