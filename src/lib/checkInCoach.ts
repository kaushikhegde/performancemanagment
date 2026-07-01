// --- Check-in Coach agent ---
// Summarizes an employee's check-in log into recurring themes, decisions/actions,
// and open follow-ups. Falls back to a deterministic local summary when AI is off.

import { generateStructured, Type } from './ai';
import type { CheckIn } from '../types';

export interface CheckInSummary {
  summary: string;        // 2-3 sentence overview
  themes: string[];       // recurring topics
  actionItems: string[];  // open follow-ups / decisions
  isMock?: boolean;
}

const SYSTEM = `You are a performance assistant summarizing an employee's 1:1 / check-in log.
Given a list of check-ins (date, who with, notes), produce:
- a concise 2-3 sentence overview of what has been discussed over time,
- recurring themes across the check-ins,
- open action items or follow-ups worth tracking.
Be specific and ground everything in the notes. Plain text, no markdown.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    themes: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'themes', 'actionItems'],
};

function mockSummary(checkIns: CheckIn[]): CheckInSummary {
  const people = Array.from(new Set(checkIns.map((c) => c.withPerson).filter(Boolean)));
  const withNotes = checkIns.filter((c) => c.notes && c.notes.trim());
  // Naive keyword extraction for themes.
  const stop = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'have', 'about', 'from', 'were', 'will', 'your', 'their', 'they', 'them', 'discussed', 'discuss']);
  const freq: Record<string, number> = {};
  withNotes.forEach((c) =>
    c.notes.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 4 && !stop.has(w)).forEach((w) => { freq[w] = (freq[w] || 0) + 1; })
  );
  const themes = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([w]) => w);
  return {
    summary: `${checkIns.length} check-in${checkIns.length === 1 ? '' : 's'} logged${people.length ? `, mainly with ${people.slice(0, 2).join(' and ')}` : ''}. Conversations have centered on ${themes.slice(0, 2).join(' and ') || 'ongoing progress and priorities'}.`,
    themes,
    actionItems: withNotes.slice(0, 3).map((c) => `Follow up on the ${c.date === 'Today' ? 'recent' : c.date} discussion${c.withPerson ? ` with ${c.withPerson}` : ''}.`),
    isMock: true,
  };
}

/** Summarize all check-ins. Never rejects — returns a mock summary when AI is off. */
export async function summarizeCheckIns(checkIns: CheckIn[]): Promise<CheckInSummary> {
  if (!checkIns.length) {
    return { summary: 'No check-ins logged yet.', themes: [], actionItems: [], isMock: true };
  }
  try {
    const prompt = 'Check-in log:\n' +
      checkIns.map((c) => `- ${c.date} with ${c.withPerson || 'unspecified'}: ${c.notes || '(no notes)'}`).join('\n');
    const raw = await generateStructured<CheckInSummary>({ system: SYSTEM, prompt, schema: SCHEMA });
    return {
      summary: (raw.summary || '').trim() || mockSummary(checkIns).summary,
      themes: Array.isArray(raw.themes) ? raw.themes.filter(Boolean) : [],
      actionItems: Array.isArray(raw.actionItems) ? raw.actionItems.filter(Boolean) : [],
    };
  } catch {
    return mockSummary(checkIns);
  }
}
