// --- Progress Sentinel agent ---
// Predicts whether a goal will be met by its due date and explains why, using
// progress, days remaining, milestone completion and the recent progress trend.
// Falls back to a deterministic projection when AI is off.

import { generateStructured, Type } from './ai';

export type RiskLevel = 'On Track' | 'At Risk' | 'Overdue';

export interface SentinelContext {
  title: string;
  progress: number;      // 0-100
  status: string;
  dueDate: string;
  daysToDue: number;     // negative = past due
  weight?: number;
  milestonesDone: number;
  milestonesTotal: number;
  nextMilestoneDate?: string;
  progressTrend?: { date: string; value: number }[];
}

export interface SentinelResult {
  riskLevel: RiskLevel;
  willMeetDeadline: boolean;
  rationale: string;
  recommendations: string[];
  isMock?: boolean;
}

const RISK_LEVELS: RiskLevel[] = ['On Track', 'At Risk', 'Overdue'];

const SYSTEM = `You are Progress Sentinel, forecasting whether a goal will be met by its due date.
Using current progress, days remaining, milestone completion and the recent progress trend:
- riskLevel: one of ${RISK_LEVELS.join(', ')}.
- willMeetDeadline: true/false — will it reach 100% by the due date at the current pace?
- rationale: 1-2 sentences citing the specific numbers (progress %, days left, pace, milestones).
- recommendations: 2-3 concrete, specific actions to get/stay on track.
Be realistic and specific. Plain text, no markdown.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    riskLevel: { type: Type.STRING, enum: RISK_LEVELS },
    willMeetDeadline: { type: Type.BOOLEAN },
    rationale: { type: Type.STRING },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['riskLevel', 'willMeetDeadline', 'rationale', 'recommendations'],
};

// Estimate recent velocity (% per day) from the progress trend, if available.
function velocityPerDay(trend?: { date: string; value: number }[]): number | null {
  if (!trend || trend.length < 2) return null;
  const first = trend[0].value;
  const last = trend[trend.length - 1].value;
  const d0 = Date.parse(trend[0].date);
  const d1 = Date.parse(trend[trend.length - 1].date);
  if (isNaN(d0) || isNaN(d1) || d1 <= d0) return null;
  const days = (d1 - d0) / 86_400_000;
  return days > 0 ? (last - first) / days : null;
}

function mockSentinel(ctx: SentinelContext): SentinelResult {
  const remaining = Math.max(0, 100 - ctx.progress);
  const vel = velocityPerDay(ctx.progressTrend);
  const milestoneRatio = ctx.milestonesTotal ? ctx.milestonesDone / ctx.milestonesTotal : null;

  let riskLevel: RiskLevel = 'On Track';
  let willMeet = true;
  let reason: string;

  if (ctx.daysToDue < 0 && ctx.progress < 100) {
    riskLevel = 'Overdue';
    willMeet = false;
    reason = `The goal is ${Math.abs(ctx.daysToDue)} day(s) past due at ${ctx.progress}% complete.`;
  } else {
    // Required pace vs. observed pace.
    const requiredPace = ctx.daysToDue > 0 ? remaining / ctx.daysToDue : Infinity;
    if (vel != null && vel > 0 && ctx.daysToDue > 0) {
      willMeet = vel >= requiredPace;
      reason = `At the recent pace of ~${vel.toFixed(1)}%/day, ${remaining}% remaining over ${ctx.daysToDue} days ${willMeet ? 'is achievable' : `needs ~${requiredPace.toFixed(1)}%/day — faster than recent progress`}.`;
    } else {
      willMeet = !(ctx.daysToDue <= 30 && ctx.progress < 60);
      reason = `${ctx.progress}% complete with ${ctx.daysToDue} day(s) left.`;
    }
    if (!willMeet) riskLevel = 'At Risk';
    else if (ctx.daysToDue <= 30 && ctx.progress < 60) riskLevel = 'At Risk';
    else if (milestoneRatio != null && milestoneRatio < ctx.progress / 100 - 0.3) {
      riskLevel = 'At Risk';
      reason += ` Milestone completion (${ctx.milestonesDone}/${ctx.milestonesTotal}) lags reported progress.`;
    }
  }

  const recommendations = riskLevel === 'On Track'
    ? ['Keep logging progress at each milestone.', 'Confirm the next milestone date is realistic.']
    : [
        `Break the remaining ${remaining}% into weekly checkpoints.`,
        'Raise blockers in your next 1:1 and request support if needed.',
        ctx.nextMilestoneDate ? `Prioritise the milestone due ${ctx.nextMilestoneDate}.` : 'Re-baseline the due date if scope has grown.',
      ];

  return { riskLevel, willMeetDeadline: willMeet, rationale: reason, recommendations, isMock: true };
}

/** Assess a goal's risk. Never rejects — returns a deterministic projection when AI is off. */
export async function assessGoalRisk(ctx: SentinelContext): Promise<SentinelResult> {
  try {
    const prompt = [
      `Goal: ${ctx.title}`,
      `Progress: ${ctx.progress}%`,
      `Status: ${ctx.status}`,
      `Due date: ${ctx.dueDate} (${ctx.daysToDue >= 0 ? `${ctx.daysToDue} days left` : `${Math.abs(ctx.daysToDue)} days overdue`})`,
      ctx.weight != null ? `Weight: ${ctx.weight}%` : null,
      `Milestones: ${ctx.milestonesDone}/${ctx.milestonesTotal} complete`,
      ctx.nextMilestoneDate ? `Next milestone due: ${ctx.nextMilestoneDate}` : null,
      ctx.progressTrend?.length ? `Progress trend: ${ctx.progressTrend.map((p) => `${p.date}=${p.value}%`).join(', ')}` : null,
      'Return JSON matching the schema.',
    ].filter(Boolean).join('\n');
    const raw = await generateStructured<SentinelResult>({ system: SYSTEM, prompt, schema: SCHEMA });
    const m = mockSentinel(ctx);
    return {
      riskLevel: RISK_LEVELS.includes(raw.riskLevel) ? raw.riskLevel : m.riskLevel,
      willMeetDeadline: typeof raw.willMeetDeadline === 'boolean' ? raw.willMeetDeadline : m.willMeetDeadline,
      rationale: (raw.rationale || '').trim() || m.rationale,
      recommendations: Array.isArray(raw.recommendations) && raw.recommendations.length ? raw.recommendations.filter(Boolean) : m.recommendations,
    };
  } catch {
    return mockSentinel(ctx);
  }
}
