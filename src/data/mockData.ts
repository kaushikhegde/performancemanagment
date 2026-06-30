import { Employee, Goal, ReviewCycle, Feedback, RoleProfile, FeedbackRequest, CheckIn, GradeExpectation } from '../types';

export const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Sarah Chen', role: 'Product Manager', department: 'Product', managerId: '10', reviewScore: 4.2, goalsDone: 6, totalGoals: 8, alignment: 'Aligned', avatar: 'SC', tenure: '3 yrs 2 mo', flightRisk: 'Low', nineBoxLabel: 'STAR ⭐' },
  { id: '2', name: 'Ben Scyne', role: 'Sr Engineer', department: 'Engineering', managerId: '11', reviewScore: 3.8, goalsDone: 4, totalGoals: 6, alignment: 'Partial', avatar: 'BS', tenure: '2 yrs 1 mo', flightRisk: 'Medium', nineBoxLabel: 'CORE PLAYER' },
  { id: '3', name: 'Yash Thakur', role: 'Sales Lead', department: 'Sales', managerId: '10', reviewScore: 4.5, goalsDone: 7, totalGoals: 7, alignment: 'Aligned', avatar: 'YT', tenure: '4 yrs', flightRisk: 'Low', nineBoxLabel: 'HIGH POTENTIAL' },
  { id: '4', name: 'Divya G', role: 'Marketing Analyst', department: 'Marketing', managerId: '11', reviewScore: 3.6, goalsDone: 3, totalGoals: 5, alignment: 'Partial', avatar: 'DG', tenure: '1 yr 6 mo', flightRisk: 'Low', nineBoxLabel: 'CORE PLAYER' },
  { id: '5', name: 'Nik Maniya', role: 'Product Lead', department: 'Product', managerId: '10', reviewScore: 4.8, goalsDone: 8, totalGoals: 8, alignment: 'Aligned', avatar: 'NM', tenure: '5 yrs', flightRisk: 'Low', nineBoxLabel: 'STAR ⭐' },
  { id: '6', name: 'Alex Reid', role: 'Director of Product', department: 'Product', reviewScore: 4.4, goalsDone: 5, totalGoals: 5, alignment: 'Aligned', avatar: 'AR' },
  { id: '7', name: 'Priya B', role: 'Engineering Manager', department: 'Engineering', reviewScore: 4.1, goalsDone: 6, totalGoals: 7, alignment: 'Aligned', avatar: 'PB' },
];

// Practice Goals — org-level goals that individual goals align to (formerly "Company Goals")
export const COMPANY_GOALS: Goal[] = [
  { id: 'cg1', title: 'Grow ARR to $50M by EOY', pillar: 'Revenue Growth', owner: 'Alex Reid', progress: 65, status: 'Active', dueDate: '2025-12-31', teamsAligned: 4, individualsContributing: 42, scyneValues: ['Amplify impact', 'Think beyond limits'] },
  { id: 'cg2', title: 'Achieve NPS > 65', pillar: 'Customer Success', owner: 'Sarah Chen', progress: 48, status: 'Active', dueDate: '2025-12-31', teamsAligned: 3, individualsContributing: 28, scyneValues: ['Build trusted relationships', 'Amplify impact'] },
  { id: 'cg3', title: 'Launch Mobile Platform Q2', pillar: 'Product', owner: 'Nik Maniya', progress: 78, status: 'Active', dueDate: '2025-06-30', teamsAligned: 2, individualsContributing: 15, scyneValues: ['Think beyond limits', 'Stronger together'] },
  { id: 'cg4', title: 'Reduce Attrition to < 8%', pillar: 'People', owner: 'Priya B', progress: 30, status: 'Active', dueDate: '2025-12-31', teamsAligned: 5, individualsContributing: 120, scyneValues: ['Value every person', 'Stronger together'] },
];

// Alias for clarity in the UI — these are the "Practice Goals"
export const PRACTICE_GOALS = COMPANY_GOALS;

export const REVIEW_CYCLES: ReviewCycle[] = [
  { id: 'rc1', name: 'Q1 2025 Annual Review', type: 'Annual', participants: 12, selfReviewsDone: 8, managerReviewsDone: 5, calibrationDone: 0, status: 'Active', avgScore: 4.1, daysRemaining: 14 },
];

export const FEEDBACK: Feedback[] = [
  { id: 'f1', from: 'Alex Reid', to: 'Sarah Chen', text: 'Great job leading the product launch meeting today. Very clear roadmap.', type: 'Recognition', date: '2026-03-28' },
  { id: 'f2', from: 'Priya B', to: 'Ben Scyne', text: 'The new architecture proposal looks solid. Let\'s refine the database schema.', type: 'General', date: '2026-03-25' },
];

// --- Goal taxonomy (REQ1 #485, #486, #484, #490) ---

export const GOAL_TYPES = ['Strategic', 'Individual', 'Team'] as const;

export const SCYNE_VALUES: { name: string; blurb: string }[] = [
  { name: 'Stronger together', blurb: 'Working as a team, we are stronger through the connections we have, based on respect and trust.' },
  { name: 'Amplify impact', blurb: 'Purpose and passion are at our core. Client focus is central, and we are proud of the work we do.' },
  { name: 'Build trusted relationships', blurb: 'Our relationships are open, frank, and fearless. Trust comes from care and taking time to understand.' },
  { name: 'Value every person', blurb: 'Respect is the foundation of how we work. We encourage debate and diversity of views.' },
  { name: 'Think beyond limits', blurb: 'We embrace creativity and curiosity, challenging how we have always done things. Learning is key.' },
  { name: 'Defined by ethics', blurb: 'Honesty, integrity, and ethical behaviour are non-negotiables. We do what is right, not what is easy.' },
];

export const GOAL_VISIBILITY_OPTIONS: { value: string; blurb: string }[] = [
  { value: 'Owner Only', blurb: 'Not visible to People/Project Leaders or other employees. Excluded from reviews, reporting and search.' },
  { value: 'People Leader', blurb: 'Visible within your goal profile. People Leader can review progress and provide feedback.' },
  { value: 'Project Leader', blurb: 'Project Leaders can view details and give feedback. Access removed when no longer assigned.' },
  { value: 'Org Hierarchy', blurb: 'Visible to authorised leaders above your grade. Supports succession and talent planning.' },
  { value: 'Public', blurb: 'Appears on your development profile. Discoverable in search. Others can view but not edit.' },
];

export const PROGRESS_STATUSES = ['Not Started', 'On Track', 'Needs Improvement', 'Completed', 'Cancelled'] as const;

export const SKILLS_PASSPORT = {
  Skills: ['Stakeholder Management', 'Roadmapping', 'Data Analysis', 'Public Speaking', 'Cloud Architecture'],
  Education: ['MBA — Strategy', 'AWS Solutions Architect', 'Advanced Leadership Cert'],
  'Roles & Experience': ['Product Manager — FinTech', 'Team Lead — Migration 2024', 'Mentor — Grad Program'],
};

// --- Rich individual goals (REQ1 tracking, milestones, history) ---

export const MY_GOALS: Goal[] = [
  {
    id: 'g1',
    title: 'Launch new API documentation portal',
    description: 'Deliver a self-serve developer docs portal to reduce support tickets and accelerate partner onboarding.',
    owner: 'Sarah Chen',
    parentGoalId: 'cg3',
    parentGoalIds: ['cg3'],
    progress: 70,
    status: 'On Track',
    dueDate: '2026-07-31',
    dateCreated: '2026-03-01',
    approved: true,
    weight: 30,
    changeHistory: [
      { id: 'ch1', date: '2026-03-01 09:00', field: 'Goal', from: '—', to: 'Created', by: 'Sarah Chen' },
      { id: 'ch2', date: '2026-03-03 11:15', field: 'Status', from: 'Pending Approval', to: 'Approved', by: 'Alex Reid' },
      { id: 'ch3', date: '2026-05-02 14:05', field: 'Target date', from: '2026-06-30', to: '2026-07-31', by: 'Sarah Chen' },
    ],
    goalTypes: ['Individual', 'Strategic'],
    scyneValues: ['Amplify impact', 'Think beyond limits'],
    visibility: 'People Leader',
    progressType: 'Both',
    source: 'Native',
    metrics: [
      { id: 'm1', name: 'Docs coverage', target: 100, current: 70, unit: '%' },
      { id: 'm2', name: 'Support tickets reduced', target: 40, current: 22, unit: '%' },
    ],
    milestones: [
      { id: 'ms1', description: 'Information architecture approved', targetDate: '2026-04-15', completed: true },
      { id: 'ms2', description: 'Core endpoints documented', targetDate: '2026-06-01', completed: true },
      { id: 'ms3', description: 'Public launch', targetDate: '2026-07-31', completed: false },
    ],
    progressHistory: [
      { id: 'p1', date: '2026-03-12 09:20', value: 30, status: 'On Track', note: 'IA approved, drafting core endpoints.', by: 'Sarah Chen' },
      { id: 'p2', date: '2026-05-02 14:05', value: 55, status: 'On Track', note: 'Core endpoints complete, starting examples.', by: 'Sarah Chen' },
      { id: 'p3', date: '2026-06-10 11:30', value: 70, status: 'On Track', note: 'Internal review feedback incorporated.', by: 'Sarah Chen' },
    ],
    linkedSkills: ['Stakeholder Management', 'Roadmapping'],
    linkedActivities: ['Docs Portal Project', 'Q2 Partner Onboarding'],
    linkedFeedback: ['f1'],
    linkedReview: 'Q1 2025 Annual Review',
  },
  {
    id: 'g2',
    title: 'Mentor 2 junior PMs through full product lifecycle',
    description: 'Coach two graduate PMs across discovery, delivery and launch.',
    owner: 'Sarah Chen',
    parentGoalId: 'cg4',
    parentGoalIds: ['cg4'],
    progress: 40,
    status: 'Needs Improvement',
    dueDate: '2026-05-30',
    dateCreated: '2026-02-10',
    approved: true,
    weight: 20,
    changeHistory: [
      { id: 'ch4', date: '2026-02-10 10:00', field: 'Goal', from: '—', to: 'Created', by: 'Sarah Chen' },
      { id: 'ch5', date: '2026-02-12 09:30', field: 'Status', from: 'Pending Approval', to: 'Approved', by: 'Alex Reid' },
    ],
    goalTypes: ['Individual', 'Team'],
    scyneValues: ['Stronger together', 'Value every person'],
    visibility: 'Org Hierarchy',
    progressType: 'Percentage',
    source: 'Native',
    metrics: [{ id: 'm3', name: 'Mentees onboarded', target: 2, current: 1, unit: 'people' }],
    milestones: [
      { id: 'ms4', description: 'Pair on discovery sprint', targetDate: '2026-03-01', completed: true },
      { id: 'ms5', description: 'Shadow a launch', targetDate: '2026-05-15', completed: false },
    ],
    progressHistory: [
      { id: 'p4', date: '2026-02-20 10:00', value: 20, status: 'On Track', note: 'Kicked off with first mentee.', by: 'Sarah Chen' },
      { id: 'p5', date: '2026-04-18 16:40', value: 40, status: 'Needs Improvement', note: 'Second mentee start delayed by hiring.', by: 'Sarah Chen' },
    ],
    linkedSkills: ['Public Speaking'],
    linkedActivities: ['Grad Mentorship Program'],
    linkedFeedback: [],
    linkedReview: 'Q1 2025 Annual Review',
  },
  {
    id: 'g3',
    title: 'Complete Advanced Leadership certification',
    description: 'Finish the executive leadership program to strengthen strategic presence.',
    owner: 'Sarah Chen',
    progress: 100,
    status: 'Completed',
    dueDate: '2026-03-31',
    dateCreated: '2025-12-15',
    approved: true,
    weight: 15,
    changeHistory: [
      { id: 'ch6', date: '2025-12-15 08:30', field: 'Goal', from: '—', to: 'Created', by: 'Sarah Chen' },
      { id: 'ch7', date: '2025-12-16 13:00', field: 'Status', from: 'Pending Approval', to: 'Approved', by: 'Alex Reid' },
      { id: 'ch8', date: '2026-03-28 17:00', field: 'Status', from: 'On Track', to: 'Completed', by: 'Sarah Chen' },
    ],
    goalTypes: ['Individual'],
    scyneValues: ['Think beyond limits'],
    visibility: 'Public',
    progressType: 'Status',
    source: 'Native',
    metrics: [{ id: 'm4', name: 'Modules complete', target: 6, current: 6, unit: 'modules' }],
    milestones: [{ id: 'ms6', description: 'Final capstone submitted', targetDate: '2026-03-31', completed: true }],
    progressHistory: [
      { id: 'p6', date: '2026-01-10 08:00', value: 50, status: 'On Track', note: '3 of 6 modules done.', by: 'Sarah Chen' },
      { id: 'p7', date: '2026-03-28 17:00', value: 100, status: 'Completed', note: 'Capstone accepted — certified.', by: 'Sarah Chen' },
    ],
    linkedSkills: ['Cloud Architecture'],
    linkedActivities: [],
    linkedFeedback: [],
  },
  {
    id: 'g4',
    title: 'Reduce checkout drop-off by 15% (legacy D365)',
    description: 'Imported from D365 — historical goal carried into PerfoPulse.',
    owner: 'Sarah Chen',
    progress: 35,
    status: 'At Risk',
    dueDate: '2026-06-25',
    dateCreated: '2026-04-01',
    approved: false,
    weight: 15,
    changeHistory: [
      { id: 'ch9', date: '2026-04-01 09:00', field: 'Goal', from: '—', to: 'Imported from D365', by: 'System' },
    ],
    goalTypes: ['Individual'],
    scyneValues: ['Amplify impact'],
    visibility: 'Owner Only',
    progressType: 'Percentage',
    source: 'D365 Import',
    metrics: [{ id: 'm5', name: 'Drop-off reduction', target: 15, current: 5, unit: '%' }],
    milestones: [],
    progressHistory: [
      { id: 'p8', date: '2026-04-01 09:00', value: 20, status: 'On Track', note: 'Imported from D365 at 20%.', by: 'System' },
      { id: 'p9', date: '2026-05-20 13:15', value: 35, status: 'At Risk', note: 'A/B test underperforming.', by: 'Sarah Chen' },
    ],
    linkedSkills: ['Data Analysis'],
    linkedActivities: ['Checkout Optimisation'],
    linkedFeedback: [],
  },
];

export const D365_IMPORT_GOALS = [
  { id: 'd1', title: 'Reduce checkout drop-off by 15%', period: 'FY2025 H2', progress: 35, status: 'At Risk' },
  { id: 'd2', title: 'Improve onboarding NPS to 60', period: 'FY2025 H1', progress: 80, status: 'On Track' },
  { id: 'd3', title: 'Ship loyalty rewards MVP', period: 'FY2024 H2', progress: 100, status: 'Completed' },
  { id: 'd4', title: 'Cut page load time by 30%', period: 'FY2024 H2', progress: 100, status: 'Completed' },
];

// --- Role profiles (REQ1 #501) ---

export const ROLE_PROFILES: RoleProfile[] = [
  {
    id: 'rp1', title: 'Product Manager', grade: 'G5', department: 'Product',
    responsibilities: ['Own product roadmap for a domain', 'Define and prioritise requirements', 'Coordinate cross-functional delivery'],
    competencies: ['Stakeholder Management', 'Strategic Thinking', 'Data-Driven Decisions'],
    performanceIndicators: ['Roadmap delivered on time', 'Adoption / NPS targets met', 'Clear, prioritised backlog'],
  },
  {
    id: 'rp2', title: 'Product Lead', grade: 'G6', department: 'Product',
    responsibilities: ['Set product strategy across domains', 'Mentor PMs', 'Align portfolio to company goals'],
    competencies: ['Portfolio Strategy', 'Leadership', 'Executive Communication'],
    performanceIndicators: ['Portfolio outcomes vs OKRs', 'Team capability growth', 'Cross-team alignment'],
  },
  {
    id: 'rp3', title: 'Senior Engineer', grade: 'G5', department: 'Engineering',
    responsibilities: ['Design and build scalable services', 'Review code and mentor', 'Drive technical quality'],
    competencies: ['System Design', 'Code Quality', 'Technical Mentoring'],
    performanceIndicators: ['Reliability / uptime', 'Review throughput', 'Defect escape rate'],
  },
  {
    id: 'rp4', title: 'Engineering Manager', grade: 'G6', department: 'Engineering',
    responsibilities: ['Lead an engineering team', 'Delivery planning', 'Career development of reports'],
    competencies: ['People Leadership', 'Delivery Management', 'Technical Strategy'],
    performanceIndicators: ['Team delivery predictability', 'Retention', 'Engagement scores'],
  },
  {
    id: 'rp5', title: 'Sales Lead', grade: 'G5', department: 'Sales',
    responsibilities: ['Own a sales territory', 'Build pipeline', 'Close strategic accounts'],
    competencies: ['Negotiation', 'Pipeline Management', 'Client Relationships'],
    performanceIndicators: ['Quota attainment', 'Win rate', 'Pipeline coverage'],
  },
];

// --- Feedback requests (REQ2 #493–#496) ---

export const COMPETENCIES = ['Client Impact', 'Collaboration', 'Technical Execution', 'Strategic Alignment', 'Communication', 'Leadership'];

export const FEEDBACK_REQUESTS: FeedbackRequest[] = [
  { id: 'fr1', requestor: 'Sarah Chen', respondent: 'Alex Reid', respondentRole: 'TL', scope: 'Q2 Mobile Launch', competencies: ['Leadership', 'Client Impact'], dueDate: '2026-04-15', visibility: 'Requestor + Respondent + direct TL', status: 'In Progress', anonymity: 'Named' },
  { id: 'fr2', requestor: 'Sarah Chen', respondent: 'Ben Scyne', respondentRole: 'Peer', scope: 'API Docs Project', competencies: ['Collaboration', 'Communication'], dueDate: '2026-04-10', visibility: 'Requestor + Respondent', status: 'Overdue', anonymity: 'Anonymous' },
  { id: 'fr3', requestor: 'Sarah Chen', respondent: 'Nik Maniya', respondentRole: 'Lead', scope: 'Q1 Planning', competencies: ['Strategic Alignment'], dueDate: '2026-03-30', visibility: 'Requestor + Respondent + direct TL', status: 'Completed', anonymity: 'Named' },
];

export const REMINDER_SCHEDULE = [
  { label: 'T-5 days', detail: 'Heads-up reminder', state: 'sent' },
  { label: 'T-2 days', detail: 'Due soon nudge', state: 'sent' },
  { label: 'Due day', detail: 'Final reminder', state: 'pending' },
  { label: 'T+2 overdue', detail: 'Overdue notice', state: 'scheduled' },
  { label: 'T+7 overdue', detail: 'Escalate to TL (if policy allows)', state: 'scheduled' },
];

// --- In-app notifications & auto-created tasks (REQ1 #483/#488/#491, REQ2 #493/#496) ---
export const NOTIFICATIONS = [
  { id: 'n0', icon: 'request', title: 'Goal approval needed — Sarah Chen', body: 'Sarah has reduced “Grow new-logo revenue” from $2,000,000 to $100. Review and approve the change.', time: 'Just now', unread: true, channel: 'In-App, Email' },
  { id: 'n1', icon: 'review', title: 'Alex Reid reviewed your goal', body: '“Launch new API documentation portal” was reviewed and updated by your Team Leader.', time: '2h ago', unread: true, channel: 'In-App, Email' },
  { id: 'n2', icon: 'feedback', title: 'Feedback completed', body: 'Nik Maniya completed your feedback request for “Q1 Planning”.', time: '5h ago', unread: true, channel: 'In-App, Email' },
  { id: 'n3', icon: 'request', title: 'New feedback request', body: 'Alex Reid requested feedback from you — due Apr 15.', time: '1d ago', unread: true, channel: 'In-App, Email' },
  { id: 'n4', icon: 'cadence', title: 'Quarterly goal review due', body: 'Review and update your goals for Q2 2026. A task has been added to your workspace.', time: '2d ago', unread: false, channel: 'In-App, Email' },
  { id: 'n5', icon: 'cadence', title: 'Annual goal creation', body: 'Time to create your goals for the upcoming year. A task has been added to your workspace.', time: '3d ago', unread: false, channel: 'In-App, Email' },
];

export const TASKS = [
  { id: 't1', title: 'Update your goals for Q2 2026', source: 'Quarterly review reminder', due: '2026-06-30', done: false },
  { id: 't2', title: 'Create your goals for FY2027', source: 'Annual creation reminder', due: '2026-07-15', done: false },
  { id: 't3', title: 'Provide feedback to Alex Reid', source: 'Feedback request', due: '2026-04-15', done: false },
];

// --- General check-in log (simplified, not per-goal) ---
// A log of discussions with a people leader or colleague: date, person, free-text notes.
export const CHECK_IN_LOG: CheckIn[] = [
  { id: 'ci1', date: '2026-06-18', withPerson: 'Alex Reid (People Leader)', notes: 'Discussed progress on the docs portal and agreed to push the public launch to end of July. Alex happy with momentum; flagged we need design review time booked.' },
  { id: 'ci2', date: '2026-05-30', withPerson: 'Nik Maniya (Mentor)', notes: 'Career conversation — talked through moving towards a Product Lead remit next FY. Action: shadow a portfolio planning session.' },
  { id: 'ci3', date: '2026-05-12', withPerson: 'Ben Scyne (Peer)', notes: 'Paired on the mentoring plan for the two grad PMs. Agreed a fortnightly cadence and shared a discovery template.' },
];

// --- Grade Expectations (hard-coded performance criteria; replaces external PowerPoint links) ---
export const GRADE_EXPECTATIONS: GradeExpectation[] = [
  {
    grade: 'G3', level: 'Associate',
    summary: 'Delivers defined tasks with guidance, builds core craft, and contributes reliably to team outcomes.',
    criteria: [
      { area: 'Delivery & Quality', expectation: 'Completes assigned work to agreed standards, on time, escalating blockers early.' },
      { area: 'Client Impact', expectation: 'Supports client deliverables; understands the “why” behind the work.' },
      { area: 'Collaboration', expectation: 'Works well within the team, asks for help, and shares progress openly.' },
      { area: 'Growth & Learning', expectation: 'Actively builds foundational skills and acts on feedback.' },
      { area: 'Leadership & Values', expectation: 'Lives the Scyne values; takes ownership of their own development.' },
    ],
  },
  {
    grade: 'G4', level: 'Consultant',
    summary: 'Owns workstreams end-to-end, solves ambiguous problems, and begins to guide others.',
    criteria: [
      { area: 'Delivery & Quality', expectation: 'Independently manages a workstream; anticipates risks and proposes solutions.' },
      { area: 'Client Impact', expectation: 'Builds trusted day-to-day client relationships and shapes parts of the engagement.' },
      { area: 'Collaboration', expectation: 'Coordinates across roles; gives clear, timely updates to leads.' },
      { area: 'Growth & Learning', expectation: 'Deepens domain expertise and seeks stretch beyond the current role.' },
      { area: 'Leadership & Values', expectation: 'Mentors associates informally; models openness and accountability.' },
    ],
  },
  {
    grade: 'G5', level: 'Senior Consultant / Manager',
    summary: 'Leads delivery of significant scope, develops people, and is accountable for client outcomes.',
    criteria: [
      { area: 'Delivery & Quality', expectation: 'Accountable for quality and timeliness across a project; manages scope and dependencies.' },
      { area: 'Client Impact', expectation: 'Owns key client relationships; identifies opportunities and shapes solutions.' },
      { area: 'Collaboration', expectation: 'Leads cross-functional teams; resolves conflict and aligns stakeholders.' },
      { area: 'Growth & Learning', expectation: 'Coaches team members and drives capability uplift in their area.' },
      { area: 'Leadership & Values', expectation: 'Sets the tone on values; makes fair, ethical decisions under pressure.' },
    ],
  },
  {
    grade: 'G6', level: 'Principal / Senior Manager',
    summary: 'Sets direction across multiple teams or accounts and grows the next generation of leaders.',
    criteria: [
      { area: 'Delivery & Quality', expectation: 'Accountable for outcomes across a portfolio; ensures consistent quality at scale.' },
      { area: 'Client Impact', expectation: 'Trusted senior advisor; drives account growth and strategic value.' },
      { area: 'Collaboration', expectation: 'Builds alignment across leaders; represents Scyne externally with credibility.' },
      { area: 'Growth & Learning', expectation: 'Develops managers; builds a strong, diverse talent pipeline.' },
      { area: 'Leadership & Values', expectation: 'Champions the values org-wide; holds the bar on ethics and inclusion.' },
    ],
  },
];

// --- Feedback theme clustering & keyword frequency (REQ2 #497) ---
export const FEEDBACK_THEMES = [
  { word: 'Reliable', count: 24 },
  { word: 'Collaborative', count: 19 },
  { word: 'Expert', count: 16 },
  { word: 'Communication', count: 11 },
  { word: 'Proactive', count: 9 },
  { word: 'Strategic', count: 7 },
  { word: 'Detail-oriented', count: 6 },
  { word: 'Mentor', count: 5 },
];
