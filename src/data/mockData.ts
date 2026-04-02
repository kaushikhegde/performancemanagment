import { Employee, Goal, ReviewCycle, Feedback } from '../types';

export const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Sarah Chen', role: 'Product Manager', department: 'Product', managerId: '10', reviewScore: 4.2, goalsDone: 6, totalGoals: 8, alignment: 'Aligned', avatar: 'SC', tenure: '3 yrs 2 mo', flightRisk: 'Low', nineBoxLabel: 'STAR ⭐' },
  { id: '2', name: 'Ben Scyne', role: 'Sr Engineer', department: 'Engineering', managerId: '11', reviewScore: 3.8, goalsDone: 4, totalGoals: 6, alignment: 'Partial', avatar: 'BS', tenure: '2 yrs 1 mo', flightRisk: 'Medium', nineBoxLabel: 'CORE PLAYER' },
  { id: '3', name: 'Yash Thakur', role: 'Sales Lead', department: 'Sales', managerId: '10', reviewScore: 4.5, goalsDone: 7, totalGoals: 7, alignment: 'Aligned', avatar: 'YT', tenure: '4 yrs', flightRisk: 'Low', nineBoxLabel: 'HIGH POTENTIAL' },
  { id: '4', name: 'Divya G', role: 'Marketing Analyst', department: 'Marketing', managerId: '11', reviewScore: 3.6, goalsDone: 3, totalGoals: 5, alignment: 'Partial', avatar: 'DG', tenure: '1 yr 6 mo', flightRisk: 'Low', nineBoxLabel: 'CORE PLAYER' },
  { id: '5', name: 'Nik Maniya', role: 'Product Lead', department: 'Product', managerId: '10', reviewScore: 4.8, goalsDone: 8, totalGoals: 8, alignment: 'Aligned', avatar: 'NM', tenure: '5 yrs', flightRisk: 'Low', nineBoxLabel: 'STAR ⭐' },
  { id: '6', name: 'Alex Reid', role: 'Director of Product', department: 'Product', reviewScore: 4.4, goalsDone: 5, totalGoals: 5, alignment: 'Aligned', avatar: 'AR' },
  { id: '7', name: 'Priya B', role: 'Engineering Manager', department: 'Engineering', reviewScore: 4.1, goalsDone: 6, totalGoals: 7, alignment: 'Aligned', avatar: 'PB' },
];

export const COMPANY_GOALS: Goal[] = [
  { id: 'cg1', title: 'Grow ARR to $50M by EOY', pillar: 'Revenue Growth', owner: 'Alex Reid', progress: 65, status: 'Active', dueDate: '2025-12-31', teamsAligned: 4, individualsContributing: 42 },
  { id: 'cg2', title: 'Achieve NPS > 65', pillar: 'Customer Success', owner: 'Sarah Chen', progress: 48, status: 'Active', dueDate: '2025-12-31', teamsAligned: 3, individualsContributing: 28 },
  { id: 'cg3', title: 'Launch Mobile Platform Q2', pillar: 'Product', owner: 'Nik Maniya', progress: 78, status: 'Active', dueDate: '2025-06-30', teamsAligned: 2, individualsContributing: 15 },
  { id: 'cg4', title: 'Reduce Attrition to < 8%', pillar: 'People', owner: 'Priya B', progress: 30, status: 'Active', dueDate: '2025-12-31', teamsAligned: 5, individualsContributing: 120 },
];

export const REVIEW_CYCLES: ReviewCycle[] = [
  { id: 'rc1', name: 'Q1 2025 Annual Review', type: 'Annual', participants: 12, selfReviewsDone: 8, managerReviewsDone: 5, calibrationDone: 0, status: 'Active', avgScore: 4.1, daysRemaining: 14 },
];

export const FEEDBACK: Feedback[] = [
  { id: 'f1', from: 'Alex Reid', to: 'Sarah Chen', text: 'Great job leading the product launch meeting today. Very clear roadmap.', type: 'Recognition', date: '2026-03-28' },
  { id: 'f2', from: 'Priya B', to: 'Ben Scyne', text: 'The new architecture proposal looks solid. Let\'s refine the database schema.', type: 'General', date: '2026-03-25' },
];
