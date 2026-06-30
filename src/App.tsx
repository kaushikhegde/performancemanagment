/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Target, 
  Users, 
  ClipboardList, 
  Trophy, 
  UserCircle, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  MoreVertical, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Filter,
  ArrowUpRight,
  Menu,
  ArrowLeft,
  ArrowRight,
  Circle,
  Info,
  ExternalLink,
  Save,
  Send,
  History,
  FileText,
  MessageSquare,
  Star,
  Calendar,
  Sparkles,
  Check,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  RefreshCw,
  Download,
  Copy,
  ChevronsUpDown,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Grid,
  Flag,
  Unlock,
  Upload,
  Link2,
  Eye,
  Tag,
  Trash2,
  Paperclip,
  ThumbsUp,
  Bell,
  Award,
  CheckSquare,
  Layers,
  UserPlus,
  Percent,
  Pencil,
  CheckCheck,
  ListTodo,
} from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line as ChartLine } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { EMPLOYEES, COMPANY_GOALS, REVIEW_CYCLES, FEEDBACK, MY_GOALS, GOAL_TYPES, SCYNE_VALUES, GOAL_VISIBILITY_OPTIONS, PROGRESS_STATUSES, SKILLS_PASSPORT, D365_IMPORT_GOALS, ROLE_PROFILES, COMPETENCIES, FEEDBACK_REQUESTS, REMINDER_SCHEDULE, NOTIFICATIONS, TASKS, FEEDBACK_THEMES, CHECK_IN_LOG, GRADE_EXPECTATIONS } from './data/mockData';
import { Status, Goal, CheckIn } from './types';

// --- Shared small UI helpers ---

const fmtDate = (iso: string) => {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Risk evaluation for a goal vs a reference "today" (REQ1 Deadlines & Risk Indicators)
const TODAY = new Date('2026-06-23');
const goalRisk = (goal: Goal): { atRisk: boolean; overdue: boolean; label: string } => {
  if (goal.status === 'Completed' || goal.status === 'Cancelled') return { atRisk: false, overdue: false, label: '' };
  const due = new Date(goal.dueDate + 'T00:00:00');
  const days = Math.ceil((due.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { atRisk: true, overdue: true, label: `Overdue by ${Math.abs(days)}d` };
  if (days <= 30 && goal.progress < 60) return { atRisk: true, overdue: false, label: `Due in ${days}d • ${goal.progress}%` };
  return { atRisk: false, overdue: false, label: '' };
};

// Active enforcement rules per visibility level (REQ1 #484)
const VISIBILITY_RULES: Record<string, string[]> = {
  'Owner Only': ['Hidden from People & Project Leaders', 'Excluded from manager review screens', 'Excluded from reporting & org search'],
  'People Leader': ['Visible in your goal profile', 'People Leader can review progress & comment', 'Auto-transfers if reporting line changes'],
  'Project Leader': ['Project Leaders can view & give feedback', 'Access auto-revoked when PL is unassigned'],
  'Org Hierarchy': ['Visible to authorised leaders above your grade', 'Supports succession & talent planning'],
  'Public': ['Shown on your development profile', 'Discoverable in search', 'Others can view but cannot edit'],
};

const VisibilityRules = ({ visibility }: { visibility: string }) => (
  <ul className="space-y-1">
    {(VISIBILITY_RULES[visibility] || []).map((r) => (
      <li key={r} className="flex items-start gap-1.5 text-[11px] text-muted-text">
        <Check size={11} className="text-green-600 mt-0.5 flex-shrink-0" />{r}
      </li>
    ))}
  </ul>
);

// Multi-select chip group used across goal forms
const ChipMultiSelect = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={cn(
            'px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all',
            active ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-border text-muted-text hover:bg-gray-50'
          )}
        >
          {active && <Check size={11} className="inline mr-1 -mt-0.5" />}
          {opt}
        </button>
      );
    })}
  </div>
);

// --- Chatbot Constants ---
const CHIP_RESPONSES: Record<string, string> = {
  'Summarize Performance': "Based on the latest review cycle, Sarah Chen has exceeded 3 of her 4 primary goals. Her strongest competency is 'Technical Execution' (5/5), while 'Strategic Alignment' (4/5) shows consistent growth. Key feedback from peers highlights her leadership during the Q3 migration.",
  'Identify Gaps': "Sarah's primary development area is 'Public Speaking'. While her technical documentation is excellent, she could benefit from leading more cross-functional presentations to increase her visibility with executive stakeholders.",
  'Draft Review': "Sarah has demonstrated exceptional growth this year. Her work on the Enterprise launch was pivotal, showing both technical depth and project management maturity. I recommend a 'Strong' rating with a focus on strategic leadership in the next half.",
  'Suggest Goals': "1. Lead 2 cross-functional strategy sessions by Q3.\n2. Mentor 2 junior PMs through the full product lifecycle.\n3. Complete Advanced Leadership certification.",
  'Compare Trends': "Compared to the previous cycle, Sarah's 'Collaboration' score improved from 3.8 to 4.5. Her goal completion rate also increased by 12% following the adoption of the new project management framework.",
  'Check Bias': "I've analyzed the draft. The language is objective and performance-based. No gender-coded terms or personality-based critiques were detected. The focus remains strictly on deliverables and competencies.",
  'Analyze Sentiment': "Peer feedback sentiment is 92% positive. The most frequent keywords are 'Reliable', 'Expert', and 'Collaborative'. There is a slight mention of 'Communication' being a growth area in 1 of 8 reviews.",
  'Draft Plan': "Development Plan for Sarah Chen:\n- Focus: Strategic Leadership\n- Q1: Lead Product Roadmap session\n- Q2: Executive Presence Workshop\n- Q3: Strategic Planning Certification"
};

const TRIGGER_CONFIGS: Record<string, { title: string, chips: string[] }> = {
  'CYCLE_WORKSPACE': {
    title: 'Cycle Intelligence',
    chips: ['Summarize Performance', 'Identify Gaps', 'Compare Trends']
  },
  'EMPLOYEE_REVIEW': {
    title: 'Review Assistant',
    chips: ['Summarize Performance', 'Analyze Sentiment', 'Check Bias']
  },
  'ANALYTICS': {
    title: 'Data Insights',
    chips: ['Compare Trends', 'Identify Gaps', 'Summarize Performance']
  },
  'MANAGER_EVALUATION': {
    title: 'Writing Assistant',
    chips: ['Draft Review', 'Check Bias', 'Suggest Goals']
  },
  'DEV_PLAN': {
    title: 'Growth Coach',
    chips: ['Draft Plan', 'Suggest Goals', 'Identify Gaps']
  }
};

// --- Components ---

const Badge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'Active': 'bg-green-100 text-green-700',
    'Inactive': 'bg-amber-100 text-amber-700',
    'Draft': 'bg-gray-100 text-gray-600',
    'At Risk': 'bg-red-100 text-red-700',
    'Completed': 'bg-green-100 text-green-700',
    'In Progress': 'bg-amber-100 text-amber-700 border-[#FCD34D]',
    'Calibration': 'bg-indigo-50 text-indigo-700',
    'Locked': 'bg-gray-200 text-gray-700',
    'Aligned': 'bg-green-100 text-green-700',
    'Partial': 'bg-amber-100 text-amber-700',
    'Not Aligned': 'bg-red-100 text-red-700',
    'Not Started': 'bg-gray-100 text-gray-600',
    'On Track': 'bg-green-100 text-green-700',
    'Needs Improvement': 'bg-amber-100 text-amber-700',
    'Cancelled': 'bg-gray-200 text-gray-500',
    'Pending Approval': 'bg-indigo-50 text-indigo-700',
    'Approved': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Changes Requested': 'bg-amber-100 text-amber-700',
    'Overdue': 'bg-red-100 text-red-700',
    'Submitted': 'bg-blue-100 text-blue-700',
    'Acknowledged': 'bg-green-100 text-green-700',
    'Upcoming': 'bg-blue-100 text-blue-700',
  };

  const isPulse = status === 'In Progress' || status === 'On Track';
  const isStatic = status === 'Completed' || status === 'Calibration' || status === 'Approved';

  return (
    <span className={cn('badge', styles[status] || 'bg-gray-100 text-gray-600', isPulse && 'border')}>
      {(isPulse || isStatic) && (
        <span className={cn(isPulse ? "status-dot-pulse" : "status-dot")} />
      )}
      {status}
    </span>
  );
};

const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => (
  <div className={cn("w-full bg-gray-100 rounded-full h-1.5 overflow-hidden", className)}>
    <div 
      className="bg-primary-action h-full transition-all duration-500" 
      style={{ width: `${progress}%` }} 
    />
  </div>
);

// --- Review Workspace Sub-components ---

const BellCurveChart = () => {
  const data = {
    labels: Array.from({ length: 21 }, (_, i) => i * 5),
    datasets: [
      {
        label: 'Below Expectations',
        data: [
          { x: 0, y: 0 }, { x: 5, y: 2 }, { x: 10, y: 5 }, { x: 15, y: 9 }, { x: 20, y: 14 }, { x: 25, y: 17 }, { x: 30, y: 16 }, { x: 35, y: 12 }
        ],
        fill: true,
        backgroundColor: 'rgba(251, 191, 36, 0.3)',
        borderColor: 'rgba(251, 191, 36, 0.8)',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Meets Expectations',
        data: [
          { x: 25, y: 17 }, { x: 30, y: 30 }, { x: 35, y: 48 }, { x: 40, y: 62 }, { x: 45, y: 72 }, { x: 50, y: 78 }, { x: 55, y: 80 }, { x: 60, y: 76 }, { x: 65, y: 65 }, { x: 70, y: 48 }, { x: 75, y: 30 }
        ],
        fill: true,
        backgroundColor: 'rgba(52, 211, 153, 0.3)',
        borderColor: 'rgba(52, 211, 153, 0.8)',
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Exceeds Expectations',
        data: [
          { x: 65, y: 65 }, { x: 70, y: 45 }, { x: 75, y: 28 }, { x: 80, y: 16 }, { x: 85, y: 9 }, { x: 90, y: 5 }, { x: 95, y: 2 }, { x: 100, y: 0 }
        ],
        fill: true,
        backgroundColor: 'rgba(34, 197, 94, 0.3)',
        borderColor: 'rgba(34, 197, 94, 0.8)',
        tension: 0.4,
        pointRadius: 0,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: {
        grid: { display: false },
        ticks: {
          callback: (value: any) => value === 0 || value === 50 || value === 100 ? `${value}%` : '',
          font: { size: 11 },
          color: '#9CA3AF'
        }
      }
    }
  };

  return (
    <div className="relative h-[240px] w-full">
      <div className="absolute top-0 left-[15%] z-10">
        <p className="text-[12px] font-medium text-[#D97706]">Below expectations</p>
        <p className="text-[20px] font-bold text-[#D97706]">9% <span className="text-[13px] font-normal">↓2%</span></p>
      </div>
      <div className="absolute top-0 left-[45%] z-10">
        <p className="text-[12px] font-medium text-[#059669]">Meets expectations</p>
        <p className="text-[20px] font-bold text-[#059669]">81% <span className="text-[13px] font-normal">↑2%</span></p>
      </div>
      <div className="absolute top-0 left-[75%] z-10">
        <p className="text-[12px] font-medium text-[#16A34A]">Exceeds expectations</p>
        <p className="text-[20px] font-bold text-[#16A34A]">10% <span className="text-[13px] font-normal">↑8%</span></p>
      </div>
      <ChartLine data={data} options={options as any} />
    </div>
  );
};

const RatingHeatmap = () => {
  const questions = [
    "How would you rate your overall performance this review period?",
    "How effectively did you meet your goals for this period?",
    "Rate your growth and skill development during this period.",
    "How well did you collaborate with your team?",
    "How effectively did you communicate with stakeholders?"
  ];

  const data = [
    { label: 'Participants', color: '#464E7E', scores: [5, 2, 3, 4, 3] },
    { label: 'Peers', color: '#7C3AED', scores: [3, 3, 4, 3, 4] },
    { label: 'Managers', color: '#F43F5E', scores: [4, 5, 4, 3, 5] },
  ];

  const getCellColor = (score: number) => {
    switch (score) {
      case 1: return { bg: '#FEE2E2', text: '#991B1B' };
      case 2: return { bg: '#FEF3C7', text: '#92400E' };
      case 3: return { bg: '#D1FAE5', text: '#065F46' };
      case 4: return { bg: '#6EE7B7', text: '#064E3B' };
      case 5: return { bg: '#059669', text: '#FFFFFF' };
      default: return { bg: '#FFFFFF', text: '#18181B' };
    }
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[120px_repeat(5,140px)] min-w-[820px]">
        {/* Header */}
        <div className="border-b-2 border-r-2 border-border" />
        {questions.map((q, i) => (
          <div key={i} className="p-2 border-b-2 border-r border-border text-[11px] text-muted-text font-normal line-clamp-2 h-12 flex items-end">
            {q}
          </div>
        ))}

        {/* Rows */}
        {data.map((row, i) => (
          <React.Fragment key={i}>
            <div className="p-3 border-b border-r-2 border-border text-[11px] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </div>
            {row.scores.map((score, j) => {
              const { bg, text } = getCellColor(score);
              return (
                <div 
                  key={j} 
                  className={cn(
                    "p-4 border-b border-r border-border/20 flex items-center justify-center text-[24px] font-bold transition-all duration-300",
                    score === 5 && "animate-pulse-once"
                  )}
                  style={{ backgroundColor: bg, color: text }}
                >
                  {score}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p className="text-[11px] text-muted-text mt-2">Scroll to see more questions →</p>
    </div>
  );
};

const NineBoxGrid = () => {
  const quadrants = [
    { label: "Potential gem", bg: "#FEF3C7", color: "#D97706", employees: 3 },
    { label: "High potential", bg: "#CFFAFE", color: "#0891B2", employees: 3 },
    { label: "⭐ Star", bg: "#DCFCE7", color: "#16A34A", employees: 2 },
    { label: "Inconsistent player", bg: "#FEE2E2", color: "#DC2626", employees: 4 },
    { label: "Core player", bg: "#FEF9C3", color: "#D97706", employees: 25 },
    { label: "High performer", bg: "#D1FAE5", color: "#059669", employees: 3 },
    { label: "🚩 Risk", bg: "#FECACA", color: "#DC2626", employees: 2 },
    { label: "Average performer", bg: "#FEF3C7", color: "#D97706", employees: 3 },
    { label: "Solid performer", bg: "#E0F2FE", color: "#0891B2", employees: 3 },
  ];

  const employeeColors = ["#464E7E", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#BE185D", "#0D9488"];

  return (
    <div className="relative">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-180 text-[12px] text-muted-text" style={{ writingMode: 'vertical-rl' }}>
        Potential →
      </div>
      <div className="grid grid-cols-3 gap-0 border border-border">
        {quadrants.map((q, i) => (
          <div key={i} className="min-h-[120px] p-3 border border-border/20 relative group cursor-pointer hover:border-2 transition-all" style={{ backgroundColor: q.bg, borderColor: q.color }}>
            <span className="text-[11px] font-semibold" style={{ color: q.color }}>{q.label}</span>
            <div className="flex items-center mt-4 -space-x-2.5 overflow-hidden">
              {Array.from({ length: Math.min(q.employees, 4) }).map((_, j) => (
                <div 
                  key={j} 
                  className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: employeeColors[(i + j) % employeeColors.length] }}
                >
                  {String.fromCharCode(65 + (i + j) % 26)}{String.fromCharCode(65 + (i + j + 1) % 26)}
                </div>
              ))}
              {q.employees > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#E4E4E7] text-[#52525B] text-[11px] font-bold flex items-center justify-center shadow-sm">
                  +{q.employees - 4}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-[12px] text-muted-text">
        Performance →
      </div>
    </div>
  );
};

const AISummaryPanel = () => {
  const [insight, setInsight] = useState("Significant strengths are being identified in communication, teamwork, time management, and adaptability. Employees showed leadership potential and often exceeded expectations.");
  const [isFading, setIsFading] = useState(false);

  const updateInsight = (newText: string) => {
    setIsFading(true);
    setTimeout(() => {
      setInsight(newText);
      setIsFading(false);
    }, 150);
  };

  const chips = [
    { label: "Tell me more", text: "Engineering leads the org with 4.3 avg score. 3 employees moved from Meets to Exceeds since last cycle. Goal completion improved by 12% org-wide compared to FY 2024–25." },
    { label: "What's not going well?", text: "Sales has the highest self-vs-manager variance at 1.8 points avg. Goal Achievement is the weakest competency in Marketing (2.8 avg). 2 employees are flagged as flight risk." },
    { label: "Show risk signals", text: "Devon Lane (Trust Admin) declined from Meets to Needs Improvement. 4 employees in Sales have goal completion below 50%. Calibration flagged 3 manager overrides." },
    { label: "Compare to last cycle", text: "Org-wide score up 0.3 vs FY 2024–25. Growth Mindset improved most (+0.5). Below Expectations band reduced from 11% to 9% (↓2%)." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-7">
        <BellCurveChart />
      </div>
      <div className="lg:col-span-5 space-y-4">
        <p className={cn(
          "text-[15px] font-semibold text-[#18181B] leading-relaxed transition-opacity duration-150",
          isFading ? "opacity-0" : "opacity-1"
        )}>
          {insight}
        </p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, i) => (
            <button 
              key={i} 
              onClick={() => updateInsight(chip.text)}
              className="px-3 py-1.5 rounded-full border border-primary-action text-primary-action text-[12px] hover:bg-[#EEF2FF] transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className="relative mt-6">
          <input 
            type="text" 
            placeholder="Ask anything about this performance cycle..."
            className="w-full border border-border rounded-[4px] py-2 pl-3 pr-9 text-[11px] italic focus:outline-none focus:ring-1 focus:ring-primary-action"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateInsight("Based on the current cycle data, here's what I found: FY 2025–26 Year-End has 71 participants with an average score of 4.1. The most common development theme is goal-setting precision, mentioned in 68% of manager reviews.");
              }
            }}
          />
          <Send size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-action cursor-pointer" />
        </div>
        <p className="text-[10px] italic text-[#9CA3AF]">AI-generated insights — verify before acting</p>
      </div>
    </div>
  );
};

const CompletionTracker = ({ onRowClick }: { onRowClick: (name: string) => void }) => {
  const data = [
    { name: 'Darrell Steward', role: 'Product designer', progress: '3/3', status: 'complete', prev: { n: 2, l: 'Meets' }, curr: { n: 3, l: 'Exceeds' } },
    { name: 'Daniele Richards', role: 'Org Admin', progress: '5/5', status: 'complete', prev: { n: 2, l: 'Meets' }, curr: { n: 3, l: 'Exceeds' } },
    { name: 'Christopher W-H', role: 'Branch Manager', progress: '2/5', status: 'partial', prev: { n: 2, l: 'Meets' }, curr: null },
    { name: 'Devon Lane', role: 'Trust Admin', progress: '4/4', status: 'complete', prev: { n: 1, l: 'Needs improvement' }, curr: { n: 2, l: 'Meets' } },
    { name: 'Sarah Chen', role: 'Product Manager', progress: '4/4', status: 'complete', prev: { n: 2, l: 'Meets' }, curr: { n: 3, l: 'Exceeds' } },
    { name: 'Ben Scyne', role: 'Sr Engineer', progress: '3/4', status: 'partial', prev: { n: 3, l: 'Exceeds' }, curr: null },
  ];

  const getRatingStyle = (n: number) => {
    switch (n) {
      case 1: return { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' };
      case 2: return { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' };
      case 3: return { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600' };
    }
  };

  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="table-header w-12">#</th>
            <th className="table-header">Person</th>
            <th className="table-header">Progress</th>
            <th className="table-header">Previous Rating</th>
            <th className="table-header">Rating</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onRowClick(row.name)}>
              <td className="table-cell text-muted-text">{i + 1}</td>
              <td className="table-cell">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[11px]">
                    {row.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold">{row.name}</span>
                    <span className="text-[11px] text-muted-text">{row.role}</span>
                  </div>
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  {row.status === 'complete' ? (
                    <CheckCircle2 size={14} className="text-[#16A34A]" />
                  ) : (
                    <Clock size={14} className="text-[#D97706]" />
                  )}
                  <span className={cn("text-[12px]", row.status === 'complete' ? "text-[#16A34A]" : "text-[#D97706]")}>
                    {row.progress} reviews completed
                  </span>
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <span className={cn("w-5 h-5 flex items-center justify-center rounded-[2px] text-[10px] font-bold", getRatingStyle(row.prev.n).bg, getRatingStyle(row.prev.n).text)}>
                    {row.prev.n}
                  </span>
                  <span className={cn("text-[12px]", getRatingStyle(row.prev.n).text)}>{row.prev.l}</span>
                </div>
              </td>
              <td className="table-cell">
                {row.curr ? (
                  <div className="flex items-center gap-2">
                    <span className={cn("w-5 h-5 flex items-center justify-center rounded-[2px] text-[10px] font-bold", getRatingStyle(row.curr.n).bg, getRatingStyle(row.curr.n).text)}>
                      {row.curr.n}
                    </span>
                    <span className={cn("text-[12px]", getRatingStyle(row.curr.n).text)}>{row.curr.l}</span>
                  </div>
                ) : (
                  <span className="text-[12px] text-muted-text italic">Empty</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimelineView = () => {
  const events = [
    { date: '15 Jan 2026', text: 'Cycle created by Priya B (HR Admin)', type: 'created', actor: 'Priya B' },
    { date: '01 Feb 2026', text: 'Self-assessment window opened', type: 'opened', actor: 'System' },
    { date: '14 Feb 2026', text: 'Sarah Chen submitted self-assessment', type: 'self', actor: 'Sarah Chen' },
    { date: '15 Feb 2026', text: 'Ben Scyne submitted self-assessment', type: 'self', actor: 'Ben Scyne' },
    { date: '20 Feb 2026', text: 'Reminder sent to 8 employees', type: 'reminder', actor: 'System' },
    { date: '01 Mar 2026', text: 'Manager review window opened', type: 'opened', actor: 'System' },
    { date: '15 Mar 2026', text: 'Alex Reid submitted manager review for Sarah Chen', type: 'manager', actor: 'Alex Reid' },
    { date: '20 Mar 2026', text: 'Peer review submitted: Ben Scyne → Sarah Chen', type: 'peer', actor: 'Ben Scyne' },
    { date: '02 Apr 2026', text: 'Calibration session opened', type: 'calibration', actor: 'HR Admin' },
  ];

  const getDotColor = (type: string) => {
    switch (type) {
      case 'created': return '#464E7E';
      case 'self': return '#16A34A';
      case 'manager': return '#3B82F6';
      case 'peer': return '#14B8A6';
      case 'reminder': return '#D97706';
      case 'calibration': return '#7C3AED';
      default: return '#464E7E';
    }
  };

  return (
    <div className="relative pl-8 space-y-8">
      <div className="absolute left-[24px] top-2 bottom-2 w-0.5 bg-[#E4E4E7]" />
      {events.map((event, i) => (
        <div key={i} className="relative flex items-center gap-6 group">
          <div 
            className="absolute -left-[13px] w-2.5 h-2.5 rounded-full border-2 border-white z-10" 
            style={{ backgroundColor: getDotColor(event.type) }}
          />
          <div className="min-w-[120px] text-[11px] text-[#9CA3AF] font-medium">{event.date}</div>
          <div className="flex-1 text-[13px] text-[#18181B]">{event.text}</div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-muted-text">
              {event.actor.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-[12px] text-muted-text">{event.actor}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const ReviewTasksPanel = ({ onTaskClick }: { onTaskClick: (name: string) => void }) => {
  const tasks = [
    { name: 'Esther Howard', role: 'Engineering Team Lead', type: 'Manager review', color: '#EEF2FF', text: '#464E7E' },
    { name: 'Jane Cooper', role: 'Software Engineer', type: 'Manager review', color: '#EEF2FF', text: '#464E7E' },
    { name: 'Ella Smith', role: 'Frontend Developer', type: 'Peer review', color: '#F0FDF4', text: '#16A34A' },
    { name: 'Liam Brown', role: 'UI Designer', type: 'Peer review', color: '#F0FDF4', text: '#16A34A' },
    { name: 'Olivia Davis', role: 'Product Manager', type: 'Upward review', color: '#FFF7ED', text: '#D97706' },
    { name: 'Noah Wilson', role: 'UX Researcher', type: 'Peer review', color: '#F0FDF4', text: '#16A34A' },
  ];

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-[16px] font-semibold text-[#18181B] p-5 pb-3">Your review tasks</h3>
      <div className="flex-1 overflow-y-auto">
        {tasks.map((task, i) => (
          <div 
            key={i} 
            className="px-5 py-3 border-b border-[#F4F4F5] flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onTaskClick(task.name)}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[11px]">
              {task.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[13px] font-semibold">{task.name}</span>
              <span className="text-[11px] text-muted-text">{task.role}</span>
            </div>
            <span 
              className="text-[11px] font-medium px-2 py-0.5 rounded-[4px]" 
              style={{ backgroundColor: task.color, color: task.text }}
            >
              {task.type}
            </span>
          </div>
        ))}
        <button className="px-5 py-3 text-[12px] text-primary-action font-medium hover:underline">3 more reviews</button>
      </div>
    </div>
  );
};

const AIFloatingPopup = ({ onClose }: { onClose: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [insight, setInsight] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      className="fixed right-6 top-[120px] w-[320px] bg-white border border-border rounded-[8px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[500] overflow-hidden"
    >
      <div 
        className="px-4 py-3 border-b border-[#F4F4F5] flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1.5 text-[#7C3AED] font-semibold text-[13px]">
          <Sparkles size={14} />
          Humaans AI
        </div>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-primary-text">
          <Plus size={14} className="rotate-45" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {insight ? (
          <p className="text-[13px] text-[#18181B] leading-relaxed">{insight}</p>
        ) : (
          <>
            <div>
              <p className="text-[11px] font-semibold text-[#7C3AED] mb-1.5">Key achievements:</p>
              <div className="border-l-2 border-[#7C3AED] pl-2 space-y-1">
                <p className="text-[12px] text-[#18181B]">Led infrastructure project reducing downtime by 15%</p>
                <p className="text-[12px] text-[#18181B]">Led API improvement reducing customer onboarding time by 30%</p>
                {isExpanded && (
                  <>
                    <p className="text-[12px] text-[#18181B]">Optimized CI/CD pipeline reducing build times by 40%</p>
                    <p className="text-[12px] text-[#18181B]">Mentored 3 junior engineers on best practices</p>
                    <p className="text-[12px] text-[#18181B]">Contributed to 5 cross-functional architecture reviews</p>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#7C3AED] mb-1.5">Growth areas:</p>
              <div className="border-l-2 border-[#7C3AED] pl-2 space-y-1">
                <p className="text-[12px] text-[#18181B]">Task delegation</p>
                <p className="text-[12px] text-[#18181B]">Data analysis skills</p>
              </div>
            </div>
            <p className="text-[12px] text-[#71717A]">Would you like to see more?</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setIsExpanded(true)} className="px-3 py-1.5 rounded-full border border-border text-[#18181B] text-[12px] hover:bg-[#F4F4F5] transition-colors">More details</button>
              <button className="px-3 py-1.5 rounded-full border border-border text-[#18181B] text-[12px] hover:bg-[#F4F4F5] transition-colors">Suggest improvement plan</button>
            </div>
          </>
        )}
      </div>

      <div className="p-3 border-t border-[#F4F4F5]">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ask me anything..."
            className="w-full border border-border rounded-[4px] py-1.5 pl-2.5 pr-8 text-[11px] italic focus:outline-none focus:ring-1 focus:ring-primary-action"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setInsight("Based on this review, Esther Howard's strongest contribution was the API integration project. Their self-rating aligns closely with manager ratings (0.3 variance), suggesting strong self-awareness. I recommend focusing development on data analysis skills and delegation strategies.");
              }
            }}
          />
          <Send size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primary-action cursor-pointer" />
        </div>
        {insight && (
          <button onClick={() => setInsight("")} className="text-[12px] text-primary-action mt-2 hover:underline">[New question →]</button>
        )}
      </div>
    </motion.div>
  );
};

// --- Main Workspace Views ---

const CycleWorkspaceView = ({ 
  cycleName, 
  onBack, 
  onEmployeeClick,
  openChatbot
}: { 
  cycleName: string, 
  onBack: () => void, 
  onEmployeeClick: (name: string) => void,
  openChatbot: (trigger: string, context?: any) => void
}) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSubTab, setActiveSubTab] = useState('Performance Rating');

  useEffect(() => {
    if (activeSubTab === 'AI Summary') {
      openChatbot('CYCLE_WORKSPACE', { cycleName });
    }
  }, [activeSubTab, cycleName]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Workspace Header */}
      <header className="h-[52px] border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-text hover:text-primary-text">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-[18px] font-semibold text-[#18181B]">{cycleName}</h2>
          <Badge status="In Progress" />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline">Add People</button>
          <button className="btn-outline">Edit Template</button>
          <button className="btn-outline text-[#DC2626] border-[#FECACA] hover:bg-red-50">End Review Cycle</button>
          <button className="p-1.5 hover:bg-gray-100 rounded-[4px] text-muted-text">
            <MoreVertical size={16} />
          </button>
        </div>
      </header>

      {/* Sub-tab Bar */}
      <div className="h-[44px] border-b border-border flex items-center justify-between px-6 bg-white flex-shrink-0">
        <div className="flex gap-6 h-full">
          {['Overview', 'Timeline'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-full text-[13px] font-medium transition-all relative",
                activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input 
            type="text" 
            placeholder="Search people in this review"
            className="w-[200px] border border-border rounded-[4px] py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-action"
          />
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'Overview' ? (
          <>
            {/* Left Panel */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Second-level Sub-tabs */}
              <div className="flex items-center justify-between border-b border-border mb-4">
                <div className="flex gap-6">
                  {['AI Summary', 'Performance Rating', 'Rating Heatmap', '9 Box'].map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveSubTab(tab)}
                      className={cn(
                        "pb-3 text-[12px] font-medium transition-all relative",
                        activeSubTab === tab ? "text-[#18181B] border-b-[1.5px] border-[#18181B]" : "text-[#71717A] hover:text-[#18181B]"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border text-[12px] text-[#52525B] hover:bg-[#F4F4F5]">
                  <Filter size={12} />
                  Add filter
                </button>
              </div>

              {/* Analytics Content */}
              <div className="min-h-[300px]">
                {activeSubTab === 'AI Summary' && <AISummaryPanel />}
                {activeSubTab === 'Performance Rating' && <BellCurveChart />}
                {activeSubTab === 'Rating Heatmap' && <RatingHeatmap />}
                {activeSubTab === '9 Box' && <NineBoxGrid />}
              </div>

              {/* Completion Tracker */}
              <div className="pt-8">
                <h3 className="text-[14px] font-bold text-muted-text uppercase tracking-wider mb-4">Completion Tracker</h3>
                <CompletionTracker onRowClick={onEmployeeClick} />
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-[37%] border-l border-border bg-white overflow-hidden">
              <ReviewTasksPanel onTaskClick={onEmployeeClick} />
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-10">
            <TimelineView />
          </div>
        )}
      </div>
    </div>
  );
};

const IndividualReviewWorkspaceView = ({ 
  employeeName, 
  onBack,
  openChatbot
}: { 
  employeeName: string, 
  onBack: () => void,
  openChatbot: (trigger: string, context?: any) => void
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [activeReviewer, setActiveReviewer] = useState('Self');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white relative">
      {/* Header */}
      <header className="h-[52px] border-b border-border flex items-center px-6 gap-3 flex-shrink-0 bg-white">
        <button onClick={onBack} className="text-muted-text hover:text-primary-text">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-[18px] font-semibold text-[#18181B]">Yearly 360 review — {employeeName}</h2>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Zone A: Secondary Nav */}
        <div 
          className={cn(
            "border-r border-border bg-white flex flex-col transition-all duration-200 overflow-hidden",
            isNavCollapsed ? "w-[44px]" : "w-[220px]"
          )}
        >
          <div className="p-4 flex items-center justify-between">
            {!isNavCollapsed && <span className="text-[11px] uppercase font-bold text-[#71717A] tracking-wider">Reviews</span>}
            <button onClick={() => setIsNavCollapsed(!isNavCollapsed)} className="text-[#9CA3AF] hover:text-primary-text">
              {isNavCollapsed ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {/* Self Review */}
              <div>
                {!isNavCollapsed && <p className="px-4 text-[10px] uppercase font-bold text-[#9CA3AF] mb-1">Self review</p>}
                <button 
                  onClick={() => setActiveReviewer('Self')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 transition-all relative group",
                    activeReviewer === 'Self' ? "bg-[#EEF2FF] border-l-2 border-primary-action" : "hover:bg-[#F4F4F5]"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] flex-shrink-0">EH</div>
                  {!isNavCollapsed && (
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-[12px] font-semibold truncate">Esther Howard</span>
                      <span className="text-[10px] text-muted-text truncate">Engineering Lead</span>
                    </div>
                  )}
                  <CheckCircle2 size={16} className="text-[#16A34A] flex-shrink-0" />
                </button>
              </div>

              {/* Peer Reviews */}
              <div>
                {!isNavCollapsed && <p className="px-4 text-[10px] uppercase font-bold text-[#9CA3AF] mb-1">Peer reviews</p>}
                <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F4F4F5] text-primary-action">
                  <Users size={16} />
                  {!isNavCollapsed && <span className="text-[12px] font-medium">Peer nominations</span>}
                  <CheckCircle2 size={16} className="text-[#16A34A] ml-auto" />
                </button>
                {[
                  { name: 'Jacob Jones', role: 'Tax Officer', status: 'done' },
                  { name: 'Jane Cooper', role: 'Tax Officer', status: 'pending' },
                ].map((peer, i) => (
                  <button 
                    key={i}
                    onClick={() => setActiveReviewer(peer.name)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 transition-all relative group",
                      activeReviewer === peer.name ? "bg-[#EEF2FF] border-l-2 border-primary-action" : "hover:bg-[#F4F4F5]"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] flex-shrink-0">
                      {peer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {!isNavCollapsed && (
                      <div className="flex flex-col text-left flex-1 min-w-0">
                        <span className="text-[12px] font-semibold truncate">{peer.name}</span>
                        <span className="text-[10px] text-muted-text truncate">{peer.role}</span>
                      </div>
                    )}
                    {peer.status === 'done' ? (
                      <CheckCircle2 size={16} className="text-[#16A34A] flex-shrink-0" />
                    ) : (
                      <Settings size={14} className="text-[#9CA3AF] flex-shrink-0 cursor-pointer hover:text-primary-text" />
                    )}
                  </button>
                ))}
              </div>

              {/* Manager Reviews */}
              <div>
                {!isNavCollapsed && <p className="px-4 text-[10px] uppercase font-bold text-[#9CA3AF] mb-1">Manager reviews</p>}
                <button 
                  onClick={() => setActiveReviewer('Jeremy')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 transition-all relative group",
                    activeReviewer === 'Jeremy' ? "bg-[#EEF2FF] border-l-2 border-primary-action" : "hover:bg-[#F4F4F5]"
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px] flex-shrink-0">JN</div>
                  {!isNavCollapsed && (
                    <div className="flex flex-col text-left flex-1 min-w-0">
                      <span className="text-[12px] font-semibold truncate">Jeremy Nice</span>
                      <span className="text-[10px] text-muted-text truncate">Head of Engineering</span>
                    </div>
                  )}
                  <Settings size={14} className="text-[#9CA3AF] flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zone B: Main Content */}
        <div className="flex-1 bg-white overflow-y-auto relative">
          {/* Attribution Bar */}
          <div className="bg-[#F9FAFB] border-b border-border px-6 py-2.5 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#16A34A]" />
              <span className="text-[12px] text-[#71717A]">Submitted by</span>
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px]">JJ</div>
              <span className="text-[12px] font-semibold text-[#18181B]">John Jones</span>
              <span className="text-[12px] text-[#71717A]">Engineering Team Lead</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[#71717A]">17 Sep 2024</span>
              <button 
                onClick={() => openChatbot('EMPLOYEE_REVIEW', { employeeName })}
                className="p-1 text-[#7C3AED] hover:bg-[#F5F3FF] rounded-[4px] transition-colors"
              >
                <Sparkles size={16} />
              </button>
            </div>
          </div>

          {/* Employee Intro */}
          <div className="bg-[#F9FAFB] border-b border-border px-6 py-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[18px]">EH</div>
            <div>
              <h3 className="text-[18px] font-semibold text-[#18181B]">{employeeName}</h3>
              <p className="text-[14px] text-muted-text">Engineering Team Lead</p>
            </div>
          </div>

          {/* Review Content */}
          <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
            <div className="space-y-1">
              <p className="text-[12px] uppercase font-medium text-[#71717A] tracking-wider">What were your key accomplishments this period?</p>
              <p className="text-[14px] text-[#18181B] leading-relaxed">
                "I successfully led the development of a major feature: the new API integration that reduced customer onboarding time by 30%. This project was cross-functional, involving coordination between Engineering, Product, and Sales. We aligned the feature with customer needs and feedback, which contributed directly to improving our customer experience and helped the Sales team close two major contracts. Additionally, I spearheaded the migration to a more scalable infrastructure architecture."
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] uppercase font-medium text-[#71717A] tracking-wider">How effectively did you meet your goals?</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className={cn("w-6 h-6 rounded-full border-2", n <= 4 ? "bg-indigo-600 border-indigo-600" : "border-gray-200")} />
                ))}
              </div>
              <p className="text-[14px] text-[#18181B] font-medium">4 — Advanced</p>
              <p className="text-[14px] text-[#18181B] leading-relaxed">"I met 3 of 4 goals fully and made significant progress on the fourth."</p>
            </div>

            <div className="space-y-3">
              <p className="text-[12px] uppercase font-medium text-[#71717A] tracking-wider">Rate your growth and skill development</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className={cn("w-6 h-6 rounded-full border-2", n <= 3 ? "bg-indigo-600 border-indigo-600" : "border-gray-200")} />
                ))}
              </div>
              <p className="text-[14px] text-[#18181B] font-medium">3 — Proficient</p>
              <p className="text-[14px] text-[#18181B] leading-relaxed">"I improved my technical leadership skills significantly but need to develop further in data analysis and delegation."</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Request Feedback Modal (REQ2 #493) ---
const RequestFeedbackModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [respondents, setRespondents] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('');
  const [linkedRoles, setLinkedRoles] = useState<string[]>([]);
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [linkedGoals, setLinkedGoals] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [dueDate, setDueDate] = useState('2026-07-03');
  const [visibility, setVisibility] = useState('Requestor + Respondent + direct TL');
  const [done, setDone] = useState(false);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    setter((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const matches = search ? EMPLOYEES.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())) : [];

  const reset = () => { setDone(false); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={reset} className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] bg-white rounded-[8px] shadow-xl z-50 flex flex-col max-h-[88vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Send size={16} className="text-primary-action" /><h3 className="font-bold text-[15px]">Request Feedback</h3></div>
              <button onClick={reset} className="text-muted-text hover:text-primary-text"><X size={18} /></button>
            </div>

            {!done ? (
              <>
                <div className="p-5 overflow-y-auto space-y-5">
                  {/* Respondents typeahead (#493) */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold">Respondents <span className="text-muted-text font-normal">(by name or role — TL, PM, Lead)</span></label>
                    {respondents.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {respondents.map((r) => (
                          <span key={r} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full flex items-center gap-1">{r}<button onClick={() => toggle(setRespondents)(r)}><X size={10} /></button></span>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
                      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search org directory…" className="w-full border border-border rounded-[4px] pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    </div>
                    {matches.length > 0 && (
                      <div className="border border-border rounded-[4px] divide-y divide-border max-h-40 overflow-y-auto">
                        {matches.map((e) => (
                          <button key={e.id} onClick={() => { toggle(setRespondents)(e.name); setSearch(''); }} className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">{e.avatar}</div>
                            <span className="text-[12px] font-medium">{e.name}</span>
                            <span className="text-[11px] text-muted-text">{e.role}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scope: work period / project + link roles & experiences */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold">Scope — Work period / project / context</label>
                    <input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Q2 Mobile Launch" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    <span className="text-[10px] uppercase tracking-wider text-muted-text">Link roles &amp; experiences from profile</span>
                    <ChipMultiSelect options={SKILLS_PASSPORT['Roles & Experience']} selected={linkedRoles} onToggle={toggle(setLinkedRoles)} />
                  </div>

                  {/* Competencies / goals to assess */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold">Competencies to assess</label>
                    <ChipMultiSelect options={COMPETENCIES} selected={competencies} onToggle={toggle(setCompetencies)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold">Goals to assess</label>
                    <ChipMultiSelect options={MY_GOALS.map((g) => g.title)} selected={linkedGoals} onToggle={toggle(setLinkedGoals)} />
                  </div>

                  {/* Free text context */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-bold">Context to guide feedback <span className="text-muted-text font-normal">(optional)</span></label>
                    <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="What should respondents focus on?" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold">Due date <span className="text-muted-text font-normal">(policy: 7–10 days)</span></label>
                      <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-bold">Visibility</label>
                      <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full border border-border rounded-[4px] px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action">
                        <option>Requestor + Respondent + direct TL</option>
                        <option>Requestor + Respondent</option>
                        <option>Requestor only</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-5 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-text">{respondents.length} respondent(s)</span>
                  <div className="flex gap-2">
                    <button onClick={reset} className="btn-outline">Cancel</button>
                    <button onClick={() => setDone(true)} disabled={respondents.length === 0} className="btn-primary flex items-center gap-2"><Send size={14} /> Send Request</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                <h3 className="font-bold text-[15px]">Request sent</h3>
                <p className="text-[12px] text-muted-text max-w-xs">A task (email + in-app) was created for {respondents.length} respondent(s) with the context summary, due date ({fmtDate(dueDate)}) and a Start-form link.</p>
                <button onClick={reset} className="btn-primary mt-2">Done</button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Scyne 360 Structured Feedback Form (REQ2 #495) ---
const Scyne360FormModal = ({ open, onClose, requestFrom }: { open: boolean; onClose: () => void; requestFrom?: string }) => {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [attachment, setAttachment] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const comps = COMPETENCIES.slice(0, 4);
  const complete = comps.every((c) => ratings[c]) && comments.trim().length > 0;
  const [audit, setAudit] = useState<string[]>(['Opened — 09:02']);

  const saveDraft = () => { setSavedAt('just now'); setAudit((p) => [...p, 'Saved draft — 09:06']); };
  const submit = () => {
    if (!complete) { setShowValidation(true); return; }
    setAudit((p) => [...p, 'Submitted — 09:09']);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] bg-white rounded-[8px] shadow-xl z-50 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[15px]">Scyne 360° Feedback Form</h3>
                <p className="text-[11px] text-muted-text">For {requestFrom || 'Sarah Chen'} • Est. 8 min to complete</p>
              </div>
              <button onClick={onClose} className="text-muted-text hover:text-primary-text"><X size={18} /></button>
            </div>

            {/* privacy notice (#495) */}
            <div className="px-5 py-2 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2 text-[11px] text-indigo-800">
              <Eye size={13} /> Your name <strong>will be visible</strong> to the requestor. Scores are shared per request policy.
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {comps.map((c) => (
                <div key={c} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-bold">{c} <span className="text-red-500">*</span></label>
                    {showValidation && !ratings[c] && <span className="text-[10px] text-red-500">Required</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRatings((p) => ({ ...p, [c]: n }))} className={cn('w-9 h-9 rounded-[4px] border text-[12px] font-bold transition-all', ratings[c] === n ? 'bg-primary-action text-white border-primary-action' : 'bg-white border-border text-muted-text hover:bg-gray-50')}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold">Comments <span className="text-red-500">*</span></label>
                {showValidation && !comments.trim() && <span className="text-[10px] text-red-500 block">Required</span>}
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Specific, behavioural examples…" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
              </div>

              {/* Attachment (#495) */}
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold">Attachment <span className="text-muted-text font-normal">(optional — PDF/PNG, max 5MB)</span></label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAttachment('evidence.pdf')} className="btn-outline flex items-center gap-2"><Paperclip size={13} /> Attach file</button>
                  {attachment && <span className="text-[12px] text-muted-text flex items-center gap-1">{attachment}<button onClick={() => setAttachment('')}><X size={12} /></button></span>}
                </div>
              </div>

              {/* Audit events (#495) */}
              <div className="text-[10px] text-muted-text border-t border-border pt-2">
                Audit: {audit.join(' · ')}
              </div>
            </div>

            <div className="p-5 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-text flex items-center gap-1">{savedAt ? <><Check size={12} className="text-green-600" /> Autosaved {savedAt}</> : 'Not saved'}</span>
              <div className="flex gap-2">
                <button onClick={saveDraft} className="btn-outline flex items-center gap-2"><Save size={13} /> Save Draft</button>
                <button onClick={submit} className="btn-primary flex items-center gap-2"><Send size={13} /> Submit</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Feedback Insights Dashboard + Benchmarks (REQ2 #497, #498) ---
const FeedbackInsightsView = () => {
  const [role, setRole] = useState('Requestor');
  const heat = [
    { name: 'Client Impact', Eng: 4.1, Prod: 4.5, Sales: 3.9 },
    { name: 'Collaboration', Eng: 4.4, Prod: 4.2, Sales: 4.0 },
    { name: 'Technical', Eng: 4.6, Prod: 3.8, Sales: 3.2 },
    { name: 'Communication', Eng: 3.7, Prod: 4.3, Sales: 4.4 },
  ];
  const dist = [
    { rating: '1', count: 2 }, { rating: '2', count: 6 }, { rating: '3', count: 18 }, { rating: '4', count: 34 }, { rating: '5', count: 21 },
  ];
  const benchmarks = [
    { comp: 'Client Impact', you: 65, band: [40, 80] },
    { comp: 'Collaboration', you: 82, band: [45, 85] },
    { comp: 'Technical Execution', you: 71, band: [50, 90] },
    { comp: 'Communication', you: 48, band: [35, 75] },
  ];
  const heatColor = (v: number) => v >= 4.4 ? 'bg-green-500' : v >= 4.0 ? 'bg-green-300' : v >= 3.5 ? 'bg-amber-300' : 'bg-red-300';

  return (
    <div className="space-y-5">
      {/* Role-appropriate dashboard toggle + filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5">
          {['Requestor', 'TL / Lead', 'HR / Admin'].map((r) => (
            <button key={r} onClick={() => setRole(r)} className={cn('px-3 py-1.5 rounded-[4px] border text-[12px] font-medium', role === r ? 'bg-indigo-50 border-primary-action text-primary-action' : 'bg-white border-border text-muted-text hover:bg-gray-50')}>{r}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline flex items-center gap-1.5"><Filter size={13} /> Filters</button>
          <button className="btn-outline flex items-center gap-1.5"><Download size={13} /> Export CSV</button>
          <button className="btn-outline flex items-center gap-1.5"><Download size={13} /> Export XLSX</button>
          <button className="btn-outline flex items-center gap-1.5"><Download size={13} /> Export PDF</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {['Date range', 'Project', 'Role', 'Team', 'Competency', 'Location'].map((f) => (
          <span key={f} className="text-[11px] bg-gray-50 border border-border rounded-full px-2.5 py-1 text-muted-text">{f}: All</span>
        ))}
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: role === 'HR / Admin' ? 'Completion SLA' : 'Completion', value: '78%' },
          { label: 'Avg Rating', value: '4.2' },
          { label: 'Responses', value: '81' },
          { label: 'Overdue', value: '4' },
        ].map((s, i) => (
          <div key={i} className="card"><span className="text-[11px] text-muted-text uppercase tracking-tight">{s.label}</span><div className="text-[20px] font-bold mt-1">{s.value}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Competency heatmap */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-[14px]">Competency Heatmap {role === 'Requestor' ? '(You)' : '(by Team)'}</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead><tr><th className="text-left p-1.5 text-muted-text">Competency</th><th className="p-1.5 text-muted-text">Eng</th><th className="p-1.5 text-muted-text">Prod</th><th className="p-1.5 text-muted-text">Sales</th></tr></thead>
              <tbody>
                {heat.map((h) => (
                  <tr key={h.name}>
                    <td className="p-1.5 font-medium">{h.name}</td>
                    {[h.Eng, h.Prod, h.Sales].map((v, i) => (
                      <td key={i} className="p-1"><div className={cn('rounded text-white text-center py-1 font-bold', heatColor(v))}>{v}</div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ratings distribution */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-[14px]">Distribution of Ratings</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="rating" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '4px' }} />
                <Bar dataKey="count" fill="#464E7E" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Text-theme clustering / keyword frequency (#497) */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[14px]">Feedback Themes</h3>
          <span className="text-[11px] text-muted-text">Keyword frequency from comments (where policy permits)</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FEEDBACK_THEMES.map((t) => (
            <span key={t.word} className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 font-medium" style={{ fontSize: `${11 + t.count * 0.45}px` }}>
              {t.word} <span className="text-muted-text font-normal">{t.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Peer benchmarks / percentile bands (#498) */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[14px]">Peer Benchmark Comparison</h3>
          <span className="text-[11px] text-muted-text">Cohort: PM • G5 • EMEA • N=14</span>
        </div>
        <p className="text-[12px] text-muted-text">You are at the <strong>65th percentile in Client Impact</strong> vs. peers in your cohort.</p>
        <div className="space-y-3">
          {benchmarks.map((b) => (
            <div key={b.comp} className="space-y-1">
              <div className="flex items-center justify-between text-[12px]"><span className="font-medium">{b.comp}</span><span className="text-muted-text">{b.you}th pctile</span></div>
              <div className="relative h-3 bg-gray-100 rounded-full">
                {/* peer band */}
                <div className="absolute h-3 bg-indigo-100 rounded-full" style={{ left: `${b.band[0]}%`, width: `${b.band[1] - b.band[0]}%` }} />
                {/* your marker */}
                <div className="absolute -top-0.5 w-1.5 h-4 bg-primary-action rounded" style={{ left: `${b.you}%` }} title="You" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-text pt-1">
          <span className="flex items-center gap-1"><span className="w-3 h-2 bg-indigo-100 rounded-sm inline-block" /> Peer range (25–75th)</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-3 bg-primary-action rounded-sm inline-block" /> You</span>
        </div>
        {role === 'HR / Admin' && (
          <div className="border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1"><label className="text-[11px] font-bold text-muted-text uppercase">Cohort definition</label><select className="w-full border border-border rounded px-2 py-1.5 text-[12px]"><option>Role + Level + Discipline + Region</option><option>Role + Level</option></select></div>
            <div className="space-y-1"><label className="text-[11px] font-bold text-muted-text uppercase">Min sample size (privacy)</label><input type="number" defaultValue={10} className="w-full border border-border rounded px-2 py-1.5 text-[12px]" /></div>
            <div className="space-y-1"><label className="text-[11px] font-bold text-muted-text uppercase">Smoothing period</label><select className="w-full border border-border rounded px-2 py-1.5 text-[12px]"><option>Rolling 90 days</option><option>Rolling 6 months</option><option>Rolling 12 months</option></select></div>
          </div>
        )}
        <p className="text-[10px] text-muted-text flex items-center gap-1"><Info size={11} /> Data refreshes near real-time (≤5 min) or on an admin-configured schedule. Themes from comments aggregated where policy permits.</p>
      </div>
    </div>
  );
};

const FeedbackView = () => {
  const [activeTab, setActiveTab] = useState('Give Feedback');
  const [feedbackType, setFeedbackType] = useState('Recognition');
  const [visibility, setVisibility] = useState('Visible to Employee');
  const [requestOpen, setRequestOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [acknowledged, setAcknowledged] = useState<Record<number, boolean>>({});

  const receivedFeedback = [
    { id: 1, type: 'Recognition', from: 'Alex Reid', anon: false, score: 4.6, date: '15 Mar 2026', text: 'Sarah showed exceptional leadership during the mobile launch. Her ability to coordinate across engineering and design was outstanding.', icon: '🏆' },
    { id: 2, type: 'Constructive', from: 'Anonymous Peer', anon: true, score: 3.8, date: '10 Mar 2026', text: 'Consider providing more frequent updates on project status to the wider stakeholder group.', icon: '🔧' },
    { id: 3, type: 'General', from: 'Nik Maniya', anon: false, score: 4.4, date: '05 Mar 2026', text: 'Great job on the Q1 planning session. The data you provided was very helpful.', icon: '💬' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border overflow-x-auto">
        {['Give Feedback', 'Request Feedback', 'Received', 'Sent', 'Requests', 'Insights'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-all relative whitespace-nowrap",
              activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTabFeedback" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Request Feedback' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-[14px] font-bold">Your Feedback Requests</h3>
              <p className="text-[12px] text-muted-text">Request structured feedback from TLs, PMs, Leads or peers.</p>
            </div>
            <button onClick={() => setRequestOpen(true)} className="btn-primary flex items-center gap-2"><Send size={14} /> Request Feedback</button>
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  <th className="table-header">Respondent</th>
                  <th className="table-header">Scope</th>
                  <th className="table-header">Competencies</th>
                  <th className="table-header">Due</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody>
                {FEEDBACK_REQUESTS.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="table-cell"><div className="font-medium">{r.respondent}</div><span className="text-[10px] text-muted-text">{r.respondentRole} • {r.anonymity}</span></td>
                    <td className="table-cell text-muted-text">{r.scope}</td>
                    <td className="table-cell"><div className="flex flex-wrap gap-1">{r.competencies.map((c) => <span key={c} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>)}</div></td>
                    <td className="table-cell text-muted-text text-[11px]">{fmtDate(r.dueDate)}</td>
                    <td className="table-cell"><Badge status={r.status} /></td>
                    <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reminder schedule (#494) */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[13px] flex items-center gap-1.5"><Bell size={14} /> Automated Reminder Schedule</h3>
              <label className="text-[11px] flex items-center gap-1.5 text-muted-text"><input type="checkbox" defaultChecked className="accent-[#464E7E]" /> Escalate overdue to requestor's TL</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {REMINDER_SCHEDULE.map((r) => (
                <div key={r.label} className={cn('flex-1 min-w-[120px] border rounded-[4px] p-2.5', r.state === 'sent' ? 'bg-green-50 border-green-200' : r.state === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-border')}>
                  <div className="text-[12px] font-bold">{r.label}</div>
                  <div className="text-[10px] text-muted-text">{r.detail}</div>
                  <div className="text-[10px] mt-1 capitalize text-muted-text">{r.state}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-text flex items-center gap-1"><Info size={11} /> Reminders sent via email + in-app, stop on completion/cancellation. A nudge to request feedback is sent if none given in 3 months.</p>
          </div>
        </div>
      )}

      {activeTab === 'Insights' && <FeedbackInsightsView />}

      {activeTab === 'Give Feedback' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Feedback Requests</h3>
            <div className="card-review flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">AR</div>
                <div>
                  <p className="font-bold text-[13px]">Alex Reid requested feedback from you</p>
                  <p className="text-[11px] text-muted-text">Due by Apr 15, 2026 • Scyne 360° form</p>
                </div>
              </div>
              <button onClick={() => setFormOpen(true)} className="btn-primary py-1">Give Feedback Now →</button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Give Unprompted Feedback</h3>
            <div className="card space-y-6">
              <div className="space-y-2">
                <label className="text-[12px] font-bold">To:</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search employees..." 
                    className="w-full border border-border rounded-[4px] pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold">Feedback Type:</label>
                <div className="flex gap-2">
                  {[
                    { label: 'Recognition', icon: '🏆' },
                    { label: 'Constructive', icon: '🔧' },
                    { label: 'General', icon: '💬' }
                  ].map(t => (
                    <button
                      key={t.label}
                      onClick={() => setFeedbackType(t.label)}
                      className={cn(
                        "flex-1 py-2 rounded-[4px] border text-[12px] font-bold flex items-center justify-center gap-2 transition-all",
                        feedbackType === t.label ? "bg-indigo-50 border-primary-action text-primary-action" : "bg-white border-border text-muted-text hover:bg-gray-50"
                      )}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold">Visibility:</label>
                <div className="flex gap-2">
                  {['Private to Manager', 'Visible to Employee', '360° Shared'].map(v => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={cn(
                        "flex-1 py-1.5 rounded-[4px] border text-[11px] font-bold transition-all",
                        visibility === v ? "bg-indigo-50 border-primary-action text-primary-action" : "bg-white border-border text-muted-text hover:bg-gray-50"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] font-bold">Message:</label>
                  <span className="text-[10px] text-muted-text">0 / 400</span>
                </div>
                <textarea 
                  placeholder="Share your feedback..." 
                  className="w-full border border-border rounded-[4px] p-3 text-[13px] min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary-action"
                  maxLength={400}
                />
              </div>

              <button className="btn-primary w-full py-2.5">Submit Feedback</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Received' && (
        <div className="space-y-4">
          {/* Skills Passport profile timeline — aggregated feedback (#496) */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[13px] flex items-center gap-1.5"><History size={14} /> Profile Timeline</h3>
              <span className="text-[11px] text-muted-text">Aggregated into your Skills Passport with tags &amp; competencies</span>
            </div>
            <div className="relative pl-4 border-l-2 border-border space-y-3">
              {[
                { date: '15 Mar 2026', from: 'Alex Reid', tag: 'Recognition', comps: ['Leadership', 'Client Impact'], score: 4.6 },
                { date: '10 Mar 2026', from: 'Anonymous Peer', tag: 'Constructive', comps: ['Communication'], score: 3.8 },
                { date: '05 Mar 2026', from: 'Nik Maniya', tag: 'General', comps: ['Strategic Alignment'], score: 4.4 },
              ].map((e, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-action border-2 border-white" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted-text">{e.date}</span>
                    <span className="text-[12px] font-medium">{e.from}</span>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{e.tag}</span>
                    {e.comps.map((c) => <span key={c} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{c}</span>)}
                    <span className="text-[10px] text-muted-text">• score {e.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              {['All Types', 'Recognition', 'Constructive', 'General'].map(f => (
                <button key={f} className="px-3 py-1 rounded-full border border-border text-[11px] font-medium hover:bg-gray-50">{f}</button>
              ))}
            </div>
            {/* Export completed feedback (#496) */}
            <div className="flex items-center gap-2">
              <button className="btn-outline py-1 flex items-center gap-2"><Download size={14} /> Export PDF</button>
              <button className="btn-outline py-1 flex items-center gap-2"><Download size={14} /> Export CSV</button>
            </div>
          </div>

          <div className="space-y-3">
            {receivedFeedback.map((f) => {
              const shown = reveal[f.id];
              const isAck = acknowledged[f.id];
              return (
                <div key={f.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px]">{f.icon}</span>
                      <span className="text-[12px] font-bold text-indigo-700">{f.type}</span>
                      <span className="text-muted-text">•</span>
                      {/* Visibility rule: show/hide respondent identity (#496) */}
                      <span className="text-[12px] font-medium">From: {f.anon && !shown ? 'Hidden (anonymous)' : f.from}</span>
                      {f.anon && (
                        <button onClick={() => setReveal((p) => ({ ...p, [f.id]: !p[f.id] }))} className="text-[10px] text-primary-action hover:underline flex items-center gap-0.5">
                          <Eye size={10} /> {shown ? 'Hide' : 'Reveal'}
                        </button>
                      )}
                      {/* show/hide scores per policy */}
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Score: {f.anon ? '••' : f.score}</span>
                    </div>
                    <span className="text-[11px] text-muted-text">{f.date}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed mb-4 italic">"{f.text}"</p>
                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex gap-2">
                      <button className="text-[11px] font-bold text-primary-action hover:underline flex items-center gap-1"><Award size={11} /> Store in Skills Passport</button>
                      <button className="text-[11px] font-bold text-muted-text hover:underline flex items-center gap-1"><Download size={11} /> Export</button>
                    </div>
                    {/* Acknowledge receipt (#496) */}
                    <button onClick={() => setAcknowledged((p) => ({ ...p, [f.id]: true }))} disabled={isAck} className={cn('text-[11px] font-bold flex items-center gap-1', isAck ? 'text-green-600' : 'text-primary-action hover:underline')}>
                      {isAck ? <><Check size={12} /> Acknowledged</> : <><ThumbsUp size={12} /> Acknowledge receipt</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'Requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold">Scheduled Feedback Rounds</h3>
            <button className="btn-primary py-1.5">+ Schedule Feedback Round</button>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Round Name</th>
                  <th className="table-header">Cadence</th>
                  <th className="table-header">Next Due</th>
                  <th className="table-header">Participants</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="table-cell font-medium">Monthly Pulse</td>
                  <td className="table-cell text-muted-text">Monthly</td>
                  <td className="table-cell text-muted-text">15 Apr 2026</td>
                  <td className="table-cell text-muted-text">All team</td>
                  <td className="table-cell"><Badge status="Active" /></td>
                  <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RequestFeedbackModal open={requestOpen} onClose={() => setRequestOpen(false)} />
      <Scyne360FormModal open={formOpen} onClose={() => setFormOpen(false)} requestFrom="Alex Reid" />
    </div>
  );
};
const Dashboard = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  return (
    <div className="space-y-6">
      {/* Cycle Status Bar */}
      <div className="card py-3 px-6">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-muted-text overflow-x-auto gap-4">
          <div className="flex items-center gap-2 text-primary-action whitespace-nowrap">
            <CheckCircle2 size={14} />
            <span>Practice Goals</span>
          </div>
          <div className="h-[1px] flex-1 bg-border min-w-[20px]" />
          <div className="flex items-center gap-2 text-primary-action whitespace-nowrap">
            <CheckCircle2 size={14} />
            <span>Team Alignment</span>
          </div>
          <div className="h-[1px] flex-1 bg-border min-w-[20px]" />
          <div className="flex items-center gap-2 text-amber-600 animate-pulse whitespace-nowrap">
            <Clock size={14} />
            <span>Individual Goals (68%)</span>
          </div>
          <div className="h-[1px] flex-1 bg-border min-w-[20px]" />
          <div className="flex items-center gap-2 opacity-40 whitespace-nowrap">
            <ClipboardList size={14} />
            <span>Reviews</span>
          </div>
          <div className="h-[1px] flex-1 bg-border min-w-[20px]" />
          <div className="flex items-center gap-2 opacity-40 whitespace-nowrap">
            <Trophy size={14} />
            <span>Talent Review</span>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Goals On Track', value: '8/12', trend: '+2', view: 'Practice Goals' },
          { label: 'Reviews Pending', value: '3', trend: '-1', view: 'Reviews' },
          { label: 'Feedback Received', value: '14', trend: '+5', view: 'Feedback' },
        ].map((stat, i) => (
          <button 
            key={i} 
            onClick={() => setActiveView(stat.view)}
            className="card flex flex-col justify-between text-left hover:border-primary-action transition-all group"
          >
            <span className="text-[11px] text-muted-text uppercase tracking-tight group-hover:text-primary-action">{stat.label}</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-[20px] font-bold">{stat.value}</span>
              <span className="text-[10px] text-green-600 font-medium">{stat.trend}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Goals */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[14px]">My Goals</h3>
            <button className="text-primary-action text-[12px] font-medium hover:underline">View All</button>
          </div>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="table-header">Goal Name</th>
                  <th className="table-header">Parent Goal</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {COMPANY_GOALS.slice(0, 3).map((goal) => (
                  <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium text-primary-action cursor-pointer hover:underline">{goal.title}</td>
                    <td className="table-cell text-muted-text">{goal.pillar}</td>
                    <td className="table-cell w-32">
                      <div className="flex items-center gap-2">
                        <ProgressBar progress={goal.progress} />
                        <span className="text-[11px] font-medium">{goal.progress}%</span>
                      </div>
                    </td>
                    <td className="table-cell"><Badge status={goal.status} /></td>
                    <td className="table-cell text-muted-text">{goal.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[14px]">Team Performance Overview</h3>
            <button onClick={() => setActiveView('Team Goals')} className="text-primary-action text-[12px] font-medium hover:underline">View Team</button>
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Employee</th>
                  <th className="table-header">Review Status</th>
                  <th className="table-header">Last Rating</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Sarah Chen', status: 'Submitted', rating: '4.2', completed: true },
                  { name: 'Alex Reid', status: 'In Progress', rating: '4.5', completed: false },
                ].map((emp) => (
                  <tr key={emp.name} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell font-medium">{emp.name}</td>
                    <td className="table-cell"><Badge status={emp.status} /></td>
                    <td className="table-cell font-bold">{emp.rating}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveView('ManagerReview')}
                          className="text-primary-action font-medium hover:underline"
                        >
                          Review
                        </button>
                        {emp.completed && (
                          <button 
                            onClick={() => setActiveView('ReviewResults')}
                            className="text-muted-text hover:text-primary-action text-[12px] flex items-center gap-1"
                          >
                            <ArrowUpRight size={12} />
                            Results
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Deadlines & Feedback */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-[14px]">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {[
                { label: 'Submit Self-Review', days: 14, icon: <ClipboardList size={14} />, action: () => setActiveView('SelfAssessment') },
                { label: 'Q1 Goal Alignment', days: 3, icon: <Target size={14} />, urgent: true, action: () => setActiveView('Practice Goals') },
                { label: 'Quarterly Goal Review', days: 22, icon: <Users size={14} />, action: () => setActiveView('Team Goals') },
              ].map((item, i) => (
                <button 
                  key={i} 
                  onClick={item.action}
                  className="card flex items-center justify-between py-2 px-3 w-full hover:bg-gray-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded bg-gray-100 text-muted-text", item.urgent && "bg-red-50 text-red-600")}>
                      {item.icon}
                    </div>
                    <span className="font-medium text-[12.5px]">{item.label}</span>
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded bg-gray-100", item.urgent && "bg-red-100 text-red-700")}>
                    {item.days}d
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-[14px]">Recent Feedback</h3>
            <div className="space-y-3">
              {FEEDBACK.map((f) => (
                <div key={f.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                    {f.from.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[12.5px]">{f.from}</span>
                      <span className="text-[10px] text-muted-text">{f.date}</span>
                    </div>
                    <p className="text-[12px] text-muted-text truncate italic">"{f.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyGoalsView = ({ setActiveView, onOpenGoal }: { setActiveView: (view: string) => void; onOpenGoal: (id: string) => void }) => {
  const [activeTab, setActiveTab] = useState('Practice Goals');

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['Practice Goals', 'Scyne Values', 'OKR Tree View'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-all relative",
              activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
            <input
              type="text"
              placeholder="Search goals..."
              className="pl-9 pr-4 py-1.5 border border-border rounded-[4px] text-[13px] w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary-action"
            />
          </div>
          <button className="btn-outline flex items-center gap-2">
            <Filter size={14} />
            Filters
          </button>
        </div>
        <button className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={14} />
          Create Practice Goal
        </button>
      </div>

      {/* Practice Goals — table */}
      {activeTab === 'Practice Goals' && (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="table-header w-12 text-center">#</th>
                <th className="table-header">Practice Goal</th>
                <th className="table-header">Scyne Values</th>
                <th className="table-header">Owner</th>
                <th className="table-header">Teams Aligned</th>
                <th className="table-header">Progress</th>
                <th className="table-header">Status</th>
                <th className="table-header w-12"></th>
              </tr>
            </thead>
            <tbody>
              {COMPANY_GOALS.map((goal, i) => (
                <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-center text-muted-text">{i + 1}</td>
                  <td
                    className="table-cell font-medium text-primary-action cursor-pointer hover:underline"
                    onClick={() => onOpenGoal(goal.id)}
                  >
                    {goal.title}
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(goal.scyneValues || []).map((v) => (
                        <span key={v} className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-medium">{v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell text-muted-text">{goal.owner}</td>
                  <td className="table-cell font-medium">{goal.teamsAligned} teams</td>
                  <td className="table-cell w-40">
                    <div className="flex items-center gap-2">
                      <ProgressBar progress={goal.progress} />
                      <span className="text-[11px] font-medium">{goal.progress}%</span>
                    </div>
                  </td>
                  <td className="table-cell"><Badge status={goal.status} /></td>
                  <td className="table-cell text-right">
                    <button className="text-muted-text hover:text-primary-text">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Scyne Values — goals grouped by value */}
      {activeTab === 'Scyne Values' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {SCYNE_VALUES.map(({ name: value, blurb }) => {
            const goals = COMPANY_GOALS.filter((g) => (g.scyneValues || []).includes(value));
            const avg = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
            const teams = goals.reduce((s, g) => s + (g.teamsAligned || 0), 0);
            return (
              <div key={value} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={15} className="text-teal-600" />
                    <h3 className="font-bold text-[14px]">{value}</h3>
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">{goals.length} goal{goals.length === 1 ? '' : 's'}</span>
                  </div>
                  <span className="text-[11px] text-muted-text">{teams} teams</span>
                </div>
                <p className="text-[11px] text-muted-text italic">{blurb}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-text w-20">Avg progress</span>
                  <ProgressBar progress={avg} />
                  <span className="text-[11px] font-bold">{avg}%</span>
                </div>
                <div className="space-y-2 pt-1">
                  {goals.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 p-2 rounded-[4px] border border-border hover:bg-gray-50 cursor-pointer" onClick={() => onOpenGoal(g.id)}>
                      <div className="flex-1">
                        <div className="text-[12.5px] font-medium text-primary-action">{g.title}</div>
                        <div className="text-[10px] text-muted-text">{g.owner}</div>
                      </div>
                      <div className="w-24"><ProgressBar progress={g.progress} /></div>
                      <span className="text-[11px] font-medium w-9 text-right">{g.progress}%</span>
                      <Badge status={g.status} />
                    </div>
                  ))}
                  {goals.length === 0 && <p className="text-[11px] text-muted-text italic">No practice goals mapped to this value yet.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OKR Tree View — how individual goals align with Practice Goals and Scyne Values */}
      {activeTab === 'OKR Tree View' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-[4px] p-3 flex items-start gap-2 text-indigo-900">
            <Info size={15} className="flex-shrink-0 mt-0.5" />
            <span className="text-[12px]">Shows how individual goals align to <span className="font-semibold">Practice Goals</span> (objectives) and the <span className="font-semibold">Scyne Values</span> they advance.</span>
          </div>
          {COMPANY_GOALS.map((goal) => {
            const krs: Record<string, string[]> = {
              cg1: ['New Logo ARR → $15M', 'Expansion ARR → $10M', 'Net churn < 5%'],
              cg2: ['CSAT > 90%', 'First-response < 2h', 'Detractor follow-up 100%'],
              cg3: ['iOS + Android GA', 'Crash-free sessions > 99.5%', '50k installs in 90d'],
              cg4: ['eNPS > 40', 'Regretted attrition < 5%', 'Manager 1:1 coverage 100%'],
            };
            const aligned = MY_GOALS.filter((g) => g.parentGoalId === goal.id || (g.parentGoalIds || []).includes(goal.id));
            return (
              <div key={goal.id} className="card space-y-3">
                {/* Objective — Practice Goal */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">Practice Goal</span>
                  <button onClick={() => onOpenGoal(goal.id)} className="font-bold text-[14px] text-primary-action hover:underline">{goal.title}</button>
                  {(goal.scyneValues || []).map((v) => (
                    <span key={v} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Tag size={9} />{v}</span>
                  ))}
                  <div className="flex-1" />
                  <div className="w-28"><ProgressBar progress={goal.progress} /></div>
                  <span className="text-[11px] font-bold">{goal.progress}%</span>
                </div>

                {/* Key Results */}
                <div className="ml-4 pl-4 border-l-2 border-border space-y-2">
                  {(krs[goal.id] || []).map((kr, i) => (
                    <div key={i} className="relative flex items-center gap-2">
                      <span className="absolute -left-[21px] w-2 h-2 rounded-full bg-indigo-300" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">KR</span>
                      <span className="text-[12.5px]">{kr}</span>
                    </div>
                  ))}

                  {/* Aligned individual goals */}
                  {aligned.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-text">Aligned individual goals</span>
                      {aligned.map((g) => (
                        <div key={g.id} className="relative flex items-center gap-2 flex-wrap">
                          <span className="absolute -left-[21px] w-2 h-2 rounded-full bg-teal-300" />
                          <Target size={11} className="text-teal-600" />
                          <span className="text-[12px] flex-1 min-w-[140px]">{g.title} <span className="text-muted-text">— {g.owner}</span></span>
                          {(g.scyneValues || []).map((v) => (
                            <span key={v} className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">{v}</span>
                          ))}
                          <div className="w-20"><ProgressBar progress={g.progress} /></div>
                          <Badge status={g.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ReviewsView = ({ setActiveView, roleMode, onCycleClick }: { setActiveView: (view: string) => void, roleMode: 'Direct' | 'Skip-Level', onCycleClick: (name: string) => void }) => {
  const activeCycles = [
    { name: 'FY 2025–26 Year-End', status: 'In Progress', deadline: 'Mar 31, 2026', type: 'Annual' },
  ];

  const upcomingCycles = [
    { name: 'Q1 2026 Check-in', status: 'Scheduled', deadline: 'Jun 30, 2026', type: 'Quarterly' },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-muted-text uppercase tracking-wider">Active Cycles</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Cycle Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Deadline</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeCycles.map((cycle) => (
                <tr key={cycle.name}>
                  <td className="table-cell font-medium">
                    <button 
                      onClick={() => onCycleClick(cycle.name)} 
                      className="text-primary-action hover:underline"
                    >
                      {cycle.name}
                    </button>
                  </td>
                  <td className="table-cell text-muted-text">{cycle.type}</td>
                  <td className="table-cell text-muted-text">{cycle.deadline}</td>
                  <td className="table-cell">
                    <Badge status={cycle.status} />
                  </td>
                  <td className="table-cell">
                    <button 
                      onClick={() => setActiveView('SelfAssessment')}
                      className="text-primary-action font-medium hover:underline flex items-center gap-1"
                    >
                      Continue Self-Assessment <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-muted-text uppercase tracking-wider">My Team's Reviews</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Employee</th>
                <th className="table-header">Role</th>
                <th className="table-header">Self-Assessment</th>
                <th className="table-header">Your Review</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Sarah Chen', role: 'Senior Product Manager', selfStatus: 'Submitted', managerStatus: 'Not Started' },
                { name: 'Alex Reid', role: 'Engineering Lead', selfStatus: 'In Progress', managerStatus: 'Not Started' },
              ].map((emp) => (
                <tr key={emp.name}>
                  <td className="table-cell font-medium">{emp.name}</td>
                  <td className="table-cell text-muted-text">{emp.role}</td>
                  <td className="table-cell">
                    <Badge status={emp.selfStatus} />
                  </td>
                  <td className="table-cell">
                    <Badge status={emp.managerStatus} />
                  </td>
                  <td className="table-cell">
                    <button 
                      onClick={() => setActiveView('ManagerReview')}
                      className="text-primary-action font-medium hover:underline flex items-center gap-1"
                    >
                      Review <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-muted-text uppercase tracking-wider">Upcoming Cycles</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Cycle Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Expected Start</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingCycles.map((cycle) => (
                <tr key={cycle.name}>
                  <td className="table-cell font-medium text-muted-text">{cycle.name}</td>
                  <td className="table-cell text-muted-text">{cycle.type}</td>
                  <td className="table-cell text-muted-text">{cycle.deadline}</td>
                  <td className="table-cell">
                    <Badge status={cycle.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[14px] font-bold text-muted-text uppercase tracking-wider">Closed Cycles</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Cycle Name</th>
                <th className="table-header">Type</th>
                <th className="table-header">Completed On</th>
                <th className="table-header">Final Rating</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'FY 2024–25 Year-End', type: 'Annual', completed: 'Mar 31, 2025', rating: '4.1' },
              ].map((cycle) => (
                <tr key={cycle.name}>
                  <td className="table-cell font-medium text-muted-text">{cycle.name}</td>
                  <td className="table-cell text-muted-text">{cycle.type}</td>
                  <td className="table-cell text-muted-text">{cycle.completed}</td>
                  <td className="table-cell font-bold">{cycle.rating}</td>
                  <td className="table-cell">
                    <button 
                      onClick={() => setActiveView('ReviewResults')}
                      className="text-primary-action font-medium hover:underline flex items-center gap-1"
                    >
                      View Results <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SelfAssessmentView = ({ onBack }: { onBack: () => void }) => {
  const [currentSection, setCurrentSection] = useState(1);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  const goals = [
    { id: '1', title: 'Grow ARR to $50M by EOY', description: 'Scale Annual Recurring Revenue through expansion and new logos.', weight: 25 },
    { id: '2', title: 'Launch Enterprise Tier', description: 'Complete beta and launch the new enterprise subscription tier.', weight: 25 },
    { id: '3', title: 'Improve NPS to 60+', description: 'Enhance customer satisfaction through product improvements.', weight: 25 },
    { id: '4', title: 'Reduce Churn to < 5%', description: 'Implement proactive customer success strategies.', weight: 25 },
  ];

  const competencies = [
    { id: 'c1', title: 'Strategic Thinking', description: 'Ability to see the big picture and plan for the future.' },
    { id: 'c2', title: 'Collaboration', description: 'Working effectively with cross-functional teams.' },
    { id: 'c3', title: 'Execution', description: 'Consistently delivering high-quality results on time.' },
  ];

  const sections = [
    { id: 1, name: 'Goal Achievement' },
    { id: 2, name: 'Competencies' },
    { id: 3, name: 'Summary' },
  ];

  const isSectionComplete = (sectionId: number) => {
    if (sectionId === 1) return goals.every(g => ratings[g.id]);
    if (sectionId === 2) return competencies.every(c => ratings[c.id]);
    if (sectionId === 3) return !!comments['overall_summary'];
    return false;
  };

  const canSubmit = sections.every(s => isSectionComplete(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-text text-[12px]">
          <button onClick={onBack} className="hover:text-primary-text">Reviews</button>
          <ChevronRight size={12} />
          <button className="hover:text-primary-text">FY 2025–26 Year-End</button>
          <ChevronRight size={12} />
          <span className="text-primary-text font-medium">Self-Assessment</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline flex items-center gap-2">
            <Save size={14} />
            Save Draft
          </button>
          <button className="btn-primary flex items-center gap-2" disabled={!canSubmit}>
            <Send size={14} />
            Submit
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between relative px-12">
          <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-gray-200 -translate-y-1/2 -z-10" />
          {sections.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-white px-4">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                currentSection === s.id ? "border-2 border-primary-action text-primary-action" :
                currentSection > s.id ? "bg-primary-action text-white" : "border-2 border-gray-300 text-gray-400"
              )}>
                {currentSection > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span className={cn(
                "text-[12px] font-medium",
                currentSection === s.id ? "text-primary-action" : "text-muted-text"
              )}>{s.name}</span>
            </div>
          ))}
        </div>
        <div className="text-center text-[13px] text-muted-text">
          Section {currentSection} of 3 — {sections.find(s => s.id === currentSection)?.name}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {currentSection === 1 && (
            <motion.div
              key="section1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card-review space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-[16px] font-bold">{goals[currentGoalIndex].title}</h3>
                    <p className="text-[13px] text-muted-text">{goals[currentGoalIndex].description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">Weight: {goals[currentGoalIndex].weight}%</span>
                    </div>
                  </div>
                  <div className="text-[12px] font-medium text-muted-text">
                    Goal {currentGoalIndex + 1} of {goals.length}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[13px] font-bold block">Self-Rating</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Not Met', 'Partial', 'Met', 'Exceeded'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatings({ ...ratings, [goals[currentGoalIndex].id]: r })}
                        className={cn(
                          "py-2 text-[12px] font-medium border rounded-[2px] transition-all",
                          ratings[goals[currentGoalIndex].id] === r
                            ? "bg-primary-action text-white border-primary-action"
                            : "bg-white text-muted-text border-border hover:bg-gray-50"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold block">Self-Commentary</label>
                  <textarea
                    value={comments[goals[currentGoalIndex].id] || ''}
                    onChange={(e) => setComments({ ...comments, [goals[currentGoalIndex].id]: e.target.value })}
                    placeholder="Describe your achievements, challenges, and impact..."
                    className="w-full border border-border rounded-[2px] p-3 text-[13px] min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary-action"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button
                    disabled={currentGoalIndex === 0}
                    onClick={() => setCurrentGoalIndex(currentGoalIndex - 1)}
                    className="btn-outline flex items-center gap-2 disabled:opacity-30"
                  >
                    <ArrowLeft size={14} />
                    Previous Goal
                  </button>
                  <button
                    onClick={() => {
                      if (currentGoalIndex < goals.length - 1) {
                        setCurrentGoalIndex(currentGoalIndex + 1);
                      } else {
                        setCurrentSection(2);
                      }
                    }}
                    className="btn-primary flex items-center gap-2"
                  >
                    {currentGoalIndex < goals.length - 1 ? 'Next Goal' : 'Continue to Competencies'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentSection === 2 && (
            <motion.div
              key="section2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {competencies.map((comp) => (
                <div key={comp.id} className="card-review space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[15px] font-bold">{comp.title}</h3>
                    <p className="text-[12px] text-muted-text">{comp.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setRatings({ ...ratings, [comp.id]: num.toString() })}
                        className={cn(
                          "py-2 text-[12px] font-bold border rounded-[2px] transition-all",
                          ratings[comp.id] === num.toString()
                            ? "bg-primary-action text-white border-primary-action"
                            : "bg-white text-muted-text border-border hover:bg-gray-50"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-text uppercase font-bold px-1">
                    <span>Developing</span>
                    <span>Expert</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentSection(1)}
                  className="btn-outline flex items-center gap-2"
                >
                  <ArrowLeft size={14} />
                  Back to Goals
                </button>
                <button
                  onClick={() => setCurrentSection(3)}
                  className="btn-primary flex items-center gap-2"
                >
                  Continue to Summary
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {currentSection === 3 && (
            <motion.div
              key="section3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="card-review space-y-4">
                <h3 className="text-[15px] font-bold">Overall Summary</h3>
                <p className="text-[12px] text-muted-text">Reflect on your overall performance this period. What are you most proud of? Where do you want to grow next?</p>
                <textarea
                  value={comments['overall_summary'] || ''}
                  onChange={(e) => setComments({ ...comments, 'overall_summary': e.target.value })}
                  placeholder="Your overall reflection..."
                  className="w-full border border-border rounded-[2px] p-3 text-[13px] min-h-[200px] focus:outline-none focus:ring-1 focus:ring-primary-action"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setCurrentSection(2)}
                  className="btn-outline flex items-center gap-2"
                >
                  <ArrowLeft size={14} />
                  Back to Competencies
                </button>
                <button
                  disabled={!canSubmit}
                  className="btn-primary flex items-center gap-2"
                >
                  Submit Final Assessment
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ManagerReviewView = ({ 
  onBack,
  openChatbot
}: { 
  onBack: () => void,
  openChatbot: (trigger: string) => void
}) => {
  const [activeTab, setActiveTab] = useState('Evaluation');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-text text-[12px]">
          <button onClick={onBack} className="hover:text-primary-text">Reviews</button>
          <ChevronRight size={12} />
          <span className="text-primary-text font-medium">Reviewing: Sarah Chen</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline">Save Draft</button>
          <button className="btn-primary">Submit Review</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Pane: Employee Context */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Employee Context</h3>
            
            <div className="card space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">SC</div>
                <div>
                  <h4 className="font-bold text-[14px]">Sarah Chen</h4>
                  <p className="text-[12px] text-muted-text">Senior Product Manager • 2.5 Years</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-text uppercase font-bold">Last Rating</span>
                  <div className="text-[14px] font-bold">4.2 (Strong)</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-text uppercase font-bold">Goal Progress</span>
                  <div className="text-[14px] font-bold">92% Complete</div>
                </div>
              </div>
            </div>

            <div className="card-review space-y-4">
              <h4 className="text-[13px] font-bold flex items-center gap-2">
                <History size={14} className="text-primary-action" />
                Recent Feedback
              </h4>
              <div className="space-y-3">
                {[
                  { from: 'Alex Reid', text: 'Sarah did an amazing job leading the Q3 planning session.', date: '2 weeks ago' },
                  { from: 'Direct Report', text: 'Great mentor, always provides clear direction.', date: '1 month ago' },
                ].map((f, i) => (
                  <div key={i} className="text-[12px] border-b border-border last:border-0 pb-2 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{f.from}</span>
                      <span className="text-muted-text">{f.date}</span>
                    </div>
                    <p className="italic text-muted-text">"{f.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated goals shown during review (#502 Performance Alignment) */}
            <div className="card space-y-3">
              <h4 className="text-[13px] font-bold flex items-center gap-2"><Target size={14} className="text-primary-action" /> Associated Goals</h4>
              <p className="text-[11px] text-muted-text">Linked to this review to ground the discussion.</p>
              <div className="space-y-2">
                {MY_GOALS.slice(0, 3).map((g) => (
                  <div key={g.id} className="border border-border rounded-[4px] p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[12px]">{g.title}</span>
                      <Badge status={g.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <ProgressBar progress={g.progress} />
                      <span className="text-[11px] font-medium">{g.progress}%</span>
                    </div>
                    {g.metrics && g.metrics[0] && <p className="text-[10px] text-muted-text">{g.metrics[0].name}: {g.metrics[0].current}/{g.metrics[0].target}{g.metrics[0].unit}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Manager Evaluation */}
        <div className="bg-white border border-border rounded-[2px] flex flex-col overflow-hidden">
          <div className="flex items-center border-b border-border">
            {['Evaluation', 'Self-Assessment', 'Growth Plan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-3 text-[12px] font-bold uppercase tracking-wider transition-all relative",
                  activeTab === tab ? "text-primary-action bg-indigo-50/30" : "text-muted-text hover:bg-gray-50"
                )}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeTab === 'Evaluation' && (
              <div className="space-y-8">
                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold border-b border-border pb-2">Goal Evaluation</h4>
                  {[
                    { title: 'Grow ARR to $50M by EOY', weight: 25 },
                    { title: 'Launch Enterprise Tier', weight: 25 },
                  ].map((goal, i) => (
                    <div key={i} className="space-y-3">
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="text-[13px] font-bold">{goal.title}</h5>
                        <button 
                          onClick={() => openChatbot('MANAGER_EVALUATION')}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {['Not Met', 'Partial', 'Met', 'Exceeded'].map(r => (
                          <button key={r} className="py-1.5 text-[10px] font-bold border border-border rounded-[2px] hover:border-primary-action hover:text-primary-action transition-all">
                            {r}
                          </button>
                        ))}
                      </div>
                      <textarea 
                        data-field={`goal-${i}`}
                        placeholder="Manager commentary..." 
                        className="w-full border border-border rounded-[2px] p-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action" 
                        rows={2} 
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h4 className="text-[14px] font-bold border-b border-border pb-2">Competency Ratings</h4>
                  {['Strategic Thinking', 'Collaboration', 'Execution'].map((comp) => (
                    <div key={comp} className="space-y-3">
                      <h5 className="text-[13px] font-bold">{comp}</h5>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} className="w-8 h-8 flex items-center justify-center text-[12px] font-bold border border-border rounded-[2px] hover:bg-indigo-50 hover:border-primary-action transition-all">
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[14px] font-bold uppercase tracking-wider text-muted-text">Overall Feedback</h4>
                    <button 
                      onClick={() => openChatbot('MANAGER_EVALUATION')}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded hover:bg-indigo-100 transition-all"
                    >
                      <Sparkles size={12} />
                      AI Writing Assistant
                    </button>
                  </div>
                  <textarea 
                    data-field="overall-feedback"
                    rows={6}
                    placeholder="Provide a comprehensive summary of performance, key strengths, and areas for development..."
                    className="w-full border border-border rounded-[4px] p-4 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action leading-relaxed"
                  />
                </div>
              </div>
            )}

            {activeTab === 'Self-Assessment' && (
              <div className="space-y-6">
                <div className="bg-indigo-50 p-4 rounded-[2px] border border-indigo-100">
                  <div className="flex items-center gap-2 text-indigo-700 mb-2">
                    <Info size={14} />
                    <span className="text-[12px] font-bold">Sarah's Final Summary</span>
                  </div>
                  <p className="text-[12px] leading-relaxed text-indigo-900 italic">
                    "This year has been transformative. I'm proud of how the team rallied around the Enterprise launch. 
                    Moving forward, I want to focus more on long-term product strategy and mentoring junior PMs."
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-[13px] font-bold uppercase tracking-wider text-muted-text">Goal Self-Ratings</h4>
                  {['Grow ARR to $50M', 'Launch Enterprise Tier'].map(g => (
                    <div key={g} className="card p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-[12px]">{g}</span>
                        <Badge status="Exceeded" />
                      </div>
                      <p className="text-[11px] text-muted-text italic">"Exceeded targets by 15% through strategic partnerships."</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewResultsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-text text-[12px]">
          <button onClick={onBack} className="hover:text-primary-text">Reviews</button>
          <ChevronRight size={12} />
          <span className="text-primary-text font-medium">Results: FY 2025–26 Year-End</span>
        </div>
        <button className="btn-outline flex items-center gap-2">
          <ExternalLink size={14} />
          Download PDF
        </button>
      </div>

      <div className="card bg-indigo-600 text-white border-0 p-8 flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-[24px] font-bold">Final Rating: 4.2 / 5.0</h2>
          <p className="text-indigo-100 text-[14px]">Performance Band: <span className="font-bold">Strong Performer</span></p>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-indigo-200 uppercase font-bold tracking-widest">Review Cycle</div>
          <div className="text-[18px] font-bold">FY 2025–26 Year-End</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-review space-y-4">
          <h3 className="font-bold text-[14px] flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-action" />
            Goal Score
          </h3>
          <div className="text-[32px] font-bold">4.5</div>
          <ProgressBar progress={90} />
          <p className="text-[11px] text-muted-text">Based on 4 primary objectives</p>
        </div>
        <div className="card-review space-y-4">
          <h3 className="font-bold text-[14px] flex items-center gap-2">
            <Star size={16} className="text-primary-action" />
            Competency Score
          </h3>
          <div className="text-[32px] font-bold">3.9</div>
          <ProgressBar progress={78} />
          <p className="text-[11px] text-muted-text">Based on 6 core competencies</p>
        </div>
        <div className="card-review space-y-4">
          <h3 className="font-bold text-[14px] flex items-center gap-2">
            <MessageSquare size={16} className="text-primary-action" />
            Feedback Count
          </h3>
          <div className="text-[32px] font-bold">12</div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
            ))}
          </div>
          <p className="text-[11px] text-muted-text">Peer and direct report reviews</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[16px] font-bold">Detailed Breakdown</h3>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Objective / Competency</th>
                <th className="table-header">Weight</th>
                <th className="table-header">Self</th>
                <th className="table-header">Manager</th>
                <th className="table-header">Final</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Grow ARR to $50M', weight: '25%', self: 'Exceeded', manager: 'Exceeded', final: '4.8' },
                { name: 'Strategic Thinking', weight: '15%', self: '4.0', manager: '4.0', final: '4.0' },
                { name: 'Collaboration', weight: '15%', self: '5.0', manager: '4.0', final: '4.5' },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="table-cell font-medium">{row.name}</td>
                  <td className="table-cell text-muted-text">{row.weight}</td>
                  <td className="table-cell">{row.self}</td>
                  <td className="table-cell">{row.manager}</td>
                  <td className="table-cell font-bold text-primary-action">{row.final}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-bold text-[14px]">Manager Summary</h3>
        <p className="text-[13px] text-muted-text leading-relaxed">
          Sarah has had an exceptional year. Her leadership during the Enterprise launch was a highlight, 
          demonstrating both strategic foresight and tactical execution. She has successfully scaled her 
          impact by mentoring junior team members and improving cross-functional collaboration between 
          Product and Engineering. For the next period, we will focus on expanding her influence to 
          department-wide strategic initiatives.
        </p>
      </div>
    </div>
  );
};

const labelToScore: Record<string, number> = {
  'Exceptional': 5, 'Strong': 4, 'Meets': 3, 
  'Needs Improvement': 2, 'Unsatisfactory': 1
};

// --- Skills Passport entity manager with full CRUD (REQ1 #487) ---
const SkillsPassportManager = () => {
  const [catalog, setCatalog] = useState<Record<string, string[]>>({
    Skills: [...SKILLS_PASSPORT.Skills],
    Education: [...SKILLS_PASSPORT.Education],
    'Roles & Experience': [...SKILLS_PASSPORT['Roles & Experience']],
  });
  const [linked, setLinked] = useState<string[]>([]);
  const [addCat, setAddCat] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const toggleLink = (v: string) => setLinked((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const create = (cat: string) => {
    const v = draft.trim(); if (!v) return;
    setCatalog((c) => ({ ...c, [cat]: [...c[cat], v] }));
    setLinked((p) => [...p, v]); setDraft(''); setAddCat(null);
  };
  const remove = (cat: string, item: string) => {
    setCatalog((c) => ({ ...c, [cat]: c[cat].filter((x) => x !== item) }));
    setLinked((p) => p.filter((x) => x !== item));
  };
  const saveEdit = (cat: string, item: string) => {
    const v = editVal.trim(); if (!v) { setEditKey(null); return; }
    setCatalog((c) => ({ ...c, [cat]: c[cat].map((x) => (x === item ? v : x)) }));
    setLinked((p) => p.map((x) => (x === item ? v : x))); setEditKey(null);
  };

  return (
    <div className="space-y-3">
      {(Object.entries(catalog) as [string, string[]][]).map(([cat, items]) => (
        <div key={cat} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-text">{cat}</span>
            <button type="button" onClick={() => { setAddCat(addCat === cat ? null : cat); setDraft(''); }} className="text-[10px] text-primary-action hover:underline flex items-center gap-0.5"><Plus size={10} /> New</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const key = `${cat}::${item}`;
              const isLinked = linked.includes(item);
              if (editKey === key) {
                return (
                  <span key={key} className="inline-flex items-center gap-1 border border-primary-action rounded-full pl-2 pr-1 py-0.5">
                    <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(cat, item)} className="text-[11px] w-24 outline-none bg-transparent" />
                    <button type="button" onClick={() => saveEdit(cat, item)} className="text-green-600"><Check size={11} /></button>
                  </span>
                );
              }
              return (
                <span key={key} className={cn('inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1.5 py-0.5 text-[11px]', isLinked ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-border text-muted-text')}>
                  <button type="button" onClick={() => toggleLink(item)} className="flex items-center gap-1">{isLinked && <Check size={10} />}{item}</button>
                  <button type="button" onClick={() => { setEditKey(key); setEditVal(item); }} className="text-muted-text/60 hover:text-primary-action"><Pencil size={10} /></button>
                  <button type="button" onClick={() => remove(cat, item)} className="text-muted-text/60 hover:text-red-600"><Trash2 size={10} /></button>
                </span>
              );
            })}
          </div>
          {addCat === cat && (
            <div className="flex items-center gap-1.5 mt-1">
              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create(cat)} placeholder={`Add ${cat.toLowerCase()}…`} className="flex-1 border border-border rounded-[4px] px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
              <button type="button" onClick={() => create(cat)} className="btn-primary py-1 px-2 text-[11px]">Add</button>
            </div>
          )}
        </div>
      ))}
      <p className="text-[10px] text-muted-text">Create, rename, link or delete Skills Passport entities directly here — {linked.length} linked to this goal.</p>
    </div>
  );
};

// --- Goal Creation Drawer (REQ1 #482, #485, #486, #484, #487, #490) ---
const GoalCreationDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [types, setTypes] = useState<string[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [practiceGoals, setPracticeGoals] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<{ description: string; targetDate: string }[]>([]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    setter((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-[16px]">Create New Goal</h3>
              <button onClick={onClose} className="text-muted-text hover:text-primary-text"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Basics */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium">Goal Title</label>
                  <input type="text" placeholder="e.g. Launch new API documentation" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium">Description</label>
                  <textarea rows={3} placeholder="A clear and concise description of the goal" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium">Target Completion Date</label>
                  <input type="date" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                </div>
              </div>

              {/* Goal Types (#485) */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-1.5"><Layers size={13} /> Goal Type <span className="text-muted-text font-normal">(select one or more)</span></label>
                <ChipMultiSelect options={[...GOAL_TYPES]} selected={types} onToggle={toggle(setTypes)} />
              </div>

              {/* Goal Alignment — Practice Goals and/or Scyne Values (neither is mandatory) */}
              <div className="space-y-3">
                <div>
                  <label className="text-[12px] font-bold flex items-center gap-1.5"><Link2 size={13} /> Goal Alignment</label>
                  <p className="text-[11px] text-muted-text mt-0.5">Align this goal to one or more Practice Goals and/or Scyne Values. Linking to both is not required.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium flex items-center gap-1.5"><Building2 size={12} /> Practice Goals <span className="text-muted-text font-normal">(optional)</span></label>
                  <ChipMultiSelect options={COMPANY_GOALS.map((g) => g.title)} selected={practiceGoals} onToggle={toggle(setPracticeGoals)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium flex items-center gap-1.5"><Tag size={12} /> Scyne Values <span className="text-muted-text font-normal">(optional)</span></label>
                  <ChipMultiSelect options={SCYNE_VALUES.map((v) => v.name)} selected={values} onToggle={toggle(setValues)} />
                </div>
              </div>

              {/* Milestones — break the goal down */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold flex items-center gap-1.5"><Flag size={13} /> Milestones <span className="text-muted-text font-normal">(optional)</span></label>
                <p className="text-[11px] text-muted-text">Break your goal into milestones to track progress.</p>
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={m.description} onChange={(e) => setMilestones((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="Milestone description" className="flex-1 border border-border rounded-[4px] px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    <input type="date" value={m.targetDate} onChange={(e) => setMilestones((p) => p.map((x, j) => j === i ? { ...x, targetDate: e.target.value } : x))} className="border border-border rounded-[4px] px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    <button onClick={() => setMilestones((p) => p.filter((_, j) => j !== i))} className="text-muted-text hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setMilestones((p) => [...p, { description: '', targetDate: '' }])} className="text-[11px] font-medium text-primary-action hover:underline flex items-center gap-1"><Plus size={12} /> Add milestone</button>
              </div>

              {/* Skills passport — only when editing/completing, not at creation */}
              <div className="bg-gray-50 border border-border rounded-[4px] p-3 flex items-start gap-2 text-muted-text">
                <Award size={14} className="flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">You'll be able to link this goal to a Skills Passport skill when you edit or complete it.</span>
              </div>
            </div>

            <div className="p-5 border-t border-border">
              <div className="bg-indigo-50 border border-indigo-100 rounded-[4px] p-2.5 mb-3 flex items-start gap-2 text-indigo-900">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                <span className="text-[11px]">Submitting sends this goal to your people leader for approval.</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="btn-primary flex-1">Submit for Approval</button>
                <button onClick={onClose} className="btn-outline flex-1">Save as Draft</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- D365 Import Modal (REQ1 #481) ---
const D365ImportModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<string[]>(D365_IMPORT_GOALS.map((g) => g.id));
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[560px] bg-white rounded-[8px] shadow-xl z-50 flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2"><Upload size={16} className="text-primary-action" /><h3 className="font-bold text-[15px]">Import Goals from Dynamics 365</h3></div>
              <button onClick={onClose} className="text-muted-text hover:text-primary-text"><X size={18} /></button>
            </div>
            <div className="p-5 overflow-y-auto space-y-2">
              <p className="text-[12px] text-muted-text mb-3">We found {D365_IMPORT_GOALS.length} historical goals in D365. Select which to bring into Scyne — progress and status are preserved.</p>
              {D365_IMPORT_GOALS.map((g) => (
                <label key={g.id} className="flex items-center gap-3 p-2.5 border border-border rounded-[4px] hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggle(g.id)} className="accent-[#464E7E]" />
                  <div className="flex-1">
                    <div className="font-medium text-[13px]">{g.title}</div>
                    <div className="text-[11px] text-muted-text">{g.period} • {g.progress}% complete</div>
                  </div>
                  <Badge status={g.status as Status} />
                </label>
              ))}
            </div>
            <div className="p-5 border-t border-border flex items-center justify-between">
              <span className="text-[12px] text-muted-text">{selected.length} selected</span>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-outline">Cancel</button>
                <button onClick={onClose} className="btn-primary flex items-center gap-2"><Download size={14} /> Import {selected.length} Goals</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Row action menu — enforces "approved goals cannot be deleted" (#goal deletion)
const GoalRowMenu = ({ goal, onOpen }: { goal: Goal; onOpen: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <button onClick={() => setOpen((o) => !o)} className="text-muted-text hover:text-primary-text"><MoreVertical size={16} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-[6px] shadow-lg z-40 py-1 text-left">
            <button onClick={() => { setOpen(false); onOpen(); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 flex items-center gap-2"><ExternalLink size={12} /> View details</button>
            <button onClick={() => { setOpen(false); onOpen(); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 flex items-center gap-2"><Pencil size={12} /> Edit goal</button>
            <div className="border-t border-border my-1" />
            {goal.approved ? (
              <div className="px-3 py-1.5 text-[11px] text-muted-text flex items-start gap-2 cursor-not-allowed" title="Approved goals can't be deleted — change the status (e.g. Completed) instead.">
                <Trash2 size={12} className="mt-0.5 flex-shrink-0" />
                <span>Delete unavailable — approved. Change status to retain the record.</span>
              </div>
            ) : (
              <button onClick={() => setOpen(false)} className="w-full text-left px-3 py-1.5 text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Delete goal</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const MyGoalsView = ({ onOpenGoal }: { onOpenGoal: (id: string) => void }) => {
  const [activeTab, setActiveTab] = useState('My Goals');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(MY_GOALS);

  const setStatus = (id: string, status: Status) =>
    setGoals((prev) => prev.map((g) => g.id === id ? { ...g, status, progress: status === 'Completed' ? 100 : g.progress } : g));

  // General check-in log (simplified — not per goal)
  const [checkIns, setCheckIns] = useState<CheckIn[]>(CHECK_IN_LOG);

  // Activity log (#491)
  const activity = [
    { icon: <UserPlus size={13} />, text: 'Team Leader Alex Reid reviewed and updated "Launch new API documentation portal"', date: '2026-06-11 10:05', tone: 'review' },
    { icon: <TrendingUp size={13} />, text: 'You updated progress on "Launch new API documentation portal" to 70%', date: '2026-06-10 11:30', tone: 'progress' },
    { icon: <CheckCircle2 size={13} />, text: 'You completed "Complete Advanced Leadership certification"', date: '2026-03-28 17:00', tone: 'complete' },
    { icon: <FileText size={13} />, text: 'You edited the description of "Mentor 2 junior PMs"', date: '2026-04-18 16:42', tone: 'edit' },
    { icon: <Download size={13} />, text: 'Imported "Reduce checkout drop-off by 15%" from Dynamics 365', date: '2026-04-01 09:00', tone: 'import' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['My Goals', 'Check-Ins', 'Goal History'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-all relative",
              activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTabMyGoals" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'My Goals' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-[4px] p-3 flex items-center gap-3 text-amber-800">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span className="text-[12px] font-medium">Some of your goals are pending manager approval. Reviews will unlock once approved.</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <select disabled defaultValue="FY2026" className="cal-group-select opacity-70 cursor-not-allowed" title="Viewing goals from previous financial years is coming in a future release">
                <option value="FY2026">FY2026 (current)</option>
                <option>Previous years — coming soon</option>
              </select>
              <button className="btn-outline">Status</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsDrawerOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={14} /> Add Goal</button>
            </div>
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="w-full border-collapse min-w-[980px]">
              <thead>
                <tr>
                  <th className="table-header w-12 text-center">#</th>
                  <th className="table-header">Goal</th>
                  <th className="table-header">Type</th>
                  <th className="table-header">Date Created</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Milestones</th>
                  <th className="table-header">Risk</th>
                  <th className="table-header">Status</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody>
                {goals.map((goal, i) => {
                  const risk = goalRisk(goal);
                  const ms = goal.milestones || [];
                  const msDone = ms.filter((m) => m.completed).length;
                  return (
                    <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell text-center text-muted-text">{i + 1}</td>
                      <td className="table-cell">
                        <button onClick={() => onOpenGoal(goal.id)} className="font-medium text-primary-action hover:underline text-left">{goal.title}</button>
                        <div className="flex items-center gap-1.5 mt-1">
                          {goal.source === 'D365 Import' && <span className="text-[9px] uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">D365</span>}
                          {goal.approved && <span className="text-[9px] uppercase tracking-wider bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle2 size={8} /> Approved</span>}
                          {goal.visibility === 'Owner Only' ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Private — excluded from manager review, reporting and search"><Eye size={9} /> Owner only · excluded from search</span>
                          ) : (
                            <span className="text-[10px] text-muted-text flex items-center gap-0.5"><Eye size={9} /> {goal.visibility}</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-wrap gap-1">
                          {(goal.goalTypes || []).map((t) => <span key={t} className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{t}</span>)}
                        </div>
                      </td>
                      <td className="table-cell text-muted-text text-[11px]">{goal.dateCreated ? fmtDate(goal.dateCreated) : '—'}</td>
                      <td className="table-cell w-40">
                        <div className="flex items-center gap-2">
                          <ProgressBar progress={goal.progress} />
                          <span className="text-[11px] font-medium">{goal.progress}%</span>
                        </div>
                      </td>
                      <td className="table-cell text-[11px] text-muted-text">{ms.length ? `${msDone}/${ms.length}` : '—'}</td>
                      <td className="table-cell">
                        {risk.atRisk ? (
                          <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded', risk.overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                            <AlertTriangle size={10} /> {risk.label}
                          </span>
                        ) : <span className="text-[11px] text-green-600">On track</span>}
                      </td>
                      <td className="table-cell">
                        <select
                          value={goal.status}
                          onChange={(e) => setStatus(goal.id, e.target.value as Status)}
                          className="cal-group-select text-[11px] py-1"
                        >
                          {PROGRESS_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="table-cell text-right">
                        <GoalRowMenu goal={goal} onOpen={() => onOpenGoal(goal.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Check-Ins' && <CheckInLogView checkIns={checkIns} setCheckIns={setCheckIns} />}

      {activeTab === 'Goal History' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-[14px]">Activity Log</h3>
          <div className="card p-0">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  a.tone === 'review' ? 'bg-blue-50 text-blue-600' : a.tone === 'complete' ? 'bg-green-50 text-green-600' : a.tone === 'import' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500')}>
                  {a.icon}
                </div>
                <span className="flex-1 text-[12.5px]">{a.text}</span>
                <span className="text-[11px] text-muted-text whitespace-nowrap">{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <GoalCreationDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
};

// --- General check-in log: date, person checked in with, free-text notes ---
const CheckInLogView = ({ checkIns, setCheckIns }: { checkIns: CheckIn[]; setCheckIns: React.Dispatch<React.SetStateAction<CheckIn[]>> }) => {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState('');
  const [withPerson, setWithPerson] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    if (!withPerson.trim() && !notes.trim()) return;
    setCheckIns((prev) => [
      { id: 'ci' + (prev.length + 1) + '-' + prev.length, date: date || 'Today', withPerson: withPerson.trim() || 'Unspecified', notes: notes.trim() },
      ...prev,
    ]);
    setDate(''); setWithPerson(''); setNotes(''); setAdding(false);
  };

  const sorted = [...checkIns].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[14px]">Check-in Log</h3>
          <p className="text-[12px] text-muted-text">A general log of discussions with your people leader or colleagues. Not tied to a specific goal.</p>
        </div>
        <button onClick={() => setAdding((a) => !a)} className="btn-primary flex items-center gap-2"><Plus size={14} /> Add Check-In</button>
      </div>

      {adding && (
        <div className="card space-y-3 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-medium">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium">Checked in with</label>
              <input type="text" value={withPerson} onChange={(e) => setWithPerson(e.target.value)} placeholder="e.g. Alex Reid (People Leader)" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-medium">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What did you discuss? Decisions, actions, anything worth recording…" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={13} /> Save check-in</button>
            <button onClick={() => setAdding(false)} className="btn-outline">Cancel</button>
          </div>
        </div>
      )}

      <div className="card space-y-0 p-0">
        {sorted.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-4 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><MessageSquare size={14} /></div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[13px]">{c.withPerson}</span>
                <span className="text-[11px] text-muted-text whitespace-nowrap">{c.date === 'Today' ? 'Today' : fmtDate(c.date)}</span>
              </div>
              {c.notes && <p className="text-[12.5px] text-muted-text mt-1 whitespace-pre-wrap">{c.notes}</p>}
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="p-6 text-center text-[12px] text-muted-text italic">No check-ins logged yet.</div>}
      </div>
    </div>
  );
};

const TeamGoalsView = () => {
  const [selectedMember, setSelectedMember] = useState(EMPLOYEES[0]);
  const reviewGoals = MY_GOALS.slice(0, 3);
  // Per-goal review status keyed by goal id (#483 review workflow)
  const [reviewStatus, setReviewStatus] = useState<Record<string, Status>>({ g1: 'Pending Approval', g2: 'Pending Approval', g3: 'Pending Approval' });
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  // Audit trail of comments & actions (#483)
  const [auditTrail, setAuditTrail] = useState([
    { id: 'a1', by: 'Alex Reid', role: 'Team Leader', date: '2026-06-11 10:05', text: 'Strong alignment to the mobile platform goal. Approving.', action: 'Approved', goal: 'Launch new API documentation portal' },
    { id: 'a2', by: 'Alex Reid', role: 'Team Leader', date: '2026-06-09 14:20', text: 'Please add a measurable target for the second mentee.', action: 'Changes Requested', goal: 'Mentor 2 junior PMs' },
  ]);

  const act = (goalId: string, goalTitle: string, action: Status) => {
    setReviewStatus((p) => ({ ...p, [goalId]: action }));
    setAuditTrail((p) => [{ id: 'a' + (p.length + 1), by: 'Alex Reid', role: 'Team Leader', date: '2026-06-23 09:00', text: `Marked as ${action}.`, action, goal: goalTitle }, ...p]);
  };

  const submitComment = (goalTitle: string) => {
    if (!commentText.trim()) return;
    setAuditTrail((p) => [{ id: 'a' + (p.length + 1), by: 'Alex Reid', role: 'Team Leader', date: '2026-06-23 09:00', text: commentText, action: 'Comment', goal: goalTitle }, ...p]);
    setCommentText('');
    setCommentFor(null);
  };

  const submissionStatus: Status = Object.values(reviewStatus).every((s) => s === 'Approved') ? 'Approved'
    : Object.values(reviewStatus).some((s) => s === 'Rejected') ? 'Rejected'
    : Object.values(reviewStatus).some((s) => s === 'Changes Requested') ? 'Changes Requested' : 'Pending Approval';

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-[4px] p-3 flex items-center gap-3 text-indigo-800">
        <Bell size={15} className="flex-shrink-0" />
        <span className="text-[12px] font-medium">Goal review cycle <strong>Q2 2026</strong> is open. Employees are notified when you review or update their goals.</span>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-[14px]">Company Goal Coverage — Your Team</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Company Goal</th>
                <th className="table-header">Team Members Contributing</th>
                <th className="table-header">Coverage Status</th>
              </tr>
            </thead>
            <tbody>
              {COMPANY_GOALS.map((goal, i) => (
                <tr key={goal.id}>
                  <td className="table-cell font-medium">{goal.title}</td>
                  <td className="table-cell text-muted-text">{i + 2} members</td>
                  <td className="table-cell">
                    <Badge status={i % 2 === 0 ? "Aligned" : "Partial"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <h3 className="font-semibold text-[14px]">Team Members</h3>
          <div className="card p-0 overflow-hidden">
            {EMPLOYEES.slice(0, 5).map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={cn(
                  "w-full flex items-center justify-between p-3 border-b border-border last:border-0 hover:bg-gray-50 transition-colors",
                  selectedMember.id === member.id && "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[12px] font-bold">
                    {member.avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[13px]">{member.name}</div>
                    <div className="text-[11px] text-muted-text">{member.role}</div>
                  </div>
                </div>
                <CheckCircle2 size={14} className={cn(member.alignment === 'Aligned' ? "text-green-600" : "text-amber-500")} />
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-semibold text-[14px] flex items-center gap-2">{selectedMember.name}'s Goal Submission <Badge status={submissionStatus} /></h3>
              <p className="text-[12px] text-muted-text">{selectedMember.role} • {selectedMember.department}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setReviewStatus({ g1: 'Approved', g2: 'Approved', g3: 'Approved' })} className="btn-primary bg-green-600 hover:bg-green-700">Approve All</button>
              <button onClick={() => reviewGoals.forEach((g) => act(g.id, g.title, 'Changes Requested'))} className="btn-outline">Request Changes</button>
            </div>
          </div>

          {/* Goal-level review actions (#483) */}
          <div className="card p-0 overflow-hidden">
            {reviewGoals.map((goal) => (
              <div key={goal.id} className="p-3 border-b border-border last:border-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <div className="font-medium text-[13px]">{goal.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <ProgressBar progress={goal.progress} className="w-28" />
                      <span className="text-[11px] text-muted-text">{goal.progress}%</span>
                      <Badge status={reviewStatus[goal.id]} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => act(goal.id, goal.title, 'Approved')} title="Approve" className="p-1.5 rounded border border-green-200 text-green-600 hover:bg-green-50"><Check size={14} /></button>
                    <button onClick={() => act(goal.id, goal.title, 'Changes Requested')} title="Request changes" className="p-1.5 rounded border border-amber-200 text-amber-600 hover:bg-amber-50"><RotateCcw size={14} /></button>
                    <button onClick={() => act(goal.id, goal.title, 'Rejected')} title="Reject" className="p-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"><X size={14} /></button>
                    <button onClick={() => setCommentFor(commentFor === goal.id ? null : goal.id)} title="Comment" className="p-1.5 rounded border border-border text-muted-text hover:bg-gray-50"><MessageSquare size={14} /></button>
                  </div>
                </div>
                {commentFor === goal.id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment for the employee…" className="flex-1 border border-border rounded-[4px] px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    <button onClick={() => submitComment(goal.title)} className="btn-primary py-1.5"><Send size={13} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Audit trail (#483) */}
          <div className="card space-y-3">
            <h3 className="font-bold text-[13px] flex items-center gap-1.5"><History size={13} /> Comments &amp; Audit Trail</h3>
            <div className="space-y-0">
              {auditTrail.map((c) => (
                <div key={c.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">AR</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-bold">{c.by}</span>
                      <span className="text-[10px] text-muted-text">{c.role}</span>
                      {c.action && c.action !== 'Comment' && <Badge status={c.action as Status} />}
                      <span className="text-[11px] text-muted-text">{c.date}</span>
                    </div>
                    <p className="text-[12px] mt-0.5">{c.text}</p>
                    <p className="text-[10px] text-muted-text italic mt-0.5">on "{c.goal}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalDetailView = ({ goalId, onBack }: { goalId?: string | null; onBack: () => void }) => {
  const base = MY_GOALS.find((g) => g.id === goalId) || MY_GOALS[0];
  const [progress, setProgress] = useState(base.progress);
  const [status, setStatusState] = useState<Status>(base.status);
  const [milestones, setMilestones] = useState(base.milestones || []);
  const [history, setHistory] = useState(base.progressHistory || []);
  const [newValue, setNewValue] = useState(base.progress);
  const [newStatus, setNewStatus] = useState<Status>(base.status);
  const [newNote, setNewNote] = useState('');
  const [linkedSkills, setLinkedSkills] = useState<string[]>(base.linkedSkills || []);
  const [changeLog, setChangeLog] = useState(base.changeHistory || []);

  const risk = goalRisk({ ...base, progress, status });

  const addUpdate = () => {
    setHistory((prev) => [...prev, { id: 'pn' + prev.length, date: '2026-06-23 09:00', value: newValue, status: newStatus, note: newNote || undefined, by: 'Sarah Chen' }]);
    setChangeLog((prev) => {
      const entries = [...prev];
      if (newValue !== progress) entries.push({ id: 'cl' + entries.length, date: '2026-06-23 09:00', field: 'Progress', from: `${progress}%`, to: `${newValue}%`, by: 'Sarah Chen' });
      if (newStatus !== status) entries.push({ id: 'cl' + entries.length + 's', date: '2026-06-23 09:00', field: 'Status', from: status, to: newStatus, by: 'Sarah Chen' });
      return entries;
    });
    setProgress(newValue);
    setStatusState(newStatus);
    setNewNote('');
  };

  const linkSkill = (skill: string) => {
    if (linkedSkills.includes(skill)) return;
    setLinkedSkills((prev) => [...prev, skill]);
    setChangeLog((prev) => [...prev, { id: 'cl' + prev.length + 'sk', date: '2026-06-23 09:00', field: 'Linked skill', from: '—', to: skill, by: 'Sarah Chen' }]);
  };

  const toggleMilestone = (id: string) =>
    setMilestones((prev) => prev.map((m) => m.id === id ? { ...m, completed: !m.completed } : m));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-text text-[12px] flex-wrap">
        <button onClick={onBack} className="hover:text-primary-text">Goals</button>
        <ChevronRight size={12} />
        <span className="text-primary-text font-medium">{base.title}</span>
        <Badge status={status} />
        {base.source === 'D365 Import' && <span className="text-[9px] uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">D365</span>}
      </div>

      {/* At Risk / Overdue banner (#482 Deadlines & Risk Indicators) */}
      {risk.atRisk && (
        <div className={cn('rounded-[4px] p-3 flex items-center gap-3 border', risk.overdue ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800')}>
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="text-[12px] font-medium">{risk.overdue ? 'This goal is overdue.' : 'This goal is approaching its due date with low progress.'} {risk.label} — consider a check-in or status update.</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Progress', value: `${progress}%` },
          { label: 'Status', value: status },
          { label: 'Weight', value: `${base.weight}%` },
          { label: 'Target Date', value: fmtDate(base.dueDate) },
        ].map((stat, i) => (
          <div key={i} className="card">
            <span className="text-[11px] text-muted-text uppercase tracking-tight">{stat.label}</span>
            <div className="text-[18px] font-bold mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Visual progress indicator */}
      <div className="card space-y-2">
        <div className="flex items-center justify-between text-[12px]"><span className="font-semibold">Progress</span><Badge status={status} /></div>
        <ProgressBar progress={progress} className="h-2.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-3">
            <h3 className="font-bold text-[15px]">Goal Description</h3>
            <p className="text-muted-text leading-relaxed text-[13px]">{base.description}</p>

            {/* Tags: type, values, visibility */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(base.goalTypes || []).map((t) => <span key={t} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{t}</span>)}
              {(base.scyneValues || []).map((v) => <span key={v} className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Tag size={9} />{v}</span>)}
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Eye size={9} />{base.visibility}</span>
            </div>
          </div>

          {/* Measurements (#482) */}
          <div className="card space-y-3">
            <h3 className="font-bold text-[14px]">Measurements</h3>
            <table className="w-full border-collapse">
              <thead><tr><th className="table-header">Metric</th><th className="table-header">Current</th><th className="table-header">Target</th><th className="table-header">Progress</th></tr></thead>
              <tbody>
                {(base.metrics || []).map((m) => (
                  <tr key={m.id}>
                    <td className="table-cell font-medium">{m.name}</td>
                    <td className="table-cell">{m.current}{m.unit}</td>
                    <td className="table-cell">{m.target}{m.unit}</td>
                    <td className="table-cell w-28"><ProgressBar progress={Math.round(((m.current || 0) / m.target) * 100)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Milestones (#482) */}
          <div className="card space-y-3">
            <h3 className="font-bold text-[14px] flex items-center gap-1.5"><Flag size={14} /> Milestones</h3>
            <div className="space-y-2">
              {milestones.map((m) => (
                <label key={m.id} className="flex items-center gap-3 p-2 rounded-[4px] hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={m.completed} onChange={() => toggleMilestone(m.id)} className="accent-[#464E7E]" />
                  <span className={cn('flex-1 text-[13px]', m.completed && 'line-through text-muted-text')}>{m.description}</span>
                  <span className="text-[11px] text-muted-text">{fmtDate(m.targetDate)}</span>
                </label>
              ))}
              {milestones.length === 0 && <p className="text-[12px] text-muted-text italic">No milestones defined.</p>}
            </div>
            <p className="text-[11px] text-muted-text">{milestones.filter((m) => m.completed).length} of {milestones.length} complete — contributes to overall progress.</p>
          </div>

          {/* Progress updates & history (#482) */}
          <div className="card space-y-4">
            <h3 className="font-bold text-[14px] flex items-center gap-1.5"><History size={14} /> Progress Updates &amp; History</h3>
            <div className="bg-gray-50 border border-border rounded-[4px] p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">Progress %</label>
                  <input type="number" min={0} max={100} value={newValue} onChange={(e) => setNewValue(Number(e.target.value))} className="w-full border border-border rounded-[4px] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Status)} className="w-full border border-border rounded-[4px] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action">
                    {PROGRESS_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} placeholder="Add a comment about this update (optional)" className="w-full border border-border rounded-[4px] px-2 py-1.5 text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-primary-action" />
              <button onClick={addUpdate} className="btn-primary flex items-center gap-2"><Save size={13} /> Save Update</button>
            </div>
            <div className="space-y-0">
              {[...history].reverse().map((u, i) => (
                <div key={u.id + i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <Clock size={13} className="text-muted-text mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-primary-action">{u.value}%</span>
                      {u.status && <Badge status={u.status} />}
                      <span className="text-[11px] text-muted-text">{u.date} • {u.by}</span>
                    </div>
                    {u.note && <p className="text-[12px] text-muted-text italic mt-0.5">"{u.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Change history — every edit is tracked and retained */}
          <div className="card space-y-3">
            <h3 className="font-bold text-[14px] flex items-center gap-1.5"><History size={14} /> Change History</h3>
            <p className="text-[11px] text-muted-text">A full audit trail of changes to this goal. Records are retained and cannot be deleted.</p>
            <div className="space-y-0">
              {[...changeLog].reverse().map((c) => (
                <div key={c.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <Pencil size={13} className="text-muted-text mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[12.5px]">
                      <span className="font-semibold">{c.field}</span>
                      {c.from !== '—' ? <> changed from <span className="text-muted-text line-through">{c.from}</span> to <span className="font-medium">{c.to}</span></> : <> — <span className="font-medium">{c.to}</span></>}
                    </div>
                    <span className="text-[11px] text-muted-text">{c.date} • {c.by}</span>
                  </div>
                </div>
              ))}
              {changeLog.length === 0 && <p className="text-[12px] text-muted-text italic">No changes recorded yet.</p>}
            </div>
          </div>
        </div>

        {/* Sidebar: linked items + review */}
        <div className="space-y-6">
          <div className="card space-y-3">
            <h3 className="font-bold text-[13px] flex items-center gap-1.5"><Link2 size={13} /> Linked Items</h3>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text flex items-center gap-1"><Award size={10} /> Skills Passport</span>
              <div className="flex flex-wrap gap-1 mt-1">{linkedSkills.map((s) => <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>)}{linkedSkills.length === 0 && <span className="text-[11px] text-muted-text italic">None</span>}</div>
              <div className="mt-2">
                <label className="text-[10px] text-muted-text">Link a skill to this goal</label>
                <select value="" onChange={(e) => { if (e.target.value) linkSkill(e.target.value); }} className="cal-group-select w-full text-[11px] mt-1">
                  <option value="">+ Add skill…</option>
                  {SKILLS_PASSPORT.Skills.filter((s) => !linkedSkills.includes(s)).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text">Activities</span>
              <div className="flex flex-wrap gap-1 mt-1">{(base.linkedActivities || []).map((s) => <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>)}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text">Linked Feedback</span>
              <div className="flex flex-wrap gap-1 mt-1">{(base.linkedFeedback || []).length ? base.linkedFeedback!.map((f) => <span key={f} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1"><MessageSquare size={9} />Alex Reid — recognition</span>) : <span className="text-[11px] text-muted-text italic">None</span>}</div>
            </div>
          </div>

          {/* Performance review link (#502) */}
          <div className="card space-y-2">
            <h3 className="font-bold text-[13px] flex items-center gap-1.5"><ClipboardList size={13} /> Performance Review</h3>
            {base.linkedReview ? (
              <div className="flex items-center justify-between">
                <span className="text-[12px]">{base.linkedReview}</span>
                <button className="text-[11px] text-primary-action hover:underline flex items-center gap-1">Open <ExternalLink size={10} /></button>
              </div>
            ) : <span className="text-[11px] text-muted-text italic">Not linked to a review</span>}
            <p className="text-[11px] text-muted-text">This goal's description, metrics and progress appear during the review discussion.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Grade Expectations (REQ1 #501) — hard-coded performance criteria (replaces PowerPoint links) ---
const GradeExpectationsView = () => {
  const [selected, setSelected] = useState(GRADE_EXPECTATIONS[2].grade);
  const profile = GRADE_EXPECTATIONS.find((g) => g.grade === selected) || GRADE_EXPECTATIONS[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[16px] font-bold">Grade Expectations</h3>
        <p className="text-[12px] text-muted-text">Performance criteria for each grade. Use these to calibrate goals, reviews and development conversations.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {GRADE_EXPECTATIONS.map((g) => (
          <button
            key={g.grade}
            onClick={() => setSelected(g.grade)}
            className={cn('px-3 py-1.5 rounded-[4px] border text-[12.5px] font-medium transition-all flex items-center gap-2',
              selected === g.grade ? 'bg-indigo-50 border-primary-action text-primary-action' : 'bg-white border-border text-muted-text hover:bg-gray-50')}
          >
            <span className="font-bold">{g.grade}</span>
            <span className="text-[11px]">{g.level}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-2">
          <div className="card space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold bg-indigo-600 text-white w-10 h-10 rounded flex items-center justify-center">{profile.grade}</span>
              <div>
                <h3 className="font-bold text-[15px]">{profile.level}</h3>
                <span className="text-[11px] text-muted-text">Grade {profile.grade}</span>
              </div>
            </div>
            <p className="text-[12.5px] text-muted-text leading-relaxed">{profile.summary}</p>
          </div>
          <div className="card space-y-1.5">
            <h4 className="text-[11px] uppercase tracking-wider text-muted-text font-bold">All grades</h4>
            {GRADE_EXPECTATIONS.map((g) => (
              <button key={g.grade} onClick={() => setSelected(g.grade)} className={cn('w-full text-left flex items-center gap-2 p-2 rounded-[4px] hover:bg-gray-50', selected === g.grade && 'bg-gray-50')}>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{g.grade}</span>
                <span className="text-[12px]">{g.level}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="card space-y-0 p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-gray-50">
              <h4 className="font-bold text-[13px] flex items-center gap-1.5"><CheckSquare size={14} /> Performance criteria — {profile.grade} {profile.level}</h4>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header w-44">Area</th>
                  <th className="table-header">Expectation</th>
                </tr>
              </thead>
              <tbody>
                {profile.criteria.map((c) => (
                  <tr key={c.area} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="table-cell font-semibold">{c.area}</td>
                    <td className="table-cell text-[12.5px]">{c.expectation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-text italic">Source: Scyne performance framework. Previously distributed as PowerPoint files; now maintained here.</p>
        </div>
      </div>
    </div>
  );
};

const CycleBuilder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Cycle Builder</h3>
        <button className="btn-primary">+ Create New Cycle</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { name: 'FY 2025–26 Year-End', status: 'In Progress', type: 'Annual', launchDate: 'Mar 01, 2026' },
          { name: 'Q1 2026 Check-in', status: 'Scheduled', type: 'Quarterly', launchDate: 'Jun 01, 2026' },
        ].map((cycle, i) => (
          <div key={i} className="card space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-[15px] font-bold">{cycle.name}</h4>
              <Badge status={cycle.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-[12px]">
              <div>
                <p className="text-muted-text uppercase font-bold text-[10px]">Type</p>
                <p className="font-medium">{cycle.type}</p>
              </div>
              <div>
                <p className="text-muted-text uppercase font-bold text-[10px]">Launch Date</p>
                <p className="font-medium">{cycle.launchDate}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <button className="btn-outline py-1 px-3 text-[11px]">Edit</button>
              <button className="btn-primary py-1 px-3 text-[11px]">Manage</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FormBuilderView = () => {
  const [activeForm, setActiveForm] = useState('Annual Review — Standard');
  const [questions, setQuestions] = useState([
    { id: 1, text: 'How would you rate your overall performance this period?', type: 'Rating 1–5', required: true },
    { id: 2, text: 'What were your key achievements?', type: 'Open Text', required: true },
    { id: 3, text: 'What areas would you like to focus on for growth?', type: 'Open Text', required: true },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Saved Forms</h4>
        <div className="space-y-2">
          {[
            { name: 'Annual Review — Standard', count: 4, usage: '2 cycles' },
            { name: 'Mid-Year Pulse', count: 6, usage: '1 cycle' },
            { name: '30-Day New Hire Check-in', count: 3, usage: '0 cycles' },
            { name: 'Upward Review — Manager', count: 6, usage: '0 cycles' },
          ].map(form => (
            <div 
              key={form.name}
              onClick={() => setActiveForm(form.name)}
              className={cn(
                "p-3 rounded-[4px] border cursor-pointer transition-all group",
                activeForm === form.name ? "bg-indigo-50 border-primary-action" : "bg-white border-border hover:bg-gray-50"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[13px] font-bold">{form.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-gray-200 rounded"><FileText size={12} /></button>
                  <button className="p-1 hover:bg-gray-200 rounded text-red-600"><LogOut size={12} className="rotate-90" /></button>
                </div>
              </div>
              <p className="text-[11px] text-muted-text">{form.count} questions | Used in {form.usage}</p>
            </div>
          ))}
          <button className="w-full py-2 border border-dashed border-border rounded-[4px] text-[12px] font-bold text-primary-action hover:bg-gray-50">+ New Form</button>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-6">
        <div className="flex items-center justify-between">
          <input 
            type="text" 
            value={activeForm} 
            onChange={(e) => setActiveForm(e.target.value)}
            className="text-[18px] font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full"
          />
          <div className="flex gap-2">
            <button className="btn-outline py-1.5">Save as Draft</button>
            <button className="btn-primary py-1.5">Publish Form</button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Questions</h4>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="card flex gap-4 group">
                <div className="flex-shrink-0 pt-1 cursor-move text-muted-text">
                  <Menu size={16} />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-muted-text">Q{i + 1}</span>
                      <span className="badge bg-indigo-50 text-indigo-700">{q.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-[11px] font-bold text-muted-text uppercase">Required</span>
                        <div className={cn("w-8 h-4 rounded-full relative transition-colors", q.required ? "bg-primary-action" : "bg-gray-200")}>
                          <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", q.required ? "right-0.5" : "left-0.5")} />
                        </div>
                      </label>
                      <button className="text-muted-text hover:text-red-600"><LogOut size={14} className="rotate-90" /></button>
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={q.text}
                    className="w-full border-b border-transparent focus:border-primary-action focus:outline-none py-1 text-[14px] font-medium"
                  />
                  {q.type === 'Rating 1–5' && (
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-[12px] text-muted-text">{n}</div>
                      ))}
                    </div>
                  )}
                  {q.type === 'Open Text' && (
                    <div className="w-full h-20 bg-gray-50 border border-dashed border-border rounded" />
                  )}
                </div>
              </div>
            ))}
            <button className="w-full py-4 border border-dashed border-border rounded-[4px] text-[13px] font-bold text-muted-text hover:bg-gray-50 hover:text-primary-action transition-all">
              + Add Question
            </button>
            <button className="text-[12px] font-bold text-primary-action hover:underline">+ Add Section Break</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AutomationRulesView = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Event-Triggered Review Automation</h4>
            <p className="text-[12px] text-muted-text">Create review cycles that launch automatically based on employee events.</p>
          </div>
          <button className="btn-primary py-1.5">+ New Automation Rule</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">Rule Name</th>
                <th className="table-header">Trigger Event</th>
                <th className="table-header">Review Type</th>
                <th className="table-header">Schedule</th>
                <th className="table-header">Participants</th>
                <th className="table-header">Status</th>
                <th className="table-header">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="table-cell font-medium">New Hire Onboarding Check-ins</td>
                <td className="table-cell text-muted-text">Employee Joins</td>
                <td className="table-cell text-muted-text">Self + Manager</td>
                <td className="table-cell text-muted-text">30, 60, 90 days</td>
                <td className="table-cell text-muted-text">All new hires</td>
                <td className="table-cell"><Badge status="Active" /></td>
                <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
              </tr>
              {/* Goal review cadence (#488) */}
              <tr>
                <td className="table-cell font-medium">Annual Goal Creation Reminder</td>
                <td className="table-cell text-muted-text">Calendar (Annual)</td>
                <td className="table-cell text-muted-text">Notification + Task</td>
                <td className="table-cell text-muted-text">Jan 1 each year</td>
                <td className="table-cell text-muted-text">All employees</td>
                <td className="table-cell"><Badge status="Active" /></td>
                <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
              </tr>
              <tr>
                <td className="table-cell font-medium">Quarterly Goal Review Reminder</td>
                <td className="table-cell text-muted-text">Calendar (Quarterly)</td>
                <td className="table-cell text-muted-text">Notification + Task</td>
                <td className="table-cell text-muted-text">Start of each quarter</td>
                <td className="table-cell text-muted-text">All employees</td>
                <td className="table-cell"><Badge status="Active" /></td>
                <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-text flex items-center gap-1.5"><Info size={12} /> Reminders create a corresponding task in each user's goal workspace to prompt creation / updates.</p>
      </div>

      <div className="space-y-4 pt-8 border-t border-border">
        <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Manager Change Policies</h4>
        <div className="card space-y-6">
          <p className="text-[13px] font-medium">When an employee changes manager during an active review cycle:</p>
          <div className="space-y-3">
            {[
              'Previous manager completes the review',
              'New manager completes the review',
              'Both managers complete separate reviews (merged by HR)',
              'Skip-level manager completes the review',
              'Ask HR to decide on a case-by-case basis'
            ].map((option, i) => (
              <label key={i} className="flex items-center gap-3 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                  i === 4 ? "border-primary-action" : "border-border group-hover:border-primary-action"
                )}>
                  {i === 4 && <div className="w-2 h-2 rounded-full bg-primary-action" />}
                </div>
                <span className="text-[13px]">{option}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-text uppercase">Min days in role before new manager reviews</label>
              <input type="number" defaultValue={30} className="w-20 border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-text uppercase">Apply this policy to</label>
              <select className="border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action">
                <option>All Cycles</option>
                <option>Annual Only</option>
              </select>
            </div>
          </div>
          <button className="btn-primary py-2 px-6">Save Policy</button>
        </div>
      </div>
    </div>
  );
};

const AdminView = () => {
  const [activeTab, setActiveTab] = useState('Cycle Builder');

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['Cycle Builder', 'Competencies', 'Form Builder', 'Automation Rules', 'Notification Rules', 'Role Permissions', 'Security & Data'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-[13px] font-medium transition-all relative",
              activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
            )}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeTabAdmin" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'Cycle Builder' && <CycleBuilder />}
        {activeTab === 'Form Builder' && <FormBuilderView />}
        {activeTab === 'Automation Rules' && <AutomationRulesView />}
        {activeTab === 'Notification Rules' && <NotificationRulesView />}
        {activeTab === 'Role Permissions' && <RolePermissionsView />}
        {activeTab === 'Security & Data' && <SecurityDataView />}
      </div>
    </div>
  );
};

// --- Security groups + HRIS data load (People Team all-goals access; coachee/reporting line from HRIS) ---
const SecurityDataView = () => {
  return (
    <div className="space-y-6">
      {/* People Team security group */}
      <div className="space-y-2">
        <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Security Groups</h4>
        <div className="card space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[6px] bg-indigo-50 text-indigo-700 flex items-center justify-center"><Eye size={16} /></div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[14px]">People Team — All Goals Access</h3>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-[12px] text-muted-text mt-0.5 max-w-xl">Designated People Team members in this group can view <span className="font-medium">all employee goals</span> across the organisation, regardless of each goal's visibility setting. Membership is restricted and audited.</p>
              </div>
            </div>
            <button className="btn-outline flex items-center gap-2"><UserPlus size={14} /> Manage members</button>
          </div>
          <div className="border-t border-border pt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold">Members</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {['Priya B', 'Alex Reid'].map((m) => (
                <span key={m} className="text-[12px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center">{m.split(' ').map((n) => n[0]).join('')}</span>
                  {m}
                </span>
              ))}
              <button className="text-[12px] text-primary-action hover:underline flex items-center gap-1"><Plus size={12} /> Add member</button>
            </div>
          </div>
        </div>
      </div>

      {/* HRIS data load */}
      <div className="space-y-2">
        <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Coachee / Reporting Line Data</h4>
        <div className="card space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-[4px] p-3 flex items-start gap-2 text-amber-800">
            <Info size={15} className="flex-shrink-0 mt-0.5" />
            <span className="text-[12px]">Direct HRIS integration is not planned for Phase 1. Coachee and reporting-line data is <span className="font-medium">loaded from HRIS via file import</span>.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold">Last load</span>
              <div className="text-[13px] font-medium mt-1">28 Jun 2026, 02:00</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold">Records loaded</span>
              <div className="text-[13px] font-medium mt-1">1,284 employees</div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-text font-bold">Source</span>
              <div className="text-[13px] font-medium mt-1">HRIS export (CSV)</div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <button className="btn-primary flex items-center gap-2"><Upload size={14} /> Upload HRIS file</button>
            <span className="text-[11px] text-muted-text">Accepts the standard HRIS reporting-line export.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReviewDetailView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState('Evaluation');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-text text-[12px]">
        <button onClick={onBack} className="hover:text-primary-text">Reviews</button>
        <ChevronRight size={12} />
        <span className="text-primary-text font-medium">Sarah Chen — FY 2025–26 Year-End</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-indigo-600 text-[24px] font-bold">
              SC
            </div>
            <div>
              <h3 className="text-[16px] font-bold">Sarah Chen</h3>
              <p className="text-[12px] text-muted-text">Senior Software Engineer</p>
            </div>
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-[10px] text-muted-text uppercase font-bold">Tenure</p>
                <p className="text-[13px] font-bold">2.4 Years</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-text uppercase font-bold">Last Rating</p>
                <p className="text-[13px] font-bold">Strong</p>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Review Progress</h4>
            <div className="space-y-4">
              {[
                { label: 'Self-Assessment', status: 'Done', date: 'Mar 15' },
                { label: 'Manager Evaluation', status: 'In Progress' },
                { label: 'Calibration', status: 'Locked' },
                { label: 'Results Shared', status: 'Locked' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center border",
                    step.status === 'Done' ? "bg-green-500 border-green-500 text-white" :
                    step.status === 'In Progress' ? "border-primary-action text-primary-action" : "border-gray-200 text-gray-200"
                  )}>
                    {step.status === 'Done' ? <Check size={12} /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold">{step.label}</p>
                    {step.date && <p className="text-[10px] text-muted-text">{step.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-center border-b border-border">
            {['Evaluation', 'Self-Assessment', 'Feedback Received', 'Growth Plan'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-[13px] font-medium transition-all relative",
                  activeTab === tab ? "text-primary-action" : "text-muted-text hover:text-primary-text"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div layoutId="activeTabReviewDetail" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'Evaluation' && (
            <div className="space-y-6">
              <div className="card-review">
                <h4 className="text-[15px] font-bold mb-4">Goal 1: Lead the Migration to Microservices</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-muted-text uppercase">Manager Rating</label>
                    <div className="flex gap-2 mt-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} className={cn(
                          "w-10 h-10 rounded-full border border-border flex items-center justify-center text-[14px] font-bold transition-all",
                          n === 4 ? "bg-primary-action text-white border-primary-action" : "hover:bg-gray-50"
                        )}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-text uppercase">Manager Commentary</label>
                    <textarea 
                      className="w-full mt-1 border border-border rounded-[4px] p-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action h-32"
                      placeholder="Enter your evaluation..."
                      defaultValue="Sarah has shown exceptional leadership in this project. The migration is 80% complete and has already resulted in a 30% reduction in latency."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn-outline">Save Draft</button>
                <button className="btn-primary">Submit Evaluation</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NotificationRulesView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Notification Rules</h3>
        <button className="btn-primary">+ Add Rule</button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-header">Event</th>
              <th className="table-header">Recipient</th>
              <th className="table-header">Channel</th>
              <th className="table-header">Template</th>
              <th className="table-header">Status</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { event: 'Review Cycle Started', recipient: 'All Employees', channel: 'Email, Slack', template: 'Cycle Launch', status: 'Active' },
              { event: 'Self-Assessment Pending', recipient: 'Employee', channel: 'Slack', template: 'Reminder (3d)', status: 'Active' },
              { event: 'Manager Review Submitted', recipient: 'HRBP', channel: 'Email', template: 'Review Alert', status: 'Inactive' },
              { event: 'TL Reviewed / Updated a Goal', recipient: 'Goal Owner', channel: 'Email, In-App', template: 'Goal Reviewed', status: 'Active' },
              { event: 'Annual Goal Creation Due', recipient: 'All Employees', channel: 'Email, In-App', template: 'Create Goals (Annual)', status: 'Active' },
              { event: 'Quarterly Goal Review Due', recipient: 'All Employees', channel: 'Email, In-App', template: 'Update Goals (Quarterly)', status: 'Active' },
              { event: 'Feedback Request Received', recipient: 'Respondent', channel: 'Email, In-App', template: 'Feedback Request', status: 'Active' },
              { event: 'Feedback Completed', recipient: 'Requestor', channel: 'Email, In-App', template: 'Feedback Ready', status: 'Active' },
            ].map((rule, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell font-medium">{rule.event}</td>
                <td className="table-cell text-muted-text">{rule.recipient}</td>
                <td className="table-cell text-muted-text">{rule.channel}</td>
                <td className="table-cell text-primary-action cursor-pointer hover:underline">{rule.template}</td>
                <td className="table-cell"><Badge status={rule.status} /></td>
                <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RolePermissionsView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold">Role Permissions</h3>
        <button className="btn-primary">+ Create Role</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { role: 'Super Admin', users: 3, permissions: 'Full Access' },
          { role: 'HR Manager', users: 12, permissions: 'Reviews, People, Merit' },
          { role: 'Department Head', users: 45, permissions: 'Team Analytics, Talent Review' },
        ].map((role, i) => (
          <div key={i} className="card space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-[15px] font-bold">{role.role}</h4>
              <span className="text-[11px] font-bold text-muted-text bg-gray-100 px-2 py-0.5 rounded">{role.users} Users</span>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] text-muted-text uppercase font-bold tracking-wider">Key Permissions</p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.split(', ').map(p => (
                  <span key={p} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{p}</span>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-border flex justify-between items-center">
              <button className="text-[12px] font-bold text-primary-action hover:underline">Edit Permissions</button>
              <button className="text-muted-text hover:text-red-600 transition-colors"><MoreVertical size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Chatbot Component ---
const AIChatbot = ({ 
  state, 
  onClose, 
  onMinimize, 
  onMaximize, 
  onChipClick, 
  onSendMessage,
  onPositionChange
}: { 
  state: any, 
  onClose: () => void, 
  onMinimize: () => void, 
  onMaximize: () => void, 
  onChipClick: (chip: string) => void,
  onSendMessage: (msg: string) => void,
  onPositionChange: (pos: { x: number, y: number }) => void
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.isMaximized) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  if (!state.isOpen) return null;

  const config = TRIGGER_CONFIGS[state.activeTrigger] || { title: 'AI Assistant', chips: [] };

  return (
    <motion.div 
      className={cn(
        "chatbot-container",
        state.isMinimized && "chatbot-minimized",
        state.isMaximized && "chatbot-maximized"
      )}
      style={!state.isMaximized ? { left: state.position.x, top: state.position.y } : {}}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
    >
      {/* Header */}
      <div 
        className="chatbot-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-white leading-none">{config.title}</h3>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-indigo-100 font-medium">AI Agent Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
            {state.isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {!state.isMinimized && (
            <button onClick={onMaximize} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
              {state.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
            <X size={14} />
          </button>
        </div>
      </div>

      {!state.isMinimized && (
        <>
          {/* Messages */}
          <div className="chatbot-messages">
            <div className="space-y-4">
              {state.messages.map((msg: any, i: number) => (
                <div key={i} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn("message-bubble", msg.type === 'user' ? "user" : "ai")}>
                    {msg.type === 'ai' && (
                      <div className="flex items-center gap-1.5 mb-1.5 opacity-60">
                        <Bot size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Scyne AI</span>
                      </div>
                    )}
                    <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {msg.type === 'ai' && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-indigo-100/30">
                        <button className="p-1 hover:bg-indigo-100/50 rounded transition-colors text-indigo-600">
                          <Copy size={12} />
                        </button>
                        <button className="p-1 hover:bg-indigo-100/50 rounded transition-colors text-indigo-600">
                          <RefreshCw size={12} />
                        </button>
                        <div className="flex-1" />
                        <span className="text-[10px] text-muted-text">Just now</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer */}
          <div className="chatbot-footer">
            {/* Quick Chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {config.chips.map((chip: string) => (
                <button 
                  key={chip}
                  onClick={() => onChipClick(chip)}
                  className="chatbot-chip"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    onSendMessage(inputValue);
                    setInputValue('');
                  }
                }}
                placeholder="Ask Scyne AI anything..."
                className="chatbot-input"
              />
              <button 
                onClick={() => {
                  if (inputValue.trim()) {
                    onSendMessage(inputValue);
                    setInputValue('');
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-action text-white rounded hover:bg-indigo-700 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-text mt-3">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
};

// --- Main App ---

// --- Notification & Task center (REQ1 #483/#488/#491, REQ2 #493/#496) ---
const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'notifs' | 'tasks'>('notifs');
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [tasks, setTasks] = useState(TASKS);
  const unread = notifs.filter((n) => n.unread).length;
  const openTasks = tasks.filter((t) => !t.done).length;

  const iconFor = (t: string) =>
    t === 'review' ? <UserPlus size={13} /> : t === 'feedback' ? <CheckCheck size={13} /> : t === 'request' ? <Send size={13} /> : <Calendar size={13} />;
  const toneFor = (t: string) =>
    t === 'review' ? 'bg-blue-50 text-blue-600' : t === 'feedback' ? 'bg-green-50 text-green-600' : t === 'request' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600';

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-[4px] border border-border hover:bg-gray-50 text-muted-text hover:text-primary-text">
        <Bell size={16} />
        {(unread + openTasks) > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{unread + openTasks}</span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[348px] bg-white border border-border rounded-[8px] shadow-xl z-50 overflow-hidden">
            <div className="flex items-center border-b border-border">
              <button onClick={() => setTab('notifs')} className={cn('flex-1 py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5', tab === 'notifs' ? 'text-primary-action border-b-2 border-primary-action' : 'text-muted-text')}>
                <Bell size={13} /> Notifications {unread > 0 && <span className="bg-red-100 text-red-600 rounded-full px-1.5 text-[9px]">{unread}</span>}
              </button>
              <button onClick={() => setTab('tasks')} className={cn('flex-1 py-2.5 text-[12px] font-bold flex items-center justify-center gap-1.5', tab === 'tasks' ? 'text-primary-action border-b-2 border-primary-action' : 'text-muted-text')}>
                <ListTodo size={13} /> Tasks {openTasks > 0 && <span className="bg-indigo-100 text-indigo-700 rounded-full px-1.5 text-[9px]">{openTasks}</span>}
              </button>
            </div>

            {tab === 'notifs' && (
              <div className="max-h-[380px] overflow-y-auto">
                <div className="flex justify-end px-3 py-1.5 border-b border-border">
                  <button onClick={() => setNotifs((p) => p.map((n) => ({ ...n, unread: false })))} className="text-[10px] text-primary-action hover:underline">Mark all read</button>
                </div>
                {notifs.map((n) => (
                  <button key={n.id} onClick={() => setNotifs((p) => p.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))} className={cn('w-full text-left flex items-start gap-2.5 p-3 border-b border-border last:border-0 hover:bg-gray-50', n.unread && 'bg-indigo-50/30')}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', toneFor(n.icon))}>{iconFor(n.icon)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-bold">{n.title}</span>
                        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-text leading-snug">{n.body}</p>
                      <span className="text-[10px] text-muted-text">{n.time} • {n.channel}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tab === 'tasks' && (
              <div className="max-h-[380px] overflow-y-auto">
                {tasks.map((t) => (
                  <label key={t.id} className="flex items-start gap-2.5 p-3 border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={t.done} onChange={() => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="accent-[#464E7E] mt-0.5" />
                    <div className="flex-1">
                      <span className={cn('text-[12px] font-medium', t.done && 'line-through text-muted-text')}>{t.title}</span>
                      <div className="text-[10px] text-muted-text">Auto-created from: {t.source} • due {fmtDate(t.due)}</div>
                    </div>
                  </label>
                ))}
                <p className="text-[10px] text-muted-text p-3">Tasks are auto-created by goal cadence reminders and feedback requests.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  console.log('App rendering...');
  const [activeView, setActiveView] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [roleMode, setRoleMode] = useState<'Direct' | 'Skip-Level'>('Direct');
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedEmployeeReview, setSelectedEmployeeReview] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalDetailFrom, setGoalDetailFrom] = useState('Practice Goals');

  const openGoalDetail = (goalId: string | null, from: string) => {
    setSelectedGoalId(goalId);
    setGoalDetailFrom(from);
    setActiveView('GoalDetail');
  };

  const [chatbot, setChatbot] = useState({
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    activeTrigger: null as string | null,
    messages: [] as { type: 'user' | 'ai', text: string }[],
    context: null as any,
    position: { x: window.innerWidth - 420, y: window.innerHeight - 620 }
  });

  const openChatbot = (trigger: string, context: any = null) => {
    const config = TRIGGER_CONFIGS[trigger];
    const initialMessage = {
      type: 'ai' as const,
      text: `Hello! I'm your ${config?.title || 'AI Assistant'}. How can I help you with ${context?.employeeName || 'this view'} today?`
    };
    
    setChatbot(prev => ({
      ...prev,
      isOpen: true,
      isMinimized: false,
      activeTrigger: trigger,
      context,
      messages: [initialMessage]
    }));
  };

  const handleSendMessage = (text: string) => {
    const userMsg = { type: 'user' as const, text };
    const aiMsg = { 
      type: 'ai' as const, 
      text: `I've analyzed your request: "${text}". Based on the current context, I recommend reviewing the latest performance trends and competency gaps.`
    };
    
    setChatbot(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg, aiMsg]
    }));
  };

  const handleChipClick = (chip: string) => {
    const userMsg = { type: 'user' as const, text: chip };
    const aiMsg = { 
      type: 'ai' as const, 
      text: CHIP_RESPONSES[chip] || "I'm processing that request now..."
    };
    
    setChatbot(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg, aiMsg]
    }));
  };

  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={14} /> },
    { name: 'Practice Goals', icon: <Building2 size={14} /> },
    { name: 'My Goals', icon: <Target size={14} /> },
    { name: 'Team Goals', icon: <Users size={14} /> },
    { name: 'Grade Expectations', icon: <Layers size={14} /> },
    { name: 'Reviews', icon: <ClipboardList size={14} /> },
    { name: 'Feedback', icon: <MessageSquare size={14} /> },
    { name: 'Admin', icon: <Settings size={14} /> },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard setActiveView={setActiveView} />;
      case 'Practice Goals': return <CompanyGoalsView setActiveView={setActiveView} onOpenGoal={(id) => openGoalDetail(id, 'Practice Goals')} />;
      case 'Reviews': return (
        <ReviewsView 
          setActiveView={setActiveView} 
          roleMode={roleMode} 
          onCycleClick={(name) => {
            setSelectedCycle(name);
            setActiveView('CycleWorkspace');
          }}
        />
      );
      case 'Feedback': return <FeedbackView />;
      case 'SelfAssessment': return <SelfAssessmentView onBack={() => setActiveView('Reviews')} />;
      case 'ManagerReview': return <ManagerReviewView onBack={() => setActiveView('Reviews')} openChatbot={openChatbot} />;
      case 'ReviewResults': return <ReviewResultsView onBack={() => setActiveView('Reviews')} />;
      case 'My Goals': return <MyGoalsView onOpenGoal={(id) => openGoalDetail(id, 'My Goals')} />;
      case 'Team Goals': return <TeamGoalsView />;
      case 'Grade Expectations': return <GradeExpectationsView />;
      case 'Admin': return <AdminView />;
      case 'GoalDetail': return <GoalDetailView key={selectedGoalId || 'default'} goalId={selectedGoalId} onBack={() => setActiveView(goalDetailFrom)} />;
      case 'ReviewDetail': return <ReviewDetailView onBack={() => setActiveView('Reviews')} />;
      case 'CycleWorkspace': return (
        <CycleWorkspaceView 
          cycleName={selectedCycle || 'Review Cycle'} 
          onBack={() => {
            setSelectedCycle(null);
            setActiveView('Reviews');
          }}
          onEmployeeClick={(name) => {
            setSelectedEmployeeReview(name);
            setActiveView('IndividualReviewWorkspace');
          }}
          openChatbot={openChatbot}
        />
      );
      case 'IndividualReviewWorkspace': return (
        <IndividualReviewWorkspaceView 
          employeeName={selectedEmployeeReview || 'Employee'} 
          onBack={() => {
            setSelectedEmployeeReview(null);
            setActiveView('CycleWorkspace');
          }}
          openChatbot={openChatbot}
        />
      );
      default: return <div className="flex items-center justify-center h-64 text-muted-text italic">Module "{activeView}" is under development.</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-page-bg">
      {/* Sidebar */}
      <aside className={cn(
        "bg-sidebar-bg border-r border-border flex flex-col flex-shrink-0 transition-all duration-300",
        isSidebarOpen ? "w-[168px]" : "w-[60px]"
      )}>
        <div className="p-4 border-b border-border mb-4 flex items-center justify-between">
          {isSidebarOpen && (
            <div>
              <img src="/scyne-logo.svg" alt="Scyne" className="h-[18px] w-auto" />
              <div className="flex items-center gap-1 mt-1">
                <div className="w-[1px] h-3 bg-border" />
                <span className="text-[11px] text-muted-text tracking-wide">Performance</span>
              </div>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-muted-text hover:text-primary-text">
            <Menu size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveView(item.name)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all relative group",
                activeView === item.name 
                  ? "text-primary-text font-semibold bg-[#EFEFEF]" 
                  : "text-[#52525B] hover:bg-[#EEEEEE]"
              )}
            >
              {activeView === item.name && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary-action" />
              )}
              <span className={cn("flex-shrink-0", activeView === item.name ? "text-primary-action" : "text-muted-text group-hover:text-primary-text")}>
                {item.icon}
              </span>
              {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {activeView !== 'CycleWorkspace' && activeView !== 'IndividualReviewWorkspace' && (
          <header className="h-[52px] bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] sm:text-[18px] font-semibold">{activeView}</h2>
                {activeView === 'Dashboard' && <Badge status="Active" />}
                {activeView === 'Reviews' && (
                  <div className="flex items-center bg-gray-100 rounded-[4px] p-0.5 ml-2">
                    <button 
                      onClick={() => setRoleMode('Direct')}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[2px] transition-all",
                        roleMode === 'Direct' ? "bg-white text-primary-action shadow-sm" : "text-muted-text hover:text-primary-text"
                      )}
                    >
                      Direct Manager
                    </button>
                    <button 
                      onClick={() => setRoleMode('Skip-Level')}
                      className={cn(
                        "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[2px] transition-all",
                        roleMode === 'Skip-Level' ? "bg-white text-primary-action shadow-sm" : "text-muted-text hover:text-primary-text"
                      )}
                    >
                      Skip-Level
                    </button>
                  </div>
                )}
              </div>
              <div className="hidden sm:block text-[12px] text-muted-text">
                Management / {activeView}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <button className="btn-primary flex items-center gap-2">
                <Plus size={14} />
                <span className="hidden sm:inline">Create New</span>
              </button>
            </div>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 bg-white p-4 sm:p-6 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Chatbot Overlay */}
      <AIChatbot 
        state={chatbot}
        onClose={() => setChatbot(prev => ({ ...prev, isOpen: false }))}
        onMinimize={() => setChatbot(prev => ({ ...prev, isMinimized: !prev.isMinimized }))}
        onMaximize={() => setChatbot(prev => ({ ...prev, isMaximized: !prev.isMaximized }))}
        onChipClick={handleChipClick}
        onSendMessage={handleSendMessage}
        onPositionChange={(pos) => setChatbot(prev => ({ ...prev, position: pos }))}
      />
    </div>
  );
}
