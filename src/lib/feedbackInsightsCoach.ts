// --- Feedback Insights synthesizer ---
// Turns raw feedback signals (themes, competency benchmarks, ratings, comments)
// into a development-ready read: a summary, evidenced strengths & development
// areas, and recommended actions. Falls back to a deterministic synthesis when off.

import { generateStructured, Type } from './ai';

export interface InsightsContext {
  subject?: string;       // whose feedback (person or team)
  avgRating?: string;
  responses?: number;
  themes: { word: string; count: number }[];
  benchmarks: { comp: string; percentile: number }[];
  comments?: string[];
}

export interface InsightsResult {
  summary: string;
  strengths: string[];        // evidenced
  developmentAreas: string[]; // evidenced
  recommendedActions: string[];
  isMock?: boolean;
}

const SYSTEM = `You are a people-analytics assistant synthesizing an employee's feedback data.
From the competency benchmarks (percentile vs peers), recurring comment themes, ratings and any
raw comments, produce a development-ready read:
- summary: 2-3 sentences on the overall picture.
- strengths: 2-3 clear strengths, each citing the theme/percentile that evidences it.
- developmentAreas: 1-3 growth areas, each citing the evidence.
- recommendedActions: 2-3 concrete, specific next steps.
Ground everything in the data; do not invent. Plain text, no markdown.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    developmentAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'strengths', 'developmentAreas', 'recommendedActions'],
};

function mockInsights(ctx: InsightsContext): InsightsResult {
  const ranked = [...ctx.benchmarks].sort((a, b) => b.percentile - a.percentile);
  const top = ranked.slice(0, 2);
  const bottom = ranked.slice(-2).reverse();
  const topThemes = [...ctx.themes].sort((a, b) => b.count - a.count).slice(0, 3).map((t) => t.word);

  return {
    summary: `Feedback is broadly positive${ctx.avgRating ? ` (avg ${ctx.avgRating})` : ''}${ctx.responses ? ` across ${ctx.responses} responses` : ''}. Strongest signals are ${top.map((t) => t.comp).join(' and ')}, while ${bottom[0]?.comp || 'communication'} stands out as the clearest growth area.`,
    strengths: top.map((t) => `${t.comp} — ${t.percentile}th percentile vs peers${topThemes.length ? `; reinforced by recurring "${topThemes[0]}" feedback` : ''}.`),
    developmentAreas: bottom.map((b) => `${b.comp} — ${b.percentile}th percentile, below the peer band; a focused development area.`),
    recommendedActions: [
      `Set a measurable goal targeting ${bottom[0]?.comp || 'the lowest area'} this cycle.`,
      `Request targeted feedback on ${bottom[0]?.comp || 'that area'} from 2-3 peers.`,
      `Leverage your strength in ${top[0]?.comp || 'your top competency'} to mentor others and increase visibility.`,
    ],
    isMock: true,
  };
}

/** Synthesize feedback insights. Never rejects — returns a deterministic synthesis when AI is off. */
export async function synthesizeInsights(ctx: InsightsContext): Promise<InsightsResult> {
  try {
    const prompt = [
      ctx.subject ? `Subject: ${ctx.subject}` : null,
      ctx.avgRating ? `Average rating: ${ctx.avgRating}` : null,
      ctx.responses ? `Responses: ${ctx.responses}` : null,
      'Competency benchmarks (percentile vs peers):',
      ...ctx.benchmarks.map((b) => `- ${b.comp}: ${b.percentile}th`),
      'Comment themes (word: frequency):',
      ...ctx.themes.map((t) => `- ${t.word}: ${t.count}`),
      ctx.comments?.length ? 'Sample comments:' : null,
      ...(ctx.comments || []).map((c) => `- "${c}"`),
      'Return JSON matching the schema.',
    ].filter(Boolean).join('\n');
    const raw = await generateStructured<InsightsResult>({ system: SYSTEM, prompt, schema: SCHEMA });
    const m = mockInsights(ctx);
    return {
      summary: (raw.summary || '').trim() || m.summary,
      strengths: Array.isArray(raw.strengths) && raw.strengths.length ? raw.strengths.filter(Boolean) : m.strengths,
      developmentAreas: Array.isArray(raw.developmentAreas) && raw.developmentAreas.length ? raw.developmentAreas.filter(Boolean) : m.developmentAreas,
      recommendedActions: Array.isArray(raw.recommendedActions) && raw.recommendedActions.length ? raw.recommendedActions.filter(Boolean) : m.recommendedActions,
    };
  } catch {
    return mockInsights(ctx);
  }
}
