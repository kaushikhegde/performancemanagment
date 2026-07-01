// --- Review Writer agent (manager-side) ---
// Drafts a manager's performance review grounded in the employee's goals, self-
// assessment and recent feedback: an overall narrative + suggested overall rating,
// strengths / development areas, per-goal commentary with a suggested rating band,
// and bias/tone flags. Falls back to deterministic local drafts when AI is off.

import { generateStructured, Type } from './ai';

export type GoalRating = 'Not Met' | 'Partial' | 'Met' | 'Exceeded';

export interface ReviewGoalInput {
  title: string;
  progress?: number;
  status?: string;
  selfRating?: string;
}

export interface ReviewMetrics {
  salesRevenue?: number;        // USD
  timesheetCompliance?: number; // %
  utilization?: number;         // %
  trainingCompliance?: number;  // %
}

export interface ReviewContext {
  employeeName: string;
  role?: string;
  tenure?: string;
  lastRating?: string;
  goalProgress?: string;
  goals: ReviewGoalInput[];
  selfSummary?: string;
  recentFeedback?: { from: string; text: string }[];
  /** Performance KPIs — the AI factors these into each goal's proposed rating. */
  metrics?: ReviewMetrics;
}

export interface GoalReviewDraft {
  title: string;
  suggestedRating: GoalRating;
  comment: string;
}

export interface BiasFlag {
  phrase: string;
  suggestion: string;
}

export interface ManagerReviewDraft {
  overallSummary: string;
  suggestedOverallRating: string; // e.g. "4.2 (Strong)"
  strengths: string[];
  developmentAreas: string[];
  biasFlags: BiasFlag[];
  goals: GoalReviewDraft[];
  isMock?: boolean;
}

const RATINGS: GoalRating[] = ['Not Met', 'Partial', 'Met', 'Exceeded'];

const SYSTEM = `You are Review Writer, an assistant for a people leader writing a performance review.
Ground EVERYTHING in the provided evidence: goal progress, the employee's performance METRICS
(sales revenue, utilization %, timesheet compliance %, training compliance %), the self-assessment
and peer/manager feedback.
Rules:
- For EACH goal, propose a rating from exactly: ${RATINGS.join(', ')}. Base it on ALL relevant
  evidence — goal progress AND the performance metrics AND feedback — and in the goal's 1-2 sentence
  comment cite the specific metrics/feedback that justify the rating.
- Write a professional, specific, evidence-based overall summary (4-6 sentences).
- Suggest an overall rating as a short label like "4.2 (Strong)".
- Give 2-4 concrete strengths and 1-3 development areas.
- Flag any biased, vague or personality-based language you would avoid (e.g. "not leadership material")
  and give a specific, behavioural replacement. If none, return an empty list.
- Never invent achievements not supported by the evidence. Plain text, no markdown.`;

const goalItemSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    suggestedRating: { type: Type.STRING, enum: RATINGS },
    comment: { type: Type.STRING },
  },
  required: ['title', 'suggestedRating', 'comment'],
};

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallSummary: { type: Type.STRING },
    suggestedOverallRating: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    developmentAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    biasFlags: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { phrase: { type: Type.STRING }, suggestion: { type: Type.STRING } },
        required: ['phrase', 'suggestion'],
      },
    },
    goals: { type: Type.ARRAY, items: goalItemSchema },
  },
  required: ['overallSummary', 'suggestedOverallRating', 'strengths', 'developmentAreas', 'goals'],
};

function buildPrompt(ctx: ReviewContext): string {
  const lines: string[] = [
    `Employee: ${ctx.employeeName}${ctx.role ? `, ${ctx.role}` : ''}${ctx.tenure ? `, tenure ${ctx.tenure}` : ''}`,
  ];
  if (ctx.lastRating) lines.push(`Last rating: ${ctx.lastRating}`);
  if (ctx.goalProgress) lines.push(`Overall goal progress: ${ctx.goalProgress}`);
  if (ctx.metrics) {
    const m = ctx.metrics;
    const parts: string[] = [];
    if (m.salesRevenue != null) parts.push(`sales revenue $${m.salesRevenue.toLocaleString()}`);
    if (m.utilization != null) parts.push(`utilization ${m.utilization}%`);
    if (m.timesheetCompliance != null) parts.push(`timesheet compliance ${m.timesheetCompliance}%`);
    if (m.trainingCompliance != null) parts.push(`training compliance ${m.trainingCompliance}%`);
    if (parts.length) lines.push(`Performance metrics: ${parts.join(', ')}`);
  }
  lines.push('Goals:');
  ctx.goals.forEach((g) =>
    lines.push(`- ${g.title}${g.progress != null ? ` (${g.progress}% complete` : ''}${g.status ? `, ${g.status}` : ''}${g.progress != null ? ')' : ''}${g.selfRating ? `, employee self-rated: ${g.selfRating}` : ''}`)
  );
  if (ctx.selfSummary) lines.push(`Employee self-assessment summary: "${ctx.selfSummary}"`);
  if (ctx.recentFeedback?.length) {
    lines.push('Recent feedback:');
    ctx.recentFeedback.forEach((f) => lines.push(`- ${f.from}: "${f.text}"`));
  }
  lines.push('Return the review as JSON matching the schema.');
  return lines.join('\n');
}

// --- Local fallback ---
// Blend goal progress with the performance metrics into a 0-100 evidence score,
// then map to a rating band. Mirrors how the AI is instructed to reason.
function evidenceScore(progress: number | undefined, metrics?: ReviewMetrics): number {
  let score = progress ?? 70;
  if (metrics) {
    const signals = [metrics.utilization, metrics.timesheetCompliance, metrics.trainingCompliance]
      .filter((v): v is number => v != null);
    if (signals.length) {
      const avg = signals.reduce((a, b) => a + b, 0) / signals.length;
      score = Math.round(0.6 * score + 0.4 * avg); // 60% goal delivery, 40% operational metrics
    }
  }
  return score;
}

function bandFromScore(score: number): GoalRating {
  if (score >= 95) return 'Exceeded';
  if (score >= 75) return 'Met';
  if (score >= 50) return 'Partial';
  return 'Not Met';
}

function metricEvidence(metrics?: ReviewMetrics): string {
  if (!metrics) return '';
  const parts: string[] = [];
  if (metrics.utilization != null) parts.push(`${metrics.utilization}% utilization`);
  if (metrics.trainingCompliance != null) parts.push(`${metrics.trainingCompliance}% training compliance`);
  if (metrics.salesRevenue) parts.push(`$${(metrics.salesRevenue / 1_000_000).toFixed(2)}M revenue`);
  return parts.slice(0, 2).join(' and ');
}

function mockReview(ctx: ReviewContext): ManagerReviewDraft {
  const name = ctx.employeeName;
  const evidence = metricEvidence(ctx.metrics);
  const goals: GoalReviewDraft[] = ctx.goals.map((g) => {
    const rating = bandFromScore(evidenceScore(g.progress, ctx.metrics));
    const strong = rating === 'Exceeded' || rating === 'Met';
    return {
      title: g.title,
      suggestedRating: rating,
      comment: `${name} reached ${g.progress != null ? `${g.progress}% on` : 'solid progress on'} "${g.title}" (${rating})${evidence ? `, supported by ${evidence}` : ''}. ${strong ? 'Metrics and delivery point to strong, consistent performance.' : 'Metrics suggest support and a clearer plan would help close the gap next cycle.'}`,
    };
  });
  // Overall rating from the average goal evidence score (metric-driven).
  const avgScore = goals.length
    ? Math.round(ctx.goals.reduce((s, g) => s + evidenceScore(g.progress, ctx.metrics), 0) / ctx.goals.length)
    : 80;
  const stars = Math.max(1, Math.min(5, +(1 + (avgScore / 100) * 4).toFixed(1)));
  const label = stars >= 4.5 ? 'Outstanding' : stars >= 4 ? 'Strong' : stars >= 3 ? 'Solid' : stars >= 2 ? 'Developing' : 'Needs Improvement';
  return {
    overallSummary: `${name} delivered ${ctx.goalProgress ? `${ctx.goalProgress} against` : 'strongly against'} their goals this cycle${evidence ? `, backed by ${evidence}` : ''}, with clear impact on ${ctx.goals[0]?.title || 'key objectives'}. Peer and manager feedback highlights reliability and collaboration. Development next cycle should focus on longer-term strategy and broadening visibility. Overall a dependable, high-contributing performer.`,
    suggestedOverallRating: `${stars} (${label})`,
    strengths: ['Consistent goal delivery', 'Strong collaboration and mentoring', 'Reliable execution under pressure'],
    developmentAreas: ['Long-term strategic thinking', 'Executive visibility'],
    biasFlags: [],
    goals,
    isMock: true,
  };
}

function sanitize(d: Partial<ManagerReviewDraft>, ctx: ReviewContext): ManagerReviewDraft {
  const safeGoals: GoalReviewDraft[] = Array.isArray(d.goals) && d.goals.length
    ? d.goals.map((g) => ({
        title: g.title,
        suggestedRating: (RATINGS as string[]).includes(g.suggestedRating) ? g.suggestedRating : 'Met',
        comment: g.comment || '',
      }))
    : mockReview(ctx).goals;
  return {
    overallSummary: (d.overallSummary || '').trim() || mockReview(ctx).overallSummary,
    suggestedOverallRating: (d.suggestedOverallRating || '').trim() || (ctx.lastRating || '4.0 (Strong)'),
    strengths: Array.isArray(d.strengths) ? d.strengths.filter(Boolean) : [],
    developmentAreas: Array.isArray(d.developmentAreas) ? d.developmentAreas.filter(Boolean) : [],
    biasFlags: Array.isArray(d.biasFlags) ? d.biasFlags.filter((b) => b && b.phrase) : [],
    goals: safeGoals,
  };
}

/** Draft a full manager review. Never rejects — returns a mock draft when AI is off. */
export async function draftReview(ctx: ReviewContext): Promise<ManagerReviewDraft> {
  try {
    const raw = await generateStructured<ManagerReviewDraft>({ system: SYSTEM, prompt: buildPrompt(ctx), schema: SCHEMA });
    return sanitize(raw, ctx);
  } catch {
    return mockReview(ctx);
  }
}

/** Draft commentary + a suggested rating for a single goal. */
export async function draftGoalComment(ctx: ReviewContext, goalTitle: string): Promise<GoalReviewDraft> {
  const focused: ReviewContext = { ...ctx, goals: ctx.goals.filter((g) => g.title === goalTitle) };
  const full = await draftReview(focused);
  return full.goals.find((g) => g.title === goalTitle) || full.goals[0] || {
    title: goalTitle, suggestedRating: 'Met', comment: '',
  };
}
