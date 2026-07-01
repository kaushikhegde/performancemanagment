// --- Phase 1: Goal Coach agent ---
// Drafts a SMART goal (title, description, target date, types, aligned Practice
// Goals, milestones) from a one-line intent. Grounded in the real Practice Goals,
// goal taxonomy and Scyne values so suggestions map to actual records.
//
// Always resolves: if no API key is configured or the model call fails, it falls
// back to a deterministic local draft so the "Draft with AI" flow still works.

import { generateStructured, Type } from './ai';
import { COMPANY_GOALS, GOAL_TYPES, SCYNE_VALUES } from '../data/mockData';

export interface GoalDraftMilestone {
  description: string;
  targetDate: string; // YYYY-MM-DD
}

export interface GoalDraft {
  title: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  goalTypes: string[]; // subset of GOAL_TYPES
  practiceGoals: string[]; // subset of Practice Goal titles
  scyneValues: string[]; // subset of Scyne value names
  milestones: GoalDraftMilestone[];
  /** True when produced by the local fallback rather than the model. */
  isMock?: boolean;
}

const PRACTICE_GOAL_TITLES = COMPANY_GOALS.map((g) => g.title);
const SCYNE_VALUE_NAMES = SCYNE_VALUES.map((v) => v.name);

const SYSTEM = `You are Goal Coach, an assistant inside a performance-management platform.
Turn an employee's short intent into ONE well-formed, measurable (SMART) development goal.
Rules:
- Write a concise, specific title and a 1-2 sentence description with a measurable outcome.
- Choose goalTypes ONLY from this list: ${GOAL_TYPES.join(', ')}.
- Align to Practice Goals ONLY by choosing from the exact titles provided; pick 0-2 that genuinely relate.
- Align to Scyne Values ONLY by choosing from the exact names provided; pick 0-2 that genuinely relate.
- Propose 2-4 realistic milestones with target dates leading up to the goal's target date.
- Never invent Practice Goals or Values that are not in the provided lists.
- Keep everything professional and free of biased or personality-based language.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    targetDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
    goalTypes: { type: Type.ARRAY, items: { type: Type.STRING, enum: [...GOAL_TYPES] } },
    practiceGoals: { type: Type.ARRAY, items: { type: Type.STRING, enum: PRACTICE_GOAL_TITLES } },
    scyneValues: { type: Type.ARRAY, items: { type: Type.STRING, enum: SCYNE_VALUE_NAMES } },
    milestones: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          targetDate: { type: Type.STRING, description: 'YYYY-MM-DD' },
        },
        required: ['description', 'targetDate'],
      },
    },
  },
  required: ['title', 'description', 'targetDate', 'goalTypes', 'milestones'],
};

export interface GoalCoachContext {
  /** Employee's role, e.g. "Product Manager". */
  role?: string;
  /** Employee's grade, e.g. "G4". */
  grade?: string;
}

function buildPrompt(intent: string, ctx: GoalCoachContext): string {
  return [
    ctx.role ? `Employee role: ${ctx.role}` : null,
    ctx.grade ? `Employee grade: ${ctx.grade}` : null,
    `Available Practice Goals: ${PRACTICE_GOAL_TITLES.join('; ')}`,
    `Available Scyne Values: ${SCYNE_VALUE_NAMES.join('; ')}`,
    `Employee intent: "${intent}"`,
    'Return the goal as JSON matching the schema.',
  ].filter(Boolean).join('\n');
}

// --- Local fallback (no key / call failed) ---
function mockDraft(intent: string): GoalDraft {
  const clean = intent.trim().replace(/\s+/g, ' ');
  const title = clean.charAt(0).toUpperCase() + clean.slice(1, 70);
  // A rough target ~90 days out, computed off a fixed cadence (no Date.now in shared libs).
  const target = '2026-09-30';
  return {
    title: title || 'New development goal',
    description: `${title}. Define a measurable outcome and track progress against clear milestones.`,
    targetDate: target,
    goalTypes: ['Individual'],
    practiceGoals: [],
    scyneValues: [],
    milestones: [
      { description: 'Define scope, success metric and baseline', targetDate: '2026-07-31' },
      { description: 'Reach the halfway checkpoint', targetDate: '2026-08-31' },
      { description: 'Complete and review outcome', targetDate: target },
    ],
    isMock: true,
  };
}

/** Sanitize model output so only valid, in-list values reach the form. */
function sanitize(d: Partial<GoalDraft>): GoalDraft {
  const inList = (arr: unknown, allowed: string[]) =>
    Array.isArray(arr) ? (arr as string[]).filter((x) => allowed.includes(x)) : [];
  return {
    title: (d.title || '').trim() || 'New development goal',
    description: (d.description || '').trim(),
    targetDate: (d.targetDate || '').trim(),
    goalTypes: inList(d.goalTypes, [...GOAL_TYPES]),
    practiceGoals: inList(d.practiceGoals, PRACTICE_GOAL_TITLES),
    scyneValues: inList(d.scyneValues, SCYNE_VALUE_NAMES),
    milestones: Array.isArray(d.milestones)
      ? d.milestones
          .filter((m) => m && m.description)
          .map((m) => ({ description: m.description, targetDate: m.targetDate || '' }))
      : [],
  };
}

/**
 * Draft a goal from a free-text intent. Never rejects — returns a mock draft
 * (isMock: true) when AI is unavailable so the UI degrades gracefully.
 */
export async function draftGoal(intent: string, ctx: GoalCoachContext = {}): Promise<GoalDraft> {
  if (!intent.trim()) return mockDraft('New development goal');
  try {
    const raw = await generateStructured<GoalDraft>({
      system: SYSTEM,
      prompt: buildPrompt(intent, ctx),
      schema: SCHEMA,
    });
    return sanitize(raw);
  } catch {
    return mockDraft(intent);
  }
}

// --- Phase 2: alignment scoring ---
// Scores a drafted goal against each Practice Goal so the employee can pick the
// strongest alignment before submitting.

export type AlignmentBand = 'Aligned' | 'Partial' | 'Not Aligned';

export interface AlignmentResult {
  practiceGoalId: string;
  practiceGoalTitle: string;
  score: number; // 0-100
  band: AlignmentBand;
  rationale: string;
  isMock?: boolean;
}

const bandFor = (score: number): AlignmentBand =>
  score >= 70 ? 'Aligned' : score >= 40 ? 'Partial' : 'Not Aligned';

const ALIGN_SYSTEM = `You are Goal Coach's alignment scorer.
Given an employee's goal and a list of organisation Practice Goals, score how strongly the
goal contributes to EACH Practice Goal from 0 (unrelated) to 100 (directly advances it).
Give a one-sentence rationale per Practice Goal. Score every Practice Goal provided.`;

const ALIGN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    alignments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          practiceGoalTitle: { type: Type.STRING, enum: PRACTICE_GOAL_TITLES },
          score: { type: Type.NUMBER },
          rationale: { type: Type.STRING },
        },
        required: ['practiceGoalTitle', 'score', 'rationale'],
      },
    },
  },
  required: ['alignments'],
};

// Simple keyword-overlap scoring used when AI is unavailable.
function mockAlignment(title: string, description: string): AlignmentResult[] {
  const text = `${title} ${description}`.toLowerCase();
  const words = new Set(text.split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  return COMPANY_GOALS.map((g) => {
    const gWords = `${g.title} ${g.pillar || ''}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
    const hits = gWords.filter((w) => words.has(w)).length;
    const score = Math.min(100, hits * 34); // 0, 34, 68, 100…
    return {
      practiceGoalId: g.id,
      practiceGoalTitle: g.title,
      score,
      band: bandFor(score),
      rationale: hits > 0 ? `Shares themes with "${g.pillar || g.title}".` : 'No obvious overlap detected.',
      isMock: true,
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Score a drafted goal's alignment to every Practice Goal, best match first.
 * Falls back to keyword-overlap scoring when AI is unavailable.
 */
export async function scoreAlignment(title: string, description: string): Promise<AlignmentResult[]> {
  if (!title.trim() && !description.trim()) return [];
  try {
    const raw = await generateStructured<{ alignments: { practiceGoalTitle: string; score: number; rationale: string }[] }>({
      system: ALIGN_SYSTEM,
      prompt: [
        `Available Practice Goals: ${PRACTICE_GOAL_TITLES.join('; ')}`,
        `Goal title: ${title}`,
        `Goal description: ${description}`,
      ].join('\n'),
      schema: ALIGN_SCHEMA,
    });
    const byTitle = new Map(COMPANY_GOALS.map((g) => [g.title, g.id]));
    const results = (raw.alignments || [])
      .filter((a) => byTitle.has(a.practiceGoalTitle))
      .map((a) => {
        const score = Math.max(0, Math.min(100, Math.round(a.score)));
        return {
          practiceGoalId: byTitle.get(a.practiceGoalTitle)!,
          practiceGoalTitle: a.practiceGoalTitle,
          score,
          band: bandFor(score),
          rationale: a.rationale,
        } as AlignmentResult;
      })
      .sort((a, b) => b.score - a.score);
    return results.length ? results : mockAlignment(title, description);
  } catch {
    return mockAlignment(title, description);
  }
}
