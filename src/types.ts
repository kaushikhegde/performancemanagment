export type Status = 'Active' | 'Inactive' | 'Draft' | 'At Risk' | 'Completed' | 'Locked' | 'Upcoming' | 'Calibration' | 'Closed' | 'Pending Approval' | 'Not Started' | 'Aligned' | 'Partial' | 'Not Aligned';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  pillar?: string;
  owner: string;
  parentGoalId?: string;
  progress: number;
  status: Status;
  dueDate: string;
  weight?: number;
  keyResults?: KeyResult[];
  teamsAligned?: number;
  individualsContributing?: number;
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

export interface CheckIn {
  id: string;
  goalId: string;
  date: string;
  progress: number;
  confidence: 'On Track' | 'At Risk' | 'Off Track';
  notes: string;
  by: string;
}
