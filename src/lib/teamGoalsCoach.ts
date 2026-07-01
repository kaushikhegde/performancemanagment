// --- Phase 3: Team Goals coach (manager-side) ---
// Two agent helpers for the Team Goals review screen:
//  1. summarizeCoverage — a plain-language read of Practice Goal coverage gaps.
//  2. draftReviewComment — drafts an approval / request-changes / rejection note.
// Both degrade gracefully to a deterministic local draft when AI is unavailable.

import { generateStructured, Type } from './ai';

export interface CoverageRow {
  title: string;
  members: number;
  status: string; // e.g. 'Aligned' | 'Partial'
}

export interface AIText {
  text: string;
  isMock?: boolean;
}

// --- Coverage summary ---
const COVERAGE_SYSTEM = `You are a performance-management assistant helping a people leader.
Given Practice Goal coverage for their team, write a concise 2-3 sentence summary that
highlights which Practice Goals are well covered and which are under-covered, and suggest
one concrete action. Be specific and professional. Plain text, no markdown.`;

const TEXT_SCHEMA = {
  type: Type.OBJECT,
  properties: { text: { type: Type.STRING } },
  required: ['text'],
};

function mockCoverage(rows: CoverageRow[]): AIText {
  const weak = rows.filter((r) => r.status !== 'Aligned');
  const strong = rows.filter((r) => r.status === 'Aligned');
  const parts: string[] = [];
  if (strong.length) parts.push(`${strong.map((r) => `"${r.title}"`).join(', ')} ${strong.length > 1 ? 'are' : 'is'} well covered.`);
  if (weak.length) parts.push(`${weak.map((r) => `"${r.title}"`).join(', ')} ${weak.length > 1 ? 'are' : 'is'} only partially covered — consider aligning more team members' goals here this cycle.`);
  if (!parts.length) parts.push('Coverage looks balanced across all Practice Goals.');
  return { text: parts.join(' '), isMock: true };
}

export async function summarizeCoverage(rows: CoverageRow[]): Promise<AIText> {
  if (!rows.length) return { text: 'No coverage data available.', isMock: true };
  try {
    const prompt = 'Team Practice Goal coverage:\n' +
      rows.map((r) => `- ${r.title}: ${r.members} members contributing, status ${r.status}`).join('\n');
    const raw = await generateStructured<{ text: string }>({ system: COVERAGE_SYSTEM, prompt, schema: TEXT_SCHEMA });
    return { text: raw.text.trim() || mockCoverage(rows).text };
  } catch {
    return mockCoverage(rows);
  }
}

// --- Review comment drafting ---
export type ReviewAction = 'Approved' | 'Changes Requested' | 'Rejected';

export interface ReviewCommentInput {
  goalTitle: string;
  progress: number;
  action: ReviewAction;
  employeeName?: string;
}

const COMMENT_SYSTEM = `You are a people leader's writing assistant.
Draft a short (1-2 sentence), specific, constructive review comment for an employee's goal,
matching the given decision (Approved / Changes Requested / Rejected). Be professional,
behavioural and free of biased or personality-based language. Plain text, no markdown.`;

function mockComment(input: ReviewCommentInput): AIText {
  const who = input.employeeName ? `${input.employeeName}, ` : '';
  const map: Record<ReviewAction, string> = {
    'Approved': `${who}"${input.goalTitle}" is clearly scoped and on track at ${input.progress}%. Approving — keep the momentum and log progress at each milestone.`,
    'Changes Requested': `${who}"${input.goalTitle}" needs a measurable target and a clear due date before I can approve it. Please add those and resubmit.`,
    'Rejected': `${who}"${input.goalTitle}" doesn't align to our current Practice Goals this cycle. Let's discuss a re-scoped goal in our next 1:1.`,
  };
  return { text: map[input.action], isMock: true };
}

export async function draftReviewComment(input: ReviewCommentInput): Promise<AIText> {
  try {
    const prompt = [
      `Employee: ${input.employeeName || 'the employee'}`,
      `Goal: ${input.goalTitle}`,
      `Current progress: ${input.progress}%`,
      `Decision: ${input.action}`,
    ].join('\n');
    const raw = await generateStructured<{ text: string }>({ system: COMMENT_SYSTEM, prompt, schema: TEXT_SCHEMA });
    return { text: raw.text.trim() || mockComment(input).text };
  } catch {
    return mockComment(input);
  }
}
