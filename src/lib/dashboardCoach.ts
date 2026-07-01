// --- Dashboard Coach agent ---
// Produces a personalized "state of your performance" briefing: a headline, a
// short summary, what's on track, what needs attention, and the single highest-
// value next action. Falls back to a deterministic local briefing when AI is off.

import { generateStructured, Type } from './ai';

export interface DashboardDeadline {
  label: string;
  days: number;
  urgent?: boolean;
}

export interface DashboardContext {
  userName?: string;
  role?: 'employee' | 'manager';
  goalsOnTrack?: string;     // e.g. '8/12'
  reviewsPending?: number;
  feedbackReceived?: number;
  cycleStage?: string;       // e.g. 'Individual Goals (68%)'
  deadlines: DashboardDeadline[];
  teamReviews?: { name: string; status: string }[];
  recentFeedback?: { from: string; text: string }[];
}

export interface Briefing {
  headline: string;
  summary: string;
  highlights: string[]; // what's on track / going well
  risks: string[];      // what needs attention
  nextAction: string;   // the single highest-value next step
  isMock?: boolean;
}

const SYSTEM = `You are Dashboard Coach, briefing a user on their performance dashboard.
From the provided data write a concise, motivating but honest briefing:
- headline: one short line capturing the state of play.
- summary: 2-3 sentences.
- highlights: 2-3 things on track / going well.
- risks: 1-3 things that need attention (overdue/urgent items, pending reviews, slipping goals).
- nextAction: the SINGLE highest-value next step the user should take now.
Be specific and ground everything in the data. Plain text, no markdown.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING },
    summary: { type: Type.STRING },
    highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    nextAction: { type: Type.STRING },
  },
  required: ['headline', 'summary', 'highlights', 'risks', 'nextAction'],
};

function buildPrompt(ctx: DashboardContext): string {
  const lines: string[] = [`Role: ${ctx.role || 'employee'}`];
  if (ctx.userName) lines.push(`User: ${ctx.userName}`);
  if (ctx.cycleStage) lines.push(`Current cycle stage: ${ctx.cycleStage}`);
  if (ctx.goalsOnTrack) lines.push(`Goals on track: ${ctx.goalsOnTrack}`);
  if (ctx.reviewsPending != null) lines.push(`Reviews pending: ${ctx.reviewsPending}`);
  if (ctx.feedbackReceived != null) lines.push(`Feedback received: ${ctx.feedbackReceived}`);
  if (ctx.deadlines.length) {
    lines.push('Upcoming deadlines:');
    ctx.deadlines.forEach((d) => lines.push(`- ${d.label}: due in ${d.days} days${d.urgent ? ' (urgent)' : ''}`));
  }
  if (ctx.teamReviews?.length) {
    lines.push('Team reviews:');
    ctx.teamReviews.forEach((t) => lines.push(`- ${t.name}: ${t.status}`));
  }
  if (ctx.recentFeedback?.length) {
    lines.push('Recent feedback:');
    ctx.recentFeedback.forEach((f) => lines.push(`- ${f.from}: "${f.text}"`));
  }
  lines.push('Return the briefing as JSON matching the schema.');
  return lines.join('\n');
}

function mockBriefing(ctx: DashboardContext): Briefing {
  const sorted = [...ctx.deadlines].sort((a, b) => a.days - b.days);
  const soonest = sorted[0];
  const urgent = sorted.filter((d) => d.urgent || d.days <= 5);

  const highlights: string[] = [];
  if (ctx.goalsOnTrack) highlights.push(`${ctx.goalsOnTrack} goals on track`);
  if (ctx.feedbackReceived) highlights.push(`${ctx.feedbackReceived} pieces of feedback received this cycle`);
  if (ctx.cycleStage) highlights.push(`Cycle progressing — ${ctx.cycleStage}`);

  const risks: string[] = [];
  urgent.forEach((d) => risks.push(`${d.label} due in ${d.days} day${d.days === 1 ? '' : 's'}`));
  if (ctx.reviewsPending) risks.push(`${ctx.reviewsPending} review${ctx.reviewsPending === 1 ? '' : 's'} still pending`);

  const nextAction = soonest ? `${soonest.label} — due in ${soonest.days} days` : 'Review your goals and upcoming deadlines';

  return {
    headline: urgent.length
      ? `${urgent.length} item${urgent.length === 1 ? '' : 's'} need your attention today`
      : "You're on track this cycle",
    summary: `${ctx.goalsOnTrack ? `${ctx.goalsOnTrack} of your goals are on track` : 'Your goals are progressing'}${ctx.cycleStage ? ` and the cycle is at "${ctx.cycleStage}"` : ''}. ${urgent.length ? `Prioritise ${urgent[0].label.toLowerCase()} — it's due soonest.` : 'Nothing is overdue — keep the momentum going.'}${ctx.reviewsPending ? ` You still have ${ctx.reviewsPending} review${ctx.reviewsPending === 1 ? '' : 's'} to complete.` : ''}`,
    highlights,
    risks,
    nextAction,
    isMock: true,
  };
}

/** Generate a dashboard briefing. Never rejects — returns a mock briefing when AI is off. */
export async function generateBriefing(ctx: DashboardContext): Promise<Briefing> {
  try {
    const raw = await generateStructured<Briefing>({ system: SYSTEM, prompt: buildPrompt(ctx), schema: SCHEMA });
    return {
      headline: (raw.headline || '').trim() || mockBriefing(ctx).headline,
      summary: (raw.summary || '').trim() || mockBriefing(ctx).summary,
      highlights: Array.isArray(raw.highlights) ? raw.highlights.filter(Boolean) : [],
      risks: Array.isArray(raw.risks) ? raw.risks.filter(Boolean) : [],
      nextAction: (raw.nextAction || '').trim() || mockBriefing(ctx).nextAction,
    };
  } catch {
    return mockBriefing(ctx);
  }
}
