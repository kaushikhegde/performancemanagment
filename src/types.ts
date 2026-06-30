export type Status = 'Active' | 'Inactive' | 'Draft' | 'At Risk' | 'Completed' | 'Locked' | 'Upcoming' | 'Calibration' | 'Closed' | 'Pending Approval' | 'Not Started' | 'Aligned' | 'Partial' | 'Not Aligned' | 'On Track' | 'Needs Improvement' | 'Cancelled' | 'Rejected' | 'Changes Requested' | 'Overdue' | 'In Progress' | 'Approved' | 'Submitted' | 'Acknowledged';

export type GoalType = 'Strategic' | 'Individual' | 'Team';

export type GoalVisibility = 'Owner Only' | 'People Leader' | 'Project Leader' | 'Org Hierarchy' | 'Public';

export type ProgressType = 'Percentage' | 'Status' | 'Both';

export interface Milestone {
  id: string;
  description: string;
  targetDate: string;
  completed: boolean;
}

export interface ProgressUpdate {
  id: string;
  date: string;
  value: number;
  status?: Status;
  note?: string;
  by: string;
}

export interface GoalMetric {
  id: string;
  name: string;
  target: number;
  current?: number;
  unit: string;
}

export interface ReviewComment {
  id: string;
  by: string;
  role: string;
  date: string;
  text: string;
  action?: 'Comment' | 'Approved' | 'Changes Requested' | 'Rejected';
}

export interface RoleProfile {
  id: string;
  title: string;
  grade: string;
  department: string;
  responsibilities: string[];
  competencies: string[];
  performanceIndicators: string[];
}

export interface FeedbackRequest {
  id: string;
  requestor: string;
  respondent: string;
  respondentRole: string;
  scope: string;
  competencies: string[];
  dueDate: string;
  visibility: string;
  status: Status;
  anonymity: 'Named' | 'Anonymous';
}

export interface GoalChange {
  id: string;
  date: string;
  field: string;
  from: string;
  to: string;
  by: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  pillar?: string;
  owner: string;
  parentGoalId?: string;
  /** Practice Goals this goal aligns to (org-level goals) */
  parentGoalIds?: string[];
  progress: number;
  status: Status;
  dueDate: string;
  dateCreated?: string;
  weight?: number;
  keyResults?: KeyResult[];
  teamsAligned?: number;
  individualsContributing?: number;
  goalTypes?: GoalType[];
  scyneValues?: string[];
  visibility?: GoalVisibility;
  progressType?: ProgressType;
  milestones?: Milestone[];
  metrics?: GoalMetric[];
  progressHistory?: ProgressUpdate[];
  changeHistory?: GoalChange[];
  /** Once approved, the goal record cannot be deleted (status can still change) */
  approved?: boolean;
  linkedSkills?: string[];
  linkedActivities?: string[];
  linkedFeedback?: string[];
  linkedReview?: string;
  source?: 'Native' | 'D365 Import';
}

export interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  progress: number;
  owner?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId?: string;
  reviewScore: number;
  goalsDone: number;
  totalGoals: number;
  alignment: 'Aligned' | 'Partial' | 'Not Aligned';
  avatar?: string;
  tenure?: string;
  flightRisk?: 'Low' | 'Medium' | 'High';
  potential?: string;
  nineBoxLabel?: string;
}

export interface ReviewCycle {
  id: string;
  name: string;
  type: 'Annual' | 'Mid-Year' | 'Quarterly';
  participants: number;
  selfReviewsDone: number;
  managerReviewsDone: number;
  calibrationDone: number;
  status: Status;
  avgScore?: number;
  daysRemaining?: number;
}

export interface Feedback {
  id: string;
  from: string;
  to: string;
  text: string;
  type: 'Recognition' | 'Constructive' | 'General';
  date: string;
}

// Simplified, general check-in log — not tracked per goal.
// Captures a discussion with a people leader or colleague.
export interface CheckIn {
  id: string;
  date: string;
  /** Person the check-in discussion was held with */
  withPerson: string;
  notes: string;
}

// Grade-level performance expectations (replaces external PowerPoint criteria files)
export interface GradeExpectation {
  grade: string;
  level: string;
  summary: string;
  criteria: { area: string; expectation: string }[];
}
