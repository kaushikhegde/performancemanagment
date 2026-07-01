// --- Self-Assessment Coach agent (employee-side) ---
// Helps an employee write their self-review: drafts per-goal self-commentary from
// the goal + their self-rating, and compiles an overall summary narrative plus
// reflection prompts from all goals & competencies. Degrades to local drafts when off.

import { generateStructured, Type } from './ai';

// --- Per-goal self-commentary ---
export interface GoalReflectionInput {
  goalTitle: string;
  goalDescription?: string;
  selfRating?: string;
}

export interface AIText {
  text: string;
  isMock?: boolean;
}

const GOAL_SYSTEM = `You are Self-Assessment Coach, helping an employee write their own self-review.
Draft a concise (2-4 sentence), first-person self-commentary for ONE goal.
Ground it in the goal and the employee's self-rating: describe achievements, challenges and impact.
Be specific and professional; do not invent metrics that aren't implied. Plain text, no markdown.`;

const TEXT_SCHEMA = {
  type: Type.OBJECT,
  properties: { text: { type: Type.STRING } },
  required: ['text'],
};

function mockGoalReflection(input: GoalReflectionInput): AIText {
  const r = input.selfRating || 'Met';
  const tone = r === 'Exceeded' ? 'exceeded expectations' : r === 'Met' ? 'delivered on the target' : r === 'Partial' ? 'made partial progress' : 'fell short of the target';
  return {
    text: `I ${tone} on "${input.goalTitle}". I focused on the core priorities and drove measurable progress, while navigating a few challenges along the way. ${r === 'Exceeded' || r === 'Met' ? 'The work had a clear positive impact on the team and our goals.' : 'Next period I plan to address the gaps with a clearer plan and earlier support.'}`,
    isMock: true,
  };
}

/** Draft self-commentary for a single goal. Never rejects. */
export async function draftGoalReflection(input: GoalReflectionInput): Promise<AIText> {
  try {
    const prompt = [
      `Goal: ${input.goalTitle}`,
      input.goalDescription ? `Description: ${input.goalDescription}` : null,
      input.selfRating ? `Employee self-rating: ${input.selfRating}` : null,
    ].filter(Boolean).join('\n');
    const raw = await generateStructured<AIText>({ system: GOAL_SYSTEM, prompt, schema: TEXT_SCHEMA });
    return { text: (raw.text || '').trim() || mockGoalReflection(input).text };
  } catch {
    return mockGoalReflection(input);
  }
}

// --- Overall summary + reflection prompts ---
export interface SummaryInput {
  goals: { title: string; rating?: string; comment?: string }[];
  competencies: { title: string; rating?: string }[];
}

export interface SummaryResult {
  summary: string;
  reflectionPrompts: string[];
  isMock?: boolean;
}

const SUMMARY_SYSTEM = `You are Self-Assessment Coach, helping an employee write their overall self-review summary.
From the employee's goals (with self-ratings/notes) and competency self-ratings:
- Write a first-person, 4-6 sentence overall reflection: key accomplishments, how they grew, and where they want to grow next.
- Also provide 2-3 reflection prompts (open questions) to help them add depth.
Ground everything in the provided data. Do not invent achievements. Plain text, no markdown.`;

const SUMMARY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    reflectionPrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'reflectionPrompts'],
};

function mockSummary(input: SummaryInput): SummaryResult {
  const strong = input.goals.filter((g) => g.rating === 'Exceeded' || g.rating === 'Met');
  const topGoal = strong[0] || input.goals[0];
  const topComp = input.competencies.slice().sort((a, b) => (+(b.rating || 0)) - (+(a.rating || 0)))[0];
  return {
    summary: `This period I'm most proud of my work on ${topGoal ? `"${topGoal.title}"` : 'my key goals'}, where I ${strong.length ? 'delivered strong, measurable outcomes' : 'made meaningful progress'}. ${topComp ? `I've grown notably in ${topComp.title}.` : ''} I collaborated closely across the team and stayed focused on impact. Looking ahead, I want to deepen my long-term strategic thinking and take on broader ownership. Overall this has been a period of solid, consistent contribution and growth.`,
    reflectionPrompts: [
      'What was the single accomplishment you are most proud of, and what was its impact?',
      'Where did you face the biggest challenge, and how did you respond?',
      'What skill do you most want to develop next period, and why?',
    ],
    isMock: true,
  };
}

/** Compile an overall self-review summary + reflection prompts. Never rejects. */
export async function draftOverallSummary(input: SummaryInput): Promise<SummaryResult> {
  try {
    const prompt = [
      'Goals:',
      ...input.goals.map((g) => `- ${g.title}${g.rating ? ` (self-rated: ${g.rating})` : ''}${g.comment ? ` — note: ${g.comment}` : ''}`),
      'Competency self-ratings:',
      ...input.competencies.map((c) => `- ${c.title}: ${c.rating || 'unrated'}/5`),
      'Return JSON matching the schema.',
    ].join('\n');
    const raw = await generateStructured<SummaryResult>({ system: SUMMARY_SYSTEM, prompt, schema: SUMMARY_SCHEMA });
    return {
      summary: (raw.summary || '').trim() || mockSummary(input).summary,
      reflectionPrompts: Array.isArray(raw.reflectionPrompts) ? raw.reflectionPrompts.filter(Boolean) : mockSummary(input).reflectionPrompts,
    };
  } catch {
    return mockSummary(input);
  }
}
