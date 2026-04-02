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
import { EMPLOYEES, COMPANY_GOALS, REVIEW_CYCLES, FEEDBACK } from './data/mockData';
import { Status } from './types';

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
  };

  const isPulse = status === 'In Progress';
  const isStatic = status === 'Completed' || status === 'Calibration';

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
    { label: 'Participants', color: '#3B4FD8', scores: [5, 2, 3, 4, 3] },
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

  const employeeColors = ["#3B4FD8", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#BE185D", "#0D9488"];

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
      case 'created': return '#3B4FD8';
      case 'self': return '#16A34A';
      case 'manager': return '#3B82F6';
      case 'peer': return '#14B8A6';
      case 'reminder': return '#D97706';
      case 'calibration': return '#7C3AED';
      default: return '#3B4FD8';
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
    { name: 'Esther Howard', role: 'Engineering Team Lead', type: 'Manager review', color: '#EEF2FF', text: '#3B4FD8' },
    { name: 'Jane Cooper', role: 'Software Engineer', type: 'Manager review', color: '#EEF2FF', text: '#3B4FD8' },
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

const MeritCyclesView = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const meritCycles = [
    { id: 1, name: 'FY 2025–26 Merit', linkedCycle: 'FY 2025–26 Year-End', budget: '$280,000', allocated: '$196,000', remaining: '$84,000', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold">Merit Cycles</h3>
        <button className="btn-primary">+ Create Merit Cycle</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-header">#</th>
              <th className="table-header">Cycle Name</th>
              <th className="table-header">Linked Review Cycle</th>
              <th className="table-header">Budget</th>
              <th className="table-header">Allocated</th>
              <th className="table-header">Remaining</th>
              <th className="table-header">Status</th>
              <th className="table-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {meritCycles.map((cycle) => (
              <tr key={cycle.id} className="hover:bg-gray-50 transition-colors">
                <td className="table-cell text-muted-text">{cycle.id}</td>
                <td className="table-cell font-medium">
                  <button onClick={() => setActiveView('MeritCycleDetail')} className="text-primary-action hover:underline">
                    {cycle.name}
                  </button>
                </td>
                <td className="table-cell text-muted-text">{cycle.linkedCycle}</td>
                <td className="table-cell font-bold">{cycle.budget}</td>
                <td className="table-cell text-green-600 font-bold">{cycle.allocated}</td>
                <td className="table-cell text-muted-text">{cycle.remaining}</td>
                <td className="table-cell"><Badge status={cycle.status} /></td>
                <td className="table-cell"><MoreVertical size={14} className="text-muted-text cursor-pointer" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MeritCycleDetailView = ({ onBack }: { onBack: () => void }) => {
  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  const managers = [
    { name: 'Alex Reid', teamSize: 8, budget: '$64,000', recommended: '$58,000', actual: '$61,500', status: 'Submitted' },
    { name: 'Priya B', teamSize: 6, budget: '$48,000', recommended: '$42,000', actual: '$49,200', status: 'Over Budget' },
    { name: 'Nik Maniya', teamSize: 5, budget: '$40,000', recommended: '$35,000', actual: '$32,000', status: 'In Progress' },
  ];

  const teamMembers = [
    { name: 'Sarah Chen', rating: 'Strong', salary: '$95,000', compa: '0.94', recommended: '5%', proposed: '6%', amount: '$5,700', status: 'Submitted' },
    { name: 'Ben Scyne', rating: 'Strong', salary: '$110,000', compa: '1.08', recommended: '5%', proposed: '5%', amount: '$5,500', status: 'Submitted' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-text text-[12px]">
        <button onClick={onBack} className="hover:text-primary-text">Merit Cycles</button>
        <ChevronRight size={12} />
        <span className="text-primary-text font-medium">FY 2025–26 Merit</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: '$280,000' },
          { label: 'Allocated', value: '$196,000', color: 'text-green-600' },
          { label: 'Remaining', value: '$84,000' },
          { label: 'Managers Done', value: '6 / 9' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <p className="text-[11px] text-muted-text uppercase font-bold tracking-tight">{stat.label}</p>
            <p className={cn("text-[20px] font-bold mt-1", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-indigo-600 rounded-[4px] p-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-[16px] font-bold">Merit Guidelines — Active</h3>
                <button className="text-[11px] underline opacity-80 hover:opacity-100">Edit Guidelines</button>
              </div>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: 'Exceptional', range: '8–12%' },
                  { label: 'Strong', range: '4–7%' },
                  { label: 'Meets', range: '1–3%' },
                  { label: 'Needs Imp.', range: '0%' },
                  { label: 'Unsatisfactory', range: '0%' },
                ].map((g, i) => (
                  <div key={i} className="bg-white/10 rounded p-2 border border-white/20">
                    <p className="text-[10px] font-bold uppercase opacity-80">{g.label}</p>
                    <p className="text-[14px] font-bold">{g.range}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Manager</th>
                  <th className="table-header">Team Size</th>
                  <th className="table-header">Budget Allocated</th>
                  <th className="table-header">Recommended Spend</th>
                  <th className="table-header">Actual Spend</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((mgr) => (
                  <React.Fragment key={mgr.name}>
                    <tr 
                      className={cn(
                        "hover:bg-gray-50 transition-colors cursor-pointer",
                        expandedManager === mgr.name && "bg-indigo-50/30"
                      )}
                      onClick={() => setExpandedManager(expandedManager === mgr.name ? null : mgr.name)}
                    >
                      <td className="table-cell font-medium flex items-center gap-2">
                        <ChevronRight size={14} className={cn("transition-transform", expandedManager === mgr.name && "rotate-90")} />
                        {mgr.name}
                      </td>
                      <td className="table-cell text-muted-text">{mgr.teamSize}</td>
                      <td className="table-cell font-bold">{mgr.budget}</td>
                      <td className="table-cell text-muted-text">{mgr.recommended}</td>
                      <td className={cn("table-cell font-bold", mgr.status === 'Over Budget' && "text-red-600")}>
                        {mgr.actual}
                        {mgr.status === 'Over Budget' && <span className="ml-2 text-[10px] uppercase">⚠️ Over Budget</span>}
                      </td>
                      <td className="table-cell"><Badge status={mgr.status} /></td>
                      <td className="table-cell">
                        <button className="btn-primary py-1 px-2 text-[11px]">Submit for Approval</button>
                      </td>
                    </tr>
                    {expandedManager === mgr.name && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-gray-50/50">
                          <div className="p-4 border-b border-border">
                            <table className="w-full border-collapse bg-white rounded border border-border shadow-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="table-header py-1.5">Employee</th>
                                  <th className="table-header py-1.5">Rating</th>
                                  <th className="table-header py-1.5">Current Salary</th>
                                  <th className="table-header py-1.5">Compa-Ratio</th>
                                  <th className="table-header py-1.5">Recommended %</th>
                                  <th className="table-header py-1.5">Proposed %</th>
                                  <th className="table-header py-1.5">Proposed Amount</th>
                                  <th className="table-header py-1.5">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teamMembers.map((emp) => (
                                  <tr key={emp.name}>
                                    <td className="table-cell py-1.5 font-medium">{emp.name}</td>
                                    <td className="table-cell py-1.5"><Badge status={emp.rating} /></td>
                                    <td className="table-cell py-1.5 text-muted-text">{emp.salary}</td>
                                    <td className="table-cell py-1.5">
                                      <span className={cn(
                                        "font-bold",
                                        parseFloat(emp.compa) > 1.1 ? "text-amber-600" : "text-muted-text"
                                      )}>
                                        {emp.compa}
                                      </span>
                                    </td>
                                    <td className="table-cell py-1.5 text-muted-text">{emp.recommended}</td>
                                    <td className="table-cell py-1.5">
                                      <input type="text" defaultValue={emp.proposed} className="w-16 border border-border rounded px-2 py-0.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                                    </td>
                                    <td className="table-cell py-1.5 font-bold text-primary-action">{emp.amount}</td>
                                    <td className="table-cell py-1.5"><Badge status={emp.status} /></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="card space-y-4">
            <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Approval Chain</h4>
            <div className="space-y-6 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100" />
              {[
                { label: 'Manager submits', status: 'Done', name: 'Alex Reid', date: '02 Apr 2026' },
                { label: 'HRBP Review', status: 'Pending', name: 'Priya B' },
                { label: 'CFO Approval', status: 'Locked' },
                { label: 'Sync to Payroll', status: 'Locked' },
              ].map((step, i) => (
                <div key={i} className="relative flex gap-4 pl-6">
                  <div className={cn(
                    "absolute left-0 top-1 w-4 h-4 rounded-full border-2 z-10",
                    step.status === 'Done' ? "bg-green-500 border-green-500" : 
                    step.status === 'Pending' ? "bg-white border-amber-500" : "bg-white border-gray-200"
                  )}>
                    {step.status === 'Done' && <CheckCircle2 size={10} className="text-white mx-auto mt-0.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-bold leading-none">{step.label}</p>
                    {step.name && <p className="text-[11px] text-muted-text">{step.name} {step.date && `• ${step.date}`}</p>}
                    {step.status === 'Pending' && <span className="text-[10px] font-bold text-amber-600 uppercase">⏳ Pending</span>}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary w-full py-2 disabled:opacity-50" disabled>Sync to Payroll</button>
          </div>
        </div>
      </div>
    </div>
  );
};
const FeedbackView = () => {
  const [activeTab, setActiveTab] = useState('Give Feedback');
  const [feedbackType, setFeedbackType] = useState('Recognition');
  const [visibility, setVisibility] = useState('Visible to Employee');

  const receivedFeedback = [
    { id: 1, type: 'Recognition', from: 'Alex Reid', date: '15 Mar 2026', text: 'Sarah showed exceptional leadership during the mobile launch. Her ability to coordinate across engineering and design was outstanding.', icon: '🏆' },
    { id: 2, type: 'Constructive', from: 'Anonymous Peer', date: '10 Mar 2026', text: 'Consider providing more frequent updates on project status to the wider stakeholder group.', icon: '🔧' },
    { id: 3, type: 'General', from: 'Nik Maniya', date: '05 Mar 2026', text: 'Great job on the Q1 planning session. The data you provided was very helpful.', icon: '💬' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['Give Feedback', 'Received', 'Sent', 'Requests'].map((tab) => (
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
              <motion.div layoutId="activeTabFeedback" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Give Feedback' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Feedback Requests</h3>
            <div className="card-review flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">AR</div>
                <div>
                  <p className="font-bold text-[13px]">Alex Reid requested feedback from you</p>
                  <p className="text-[11px] text-muted-text">Due by Apr 15, 2026</p>
                </div>
              </div>
              <button className="btn-primary py-1">Give Feedback Now →</button>
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
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['All Types', 'Recognition', 'Constructive', 'General'].map(f => (
                <button key={f} className="px-3 py-1 rounded-full border border-border text-[11px] font-medium hover:bg-gray-50">{f}</button>
              ))}
            </div>
            <button className="btn-outline py-1 flex items-center gap-2">
              <Filter size={14} />
              Filter
            </button>
          </div>

          <div className="space-y-3">
            {receivedFeedback.map((f) => (
              <div key={f.id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{f.icon}</span>
                    <span className="text-[12px] font-bold text-indigo-700">{f.type}</span>
                    <span className="text-muted-text">•</span>
                    <span className="text-[12px] font-medium">From: {f.from}</span>
                  </div>
                  <span className="text-[11px] text-muted-text">{f.date}</span>
                </div>
                <p className="text-[13px] leading-relaxed mb-4 italic">"{f.text}"</p>
                <div className="flex justify-end gap-3">
                  <button className="text-[11px] font-bold text-primary-action hover:underline">Reply</button>
                  <button className="text-[11px] font-bold text-muted-text hover:underline">Archive</button>
                </div>
              </div>
            ))}
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
            <span>Company Goals</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Goals On Track', value: '8/12', trend: '+2', view: 'Company Goals' },
          { label: 'Reviews Pending', value: '3', trend: '-1', view: 'Reviews' },
          { label: 'Feedback Given', value: '14', trend: '+5', view: 'Feedback' },
          { label: 'Team Avg Score', value: '4.1/5', trend: '+0.2', view: 'Analytics' },
          { label: 'Alignment Complete', value: '68%', trend: '+12%', view: 'Company Goals' },
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
            <button onClick={() => setActiveView('People')} className="text-primary-action text-[12px] font-medium hover:underline">View Team</button>
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
                { label: 'Q1 Goal Alignment', days: 3, icon: <Target size={14} />, urgent: true, action: () => setActiveView('Company Goals') },
                { label: 'Team Calibration', days: 22, icon: <Users size={14} />, action: () => setActiveView('Talent Review') },
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

const CompanyGoalsView = ({ setActiveView }: { setActiveView: (view: string) => void }) => {
  const [activeTab, setActiveTab] = useState('All Goals');

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['All Goals', 'By Strategic Pillar', 'OKR Tree View'].map((tab) => (
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
          Create Company Goal
        </button>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="table-header w-12 text-center">#</th>
              <th className="table-header">Goal Title</th>
              <th className="table-header">Strategic Pillar</th>
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
                  onClick={() => setActiveView('GoalDetail')}
                >
                  {goal.title}
                </td>
                <td className="table-cell">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium">
                    {goal.pillar}
                  </span>
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
    </div>
  );
};

const PeopleDirectory = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={14} />
            <input 
              type="text" 
              placeholder="Search people..." 
              className="pl-9 pr-4 py-1.5 border border-border rounded-[4px] text-[13px] w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary-action"
            />
          </div>
          <button className="btn-outline">Department</button>
          <button className="btn-outline">Manager</button>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-[4px]">
          <button className="p-1.5 rounded bg-white shadow-sm text-primary-action"><LayoutDashboard size={14} /></button>
          <button className="p-1.5 rounded text-muted-text hover:text-primary-text"><Menu size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {EMPLOYEES.map((employee) => (
          <div key={employee.id} className="card hover:border-primary-action transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[16px] font-bold">
                {employee.avatar}
              </div>
              <Badge status={employee.alignment} />
            </div>
            <h4 className="font-bold text-[15px] group-hover:text-primary-action transition-colors">{employee.name}</h4>
            <p className="text-[12px] text-muted-text mb-4">{employee.role} • {employee.department}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <span className="text-[10px] text-muted-text uppercase block mb-1">Review Score</span>
                <span className="font-bold text-[14px]">{employee.reviewScore}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-text uppercase block mb-1">Goals Done</span>
                <span className="font-bold text-[14px]">{employee.goalsDone}/{employee.totalGoals}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
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

const TalentReviewView = () => {
  const [activeTab, setActiveTab] = useState('Calibration Table');
  const [calGroup, setCalGroup] = useState('All Employees');
  const [groupByManager, setGroupByManager] = useState(false);
  const [showOutliersOnly, setShowOutliersOnly] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isDiscussionQueueOpen, setIsDiscussionQueueOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const [calibrationData, setCalibrationData] = useState([
    { id: 'row-1', name: 'Sarah Chen', role: 'Product Manager', dept: 'Product', avatarColor: '#3B4FD8', initials: 'SC', position: 'star', positionLabel: '⭐ STAR', systemScore: 4.08, systemLabel: 'Strong', mgrProposed: 'Strong', mgrScore: 4.0, consensus: 4.08, notes: '', status: 'Pending', locked: false, flagged: false, manager: 'Alex Reid' },
    { id: 'row-2', name: 'Nik Maniya', role: 'Product Lead', dept: 'Product', avatarColor: '#7C3AED', initials: 'NM', position: 'star', positionLabel: '⭐ STAR', systemScore: 4.6, systemLabel: 'Exceptional', mgrProposed: 'Exceptional', mgrScore: 5.0, consensus: 4.6, notes: '', status: 'Pending', locked: false, flagged: false, manager: 'Alex Reid' },
    { id: 'row-3', name: 'Yash Thakur', role: 'Sales Lead', dept: 'Sales', avatarColor: '#D97706', initials: 'YT', position: 'high-potential', positionLabel: 'HIGH POTENTIAL', systemScore: 3.8, systemLabel: 'Strong', mgrProposed: 'Exceptional', mgrScore: 4.6, consensus: null, notes: '', status: 'Pending', locked: false, flagged: false, manager: 'Alex Reid' },
    { id: 'row-4', name: 'Ben Scyne', role: 'Sr. Engineer', dept: 'Engineering', avatarColor: '#059669', initials: 'BS', position: 'core-player', positionLabel: 'CORE PLAYER', systemScore: 4.3, systemLabel: 'Strong', mgrProposed: 'Strong', mgrScore: 4.3, consensus: 4.3, notes: 'Consistent delivery, strong team player.', status: 'Agreed', locked: false, flagged: false, manager: 'Priya B' },
    { id: 'row-5', name: 'Divya G', role: 'Marketing Analyst', dept: 'Marketing', avatarColor: '#0891B2', initials: 'DG', position: 'core-player', positionLabel: 'CORE PLAYER', systemScore: 3.1, systemLabel: 'Meets', mgrProposed: 'Needs Improvement', mgrScore: 2.0, consensus: null, notes: '', status: 'Pending', locked: false, flagged: true, manager: 'Priya B' },
    { id: 'row-6', name: 'Darrell Steward', role: 'Product Designer', dept: 'Product', avatarColor: '#BE185D', initials: 'DS', position: 'solid', positionLabel: 'SOLID PERFORMER', systemScore: 3.5, systemLabel: 'Strong', mgrProposed: 'Strong', mgrScore: 3.5, consensus: 3.5, notes: 'Reliable output, improved significantly in Q3.', status: 'Agreed', locked: true, flagged: false, manager: 'HR Admin' },
    { id: 'row-7', name: 'Daniele Richards', role: 'Org Administrator', dept: 'Operations', avatarColor: '#DC2626', initials: 'DR', position: 'high-potential', positionLabel: 'HIGH POTENTIAL', systemScore: 4.2, systemLabel: 'Strong', mgrProposed: 'Exceptional', mgrScore: 4.8, consensus: null, notes: '', status: 'Pending', locked: false, flagged: false, manager: 'HR Admin' },
    { id: 'row-8', name: 'Christopher W-H', role: 'Branch Manager', dept: 'Operations', avatarColor: '#0D9488', initials: 'CW', position: 'key-player', positionLabel: 'KEY PLAYER', systemScore: 3.3, systemLabel: 'Meets', mgrProposed: 'Meets', mgrScore: 3.3, consensus: 3.3, notes: 'Steady performer. Consider stretch goal next cycle.', status: 'Agreed', locked: false, flagged: false, manager: 'Priya B' },
    { id: 'row-9', name: 'Devon Lane', role: 'Trust Administrator', dept: 'Operations', avatarColor: '#F59E0B', initials: 'DL', position: 'underperformer', positionLabel: 'UNDERPERFORMER', systemScore: 1.8, systemLabel: 'Needs Improvement', mgrProposed: 'Meets', mgrScore: 3.0, consensus: null, notes: '', status: 'Pending', locked: false, flagged: true, manager: 'HR Admin' },
    { id: 'row-10', name: 'Wade Warren', role: 'UX Researcher', dept: 'Product', avatarColor: '#6366F1', initials: 'WW', position: 'average', positionLabel: 'AVERAGE', systemScore: 3.0, systemLabel: 'Meets', mgrProposed: 'Meets', mgrScore: 3.0, consensus: 3.0, notes: 'Performance stable. Encourage goal ambition for next FY.', status: 'Agreed', locked: false, flagged: false, manager: 'Alex Reid' }
  ]);

  const nineBoxData = [
    { label: 'ENIGMA', color: 'bg-red-50' },
    { label: 'HIGH POTENTIAL', color: 'bg-amber-50' },
    { label: 'STAR ⭐', color: 'bg-indigo-100' },
    { label: 'DILEMMA', color: 'bg-red-50' },
    { label: 'KEY PLAYER', color: 'bg-gray-50' },
    { label: 'CORE PLAYER', color: 'bg-indigo-50' },
    { label: 'UNDERPERFORMER', color: 'bg-red-100' },
    { label: 'AVERAGE', color: 'bg-gray-100' },
    { label: 'SOLID PERFORMER', color: 'bg-green-50' },
  ];

  const scoreToLabel = (score: number) => {
    if (score >= 4.5) return 'Exceptional';
    if (score >= 3.5) return 'Strong';
    if (score >= 2.5) return 'Meets';
    if (score >= 1.5) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const groupStats: Record<string, { employees: number, avg: number, budget: string }> = {
    'Engineering — Senior': { employees: 8, avg: 4.2, budget: '$64,000' },
    'Sales — All Levels': { employees: 5, avg: 3.6, budget: '$40,000' },
    'Product — All Levels': { employees: 4, avg: 4.1, budget: '$36,000' },
    'Marketing — All Levels': { employees: 3, avg: 3.1, budget: '$24,000' },
  };

  const handleConsensusChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    setCalibrationData(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, consensus: isNaN(numValue) ? null : numValue };
        return { ...updatedRow, status: getUpdatedStatus(updatedRow) };
      }
      return row;
    }));
  };

  const handleNotesChange = (id: string, value: string) => {
    setCalibrationData(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, notes: value };
        return { ...updatedRow, status: getUpdatedStatus(updatedRow) };
      }
      return row;
    }));
  };

  const getUpdatedStatus = (row: any) => {
    if (row.locked) return 'Locked';
    if (row.consensus !== null && row.notes.trim() !== '') return 'Agreed';
    if (row.consensus !== null || row.notes.trim() !== '') return 'Under Review';
    return 'Pending';
  };

  const toggleLock = (id: string) => {
    setCalibrationData(prev => prev.map(row => {
      if (row.id === id) {
        const newLocked = !row.locked;
        return { ...row, locked: newLocked, status: newLocked ? 'Locked' : getUpdatedStatus({ ...row, locked: false }) };
      }
      return row;
    }));
  };

  const toggleFlag = (id: string) => {
    setCalibrationData(prev => prev.map(row => row.id === id ? { ...row, flagged: !row.flagged } : row));
  };

  const resetToSystem = (id: string) => {
    setCalibrationData(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, consensus: row.systemScore };
        return { ...updatedRow, status: getUpdatedStatus(updatedRow) };
      }
      return row;
    }));
  };

  const handleSort = (key: string) => {
    if (groupByManager) return;
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  const getVariance = (row: any) => {
    return (row.mgrScore - row.systemScore).toFixed(1);
  };

  const isOutlier = (row: any) => {
    return Math.abs(row.mgrScore - row.systemScore) > 1.5;
  };

  const filteredData = calibrationData
    .filter(row => {
      if (calGroup !== 'All Employees') {
        const groupDept = calGroup.split(' — ')[0];
        if (row.dept !== groupDept) return false;
      }
      if (showOutliersOnly && !isOutlier(row)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;
      const aVal = a[sortConfig.key as keyof typeof a] as number;
      const bVal = b[sortConfig.key as keyof typeof b] as number;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const flaggedCount = calibrationData.filter(r => r.flagged).length;
  const allConsensusFilled = calibrationData.every(r => r.consensus !== null);

  const managers = Array.from(new Set(filteredData.map(r => r.manager))) as string[];

  const handleFinalize = () => {
    setCalibrationData(prev => prev.map(row => ({ ...row, locked: true, status: 'Locked' })));
    setIsFinalizeModalOpen(false);
  };

  const viewIn9Box = (employeeName: string) => {
    setActiveTab('9-Box Grid');
    setTimeout(() => {
      const card = document.querySelector(`[data-employee="${employeeName}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('nine-box-highlight');
        setTimeout(() => card.classList.remove('nine-box-highlight'), 2200);
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center border-b border-border">
        {['9-Box Grid', 'Calibration Table', 'Succession Planning'].map((tab) => (
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
                layoutId="activeTabTalent"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" 
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === '9-Box Grid' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="btn-outline">Department</button>
              <button className="btn-outline">Manager</button>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-text uppercase font-medium">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-100 rounded-sm" /> High</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-gray-100 rounded-sm" /> Mid</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-100 rounded-sm" /> Low</div>
            </div>
          </div>

          <div className="relative pt-8 pl-8 overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Y Axis Label */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[11px] font-bold text-muted-text uppercase tracking-widest origin-center">
                Potential →
              </div>
              
              {/* X Axis Label */}
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[11px] font-bold text-muted-text uppercase tracking-widest">
                Performance →
              </div>

              <div className="grid grid-cols-3 grid-rows-3 gap-1 bg-border border border-border">
                {nineBoxData.map((box, i) => (
                  <div key={i} className={cn("min-h-[160px] p-2 flex flex-col gap-2", box.color)}>
                    <span className="text-[9px] font-bold text-muted-text uppercase text-center">{box.label}</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {EMPLOYEES.filter(e => e.nineBoxLabel === box.label).map(e => (
                        <div 
                          key={e.id} 
                          data-employee={e.name}
                          className="nine-box-card bg-white border border-border rounded-[2px] p-1.5 shadow-sm w-24 flex flex-col items-center text-center cursor-move hover:border-primary-action transition-all"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-bold mb-1">
                            {e.avatar}
                          </div>
                          <span className="text-[10px] font-bold truncate w-full">{e.name}</span>
                          <span className="text-[8px] text-muted-text truncate w-full">{e.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'Calibration Table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <button className="btn-outline">Department</button>
              <button className="btn-outline">Manager</button>
            </div>

            <div className="flex items-center gap-3">
              {flaggedCount > 0 && (
                <button 
                  onClick={() => setIsDiscussionQueueOpen(true)}
                  className="bg-[#FEF3C7] border border-[#FCD34D] text-[#D97706] text-[11px] font-bold px-3 py-1.5 rounded-[4px] flex items-center gap-1.5"
                >
                  <Flag size={12} /> Discussion Queue ({flaggedCount})
                </button>
              )}

              <div className="relative">
                <select 
                  className="cal-group-select"
                  value={calGroup}
                  onChange={(e) => setCalGroup(e.target.value)}
                >
                  <option>All Employees</option>
                  <option>Engineering — Senior</option>
                  <option>Engineering — Mid</option>
                  <option>Sales — All Levels</option>
                  <option>Product — All Levels</option>
                  <option>Marketing — All Levels</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={12} className="text-muted-text" />
                </div>
              </div>

              <div className="group relative">
                <div className="flex items-center gap-2 cursor-help">
                  <svg width="120" height="32" viewBox="0 0 120 32" className="rounded-[4px]">
                    <path d="M0 30 Q30 30 40 20 T60 5 T80 20 T120 30" fill="rgba(245,158,11,0.05)" stroke="#F59E0B" strokeWidth="1.5" clipPath="inset(0 80 0 0)" />
                    <path d="M0 30 Q30 30 40 20 T60 5 T80 20 T120 30" fill="rgba(16,185,129,0.05)" stroke="#10B981" strokeWidth="1.5" clipPath="inset(0 40 0 40)" />
                    <path d="M0 30 Q30 30 40 20 T60 5 T80 20 T120 30" fill="rgba(59,79,216,0.05)" stroke="#3B4FD8" strokeWidth="1.5" clipPath="inset(0 0 0 80)" />
                  </svg>
                </div>
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50">
                  <div className="bg-white border border-border rounded-[4px] shadow-lg p-3 w-[200px] space-y-2">
                    <p className="text-[12px] font-bold">Score Distribution — Current View</p>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-[#F59E0B]"><span>Below expectations</span><span>9% ↓2%</span></div>
                      <div className="flex justify-between text-[#10B981]"><span>Meets expectations</span><span>81% ↑2%</span></div>
                      <div className="flex justify-between text-[#3B4FD8]"><span>Exceeds expectations</span><span>10% ↑8%</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#52525B] font-medium">Group by Manager</span>
                <button 
                  onClick={() => setGroupByManager(!groupByManager)}
                  className={cn(
                    "w-8 h-[18px] rounded-full relative transition-colors",
                    groupByManager ? "bg-primary-action" : "bg-[#D4D4D8]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform",
                    groupByManager ? "translate-x-[15px]" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#52525B] font-medium">Outliers only</span>
                <button 
                  onClick={() => setShowOutliersOnly(!showOutliersOnly)}
                  className={cn(
                    "w-8 h-[18px] rounded-full relative transition-colors",
                    showOutliersOnly ? "bg-primary-action" : "bg-[#D4D4D8]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform",
                    showOutliersOnly ? "translate-x-[15px]" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              <button 
                onClick={() => setIsFinalizeModalOpen(true)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] text-[12px] font-medium transition-all",
                  allConsensusFilled ? "bg-primary-action text-white cursor-pointer" : "bg-[#A5B4FC] text-white opacity-70 cursor-not-allowed"
                )}
              >
                <Lock size={12} /> Finalize Calibration
              </button>
            </div>
          </div>

          {calGroup !== 'All Employees' && groupStats[calGroup] && (
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-[4px] px-3 py-1.5 text-[11px] text-primary-action font-medium">
              Group: {calGroup} · {groupStats[calGroup].employees} employees · Avg Score: {groupStats[calGroup].avg} · Budget Pool: {groupStats[calGroup].budget}
            </div>
          )}

          <div className="bg-white border border-border rounded-[4px] overflow-hidden overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px]">
              <thead className="sticky top-0 z-10 bg-[#FAFAFA] border-b-2 border-border h-9">
                <tr>
                  <th className="table-header sticky left-0 bg-[#FAFAFA] z-20 border-r border-border min-w-[200px]">EMPLOYEE</th>
                  <th className="table-header min-w-[110px]">DEPARTMENT</th>
                  <th className="table-header min-w-[150px]">9-BOX POSITION</th>
                  <th className="table-header min-w-[120px] cursor-pointer group" onClick={() => handleSort('systemScore')}>
                    <div className="flex items-center gap-1">
                      SYSTEM SCORE
                      <ChevronsUpDown size={10} className={cn("transition-colors", sortConfig.key === 'systemScore' ? "text-primary-action" : "text-[#D4D4D8]")} />
                    </div>
                  </th>
                  <th className="table-header min-w-[140px] cursor-pointer group" onClick={() => handleSort('mgrScore')}>
                    <div className="flex items-center gap-1">
                      MGR PROPOSED
                      <ChevronsUpDown size={10} className={cn("transition-colors", sortConfig.key === 'mgrScore' ? "text-primary-action" : "text-[#D4D4D8]")} />
                    </div>
                  </th>
                  <th className="table-header min-w-[130px] cursor-pointer group" onClick={() => handleSort('consensus')}>
                    <div className="flex items-center gap-1">
                      CONSENSUS
                      <ChevronsUpDown size={10} className={cn("transition-colors", sortConfig.key === 'consensus' ? "text-primary-action" : "text-[#D4D4D8]")} />
                    </div>
                  </th>
                  <th className="table-header min-w-[80px] text-center cursor-pointer group" onClick={() => handleSort('variance')}>
                    <div className="flex items-center justify-center gap-1">
                      VAR
                      <ChevronsUpDown size={10} className={cn("transition-colors", sortConfig.key === 'variance' ? "text-primary-action" : "text-[#D4D4D8]")} />
                    </div>
                  </th>
                  <th className="table-header flex-grow min-w-[180px]">NOTES</th>
                  <th className="table-header min-w-[100px]">STATUS</th>
                  <th className="table-header w-12 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {groupByManager ? (
                  managers.map(manager => (
                    <React.Fragment key={manager}>
                      <tr 
                        className="bg-[#F4F4F5] border-b border-border h-10 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, [manager]: !prev[manager] }))}
                      >
                        <td colSpan={10} className="px-3">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              {collapsedGroups[manager] ? <ChevronRight size={14} className="text-[#52525B]" /> : <ChevronDown size={14} className="text-[#52525B]" />}
                              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold">{manager.split(' ').map(n => n[0]).join('')}</div>
                              <span className="text-[13px] font-bold text-[#18181B]">{manager}</span>
                              <span className="bg-[#E4E4E7] text-[#52525B] text-[11px] font-bold px-1.5 py-0.5 rounded-[4px]">{filteredData.filter(r => r.manager === manager).length} reports</span>
                              <span className="bg-[#EEF2FF] text-primary-action text-[11px] font-bold px-1.5 py-0.5 rounded-[4px]">Team avg: {(filteredData.filter(r => r.manager === manager).reduce((acc, curr) => acc + (curr.consensus || curr.systemScore), 0) / filteredData.filter(r => r.manager === manager).length).toFixed(2)}</span>
                            </div>
                            {filteredData.filter(r => r.manager === manager).every(r => labelToScore[r.mgrProposed] >= 4) && (
                              <div className="flex items-center gap-1.5 text-[#D97706] text-[11px] font-bold" title="This manager rated all direct reports above expectations">
                                <AlertTriangle size={12} /> Possible rating inflation
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      {!collapsedGroups[manager] && filteredData.filter(r => r.manager === manager).map(row => (
                        <CalibrationRow 
                          key={row.id} 
                          row={row} 
                          onConsensusChange={handleConsensusChange}
                          onNotesChange={handleNotesChange}
                          toggleLock={toggleLock}
                          toggleFlag={toggleFlag}
                          resetToSystem={resetToSystem}
                          viewIn9Box={viewIn9Box}
                          scoreToLabel={scoreToLabel}
                          getVariance={getVariance}
                          isOutlier={isOutlier}
                        />
                      ))}
                    </React.Fragment>
                  ))
                ) : (
                  filteredData.map(row => (
                    <CalibrationRow 
                      key={row.id} 
                      row={row} 
                      onConsensusChange={handleConsensusChange}
                      onNotesChange={handleNotesChange}
                      toggleLock={toggleLock}
                      toggleFlag={toggleFlag}
                      resetToSystem={resetToSystem}
                      viewIn9Box={viewIn9Box}
                      scoreToLabel={scoreToLabel}
                      getVariance={getVariance}
                      isOutlier={isOutlier}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Discussion Queue Drawer */}
      <AnimatePresence>
        {isDiscussionQueueOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDiscussionQueueOpen(false)}
              className="fixed inset-0 bg-black/20 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[280px] bg-white shadow-xl z-[110] flex flex-col border-l border-border"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-[#18181B]">🚩 Discussion Queue</span>
                  <span className="bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold px-1.5 py-0.5 rounded-full">{flaggedCount}</span>
                </div>
                <button onClick={() => setIsDiscussionQueueOpen(false)} className="text-muted-text hover:text-primary-text">
                  <X size={14} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {calibrationData.filter(r => r.flagged).map(row => (
                  <div key={row.id} className="bg-white border border-border rounded-[4px] p-3 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: row.avatarColor }}>{row.initials}</div>
                      <div>
                        <p className="text-[13px] font-bold text-[#18181B] leading-none">{row.name}</p>
                        <p className="text-[11px] text-muted-text mt-1">{row.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[11px] font-bold", parseFloat(getVariance(row)) > 0 ? "text-[#D97706]" : "text-primary-action")}>
                        Variance: {parseFloat(getVariance(row)) > 0 ? '+' : ''}{getVariance(row)}
                      </span>
                      <Badge status={row.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-text">Consensus:</span>
                      <input 
                        type="number" 
                        className="w-[60px] h-7 border border-border rounded-[4px] text-[12px] text-center font-bold focus:ring-1 focus:ring-primary-action outline-none"
                        value={row.consensus || ''}
                        onChange={(e) => handleConsensusChange(row.id, e.target.value)}
                      />
                    </div>
                    <textarea 
                      className="w-full border border-border rounded-[4px] p-2 text-[11px] focus:ring-1 focus:ring-primary-action outline-none resize-none"
                      rows={2}
                      placeholder="Add calibration note..."
                      value={row.notes}
                      onChange={(e) => handleNotesChange(row.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-border">
                <button 
                  onClick={() => {
                    setCalibrationData(prev => prev.map(r => r.flagged ? { ...r, flagged: false, status: 'Agreed' } : r));
                    setIsDiscussionQueueOpen(false);
                  }}
                  className="w-full border border-primary-action text-primary-action text-[12px] font-bold py-2 rounded-[4px] hover:bg-indigo-50 transition-colors"
                >
                  Mark all as Agreed
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Finalize Modal */}
      <AnimatePresence>
        {isFinalizeModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-[1000]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinalizeModalOpen(false)}
              className="absolute inset-0 bg-black/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-[440px] p-6 relative z-10"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock size={20} className="text-primary-action" />
                <h3 className="text-[16px] font-bold text-[#18181B]">Finalize Calibration</h3>
              </div>

              <p className="text-[13px] text-[#52525B] mb-4">
                You are about to finalize calibration for {calibrationData.length} employees. This will lock all consensus scores and notify managers.
              </p>

              {!allConsensusFilled ? (
                <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-[4px] p-3 space-y-2">
                  <div className="flex items-center gap-2 text-[#D97706] text-[12px] font-bold">
                    <AlertTriangle size={14} />
                    {calibrationData.filter(r => r.consensus === null).length} employees are missing consensus scores — complete these before finalizing.
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-muted-text pl-1">
                    {calibrationData.filter(r => r.consensus === null).slice(0, 5).map(r => (
                      <li key={r.id}>{r.name}</li>
                    ))}
                    {calibrationData.filter(r => r.consensus === null).length > 5 && (
                      <li>+ {calibrationData.filter(r => r.consensus === null).length - 5} more</li>
                    )}
                  </ul>
                </div>
              ) : (
                <div className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-[4px] p-3 flex items-center gap-2 text-[#16A34A] text-[12px] font-bold">
                  <CheckCircle2 size={14} />
                  All {calibrationData.length} employees have consensus scores ✅
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => setIsFinalizeModalOpen(false)} className="btn-outline text-[13px] px-4">Cancel</button>
                <button 
                  onClick={handleFinalize}
                  disabled={!allConsensusFilled}
                  className={cn(
                    "btn-primary text-[13px] px-4 flex items-center gap-1.5",
                    !allConsensusFilled && "bg-[#A5B4FC] cursor-not-allowed"
                  )}
                >
                  Finalize & Lock 🔒
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CalibrationRow = ({ 
  row, 
  onConsensusChange, 
  onNotesChange, 
  toggleLock, 
  toggleFlag, 
  resetToSystem, 
  viewIn9Box,
  scoreToLabel,
  getVariance,
  isOutlier
}: any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleBlur = () => {
    setSaveStatus('Saved ✓');
    setTimeout(() => setSaveStatus(null), 1500);
  };

  const variance = parseFloat(getVariance(row));
  const outlier = isOutlier(row);

  return (
    <tr 
      className={cn(
        "cal-row border-b border-[#F4F4F5] h-12 transition-all",
        outlier && "bg-[#FFFBEB] border-l-[3px] border-l-[#F59E0B]",
        row.locked && "bg-[#FAFAFA]"
      )}
      style={outlier ? { boxShadow: 'inset 3px 0 0 #F59E0B' } : {}}
    >
      <td className="sticky left-0 bg-inherit z-5 border-r border-border px-3">
        <div className="flex items-center gap-2.5">
          {row.flagged && <span className="text-[#F59E0B] text-[11px]">🚩</span>}
          {row.locked && <Lock size={10} className="text-[#9CA3AF]" />}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ backgroundColor: row.avatarColor }}>
            {row.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-[#18181B] truncate hover:text-primary-action cursor-pointer" onClick={() => viewIn9Box(row.name)}>{row.name}</p>
            <p className="text-[11px] text-[#71717A] truncate">{row.role}</p>
          </div>
        </div>
      </td>
      <td className="px-3 text-[12px] text-[#52525B]">{row.dept}</td>
      <td className="px-3">
        <span className={cn("cal-position-badge", `cal-position--${row.position}`)}>
          {row.positionLabel}
        </span>
      </td>
      <td className="px-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-[#18181B]">{row.systemScore}</span>
          <Badge status={row.systemLabel} />
        </div>
      </td>
      <td className="px-3">
        <div className="flex items-center gap-1.5">
          <Badge status={row.mgrProposed} />
          {row.mgrProposed === row.systemLabel ? (
            <CheckCircle2 size={12} className="text-[#16A34A]" title="Matches system score" />
          ) : Math.abs(labelToScore[row.mgrProposed] - labelToScore[row.systemLabel]) === 1 ? (
            <AlertTriangle size={12} className="text-[#D97706]" title="Minor variance" />
          ) : (
            <AlertOctagon size={12} className="text-[#DC2626]" title="Large variance — review recommended" />
          )}
        </div>
      </td>
      <td className="px-3 py-1.5">
        <div className="flex flex-col items-center">
          <input 
            type="number" 
            className={cn(
              "cal-consensus-input",
              row.locked && "bg-[#F9FAFB] text-[#9CA3AF] border-solid cursor-not-allowed"
            )}
            min="1" max="5" step="0.1"
            value={row.consensus || ''}
            placeholder="—"
            onChange={(e) => onConsensusChange(row.id, e.target.value)}
            onBlur={handleBlur}
            disabled={row.locked}
          />
          <span className={cn(
            "text-[10px] italic mt-0.5",
            saveStatus ? "text-[#16A34A] font-bold" : "text-[#9CA3AF]"
          )}>
            {saveStatus || (row.consensus ? `→ ${scoreToLabel(row.consensus)}` : '')}
          </span>
        </div>
      </td>
      <td className="px-3 text-center">
        <span className={cn(
          "text-[13px]",
          variance > 1.5 || variance < -1.5 ? "text-[#DC2626] font-bold" :
          variance > 0 ? "text-[#D97706]" :
          variance < 0 ? "text-primary-action" : "text-[#16A34A]"
        )}>
          {variance > 0 ? '+' : ''}{variance.toFixed(1)}
        </span>
      </td>
      <td className="px-3 py-1.5">
        <textarea 
          className={cn(
            "cal-notes-input",
            row.locked && "bg-[#F9FAFB] text-[#9CA3AF] border-solid cursor-not-allowed"
          )}
          rows={1}
          placeholder="Add calibration note..."
          value={row.notes}
          onChange={(e) => onNotesChange(row.id, e.target.value)}
          onBlur={handleBlur}
          disabled={row.locked}
          onInput={(e: any) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 58) + 'px';
          }}
        />
      </td>
      <td className="px-3"><Badge status={row.status} /></td>
      <td className="px-2 text-center relative">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 rounded-[4px] text-[#9CA3AF] hover:bg-[#F4F4F5] hover:text-[#52525B] transition-colors"
        >
          <MoreVertical size={14} />
        </button>
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setIsMenuOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-1 bg-white border border-border rounded-[4px] shadow-lg min-w-[160px] z-[100] overflow-hidden"
              >
                {!row.locked ? (
                  <>
                    <button onClick={() => { toggleLock(row.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#18181B]"><Lock size={12} /> Lock this row</button>
                    <button onClick={() => { resetToSystem(row.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#18181B]"><RotateCcw size={12} /> Reset to system score</button>
                    <button onClick={() => { viewIn9Box(row.name); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-primary-action font-medium"><Grid size={12} /> View in 9-Box</button>
                    <button onClick={() => { toggleFlag(row.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#F59E0B] font-medium"><Flag size={12} /> Flag for discussion</button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#18181B]"><User size={12} /> View full profile</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { toggleLock(row.id); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#18181B]"><Unlock size={12} /> Unlock this row</button>
                    <button onClick={() => { viewIn9Box(row.name); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-primary-action font-medium"><Grid size={12} /> View in 9-Box</button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#F4F4F5] text-[#18181B]"><User size={12} /> View full profile</button>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </td>
    </tr>
  );
};

const MyGoalsView = () => {
  const [activeTab, setActiveTab] = useState('My Goals');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
              <motion.div 
                layoutId="activeTabMyGoals"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" 
              />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-[4px] p-3 flex items-center gap-3 text-amber-800">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="text-[12px] font-medium">Your goals are pending manager approval. Reviews will unlock once approved.</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn-outline">Time Period</button>
            <button className="btn-outline">Status</button>
          </div>
          <button onClick={() => setIsDrawerOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            Add Goal
          </button>
        </div>

        <div className="card p-0 overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="table-header w-12 text-center">#</th>
                <th className="table-header">Goal Title</th>
                <th className="table-header">Aligned To</th>
                <th className="table-header">Weight %</th>
                <th className="table-header">Progress</th>
                <th className="table-header">Last Check-In</th>
                <th className="table-header">Status</th>
                <th className="table-header w-12"></th>
              </tr>
            </thead>
            <tbody>
              {COMPANY_GOALS.slice(0, 4).map((goal, i) => (
                <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-center text-muted-text">{i + 1}</td>
                  <td className="table-cell font-medium">{goal.title}</td>
                  <td className="table-cell text-primary-action cursor-pointer hover:underline">Company Goal #{i + 1}</td>
                  <td className="table-cell">25%</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <ProgressBar progress={goal.progress} />
                      <span className="text-[11px] font-medium">{goal.progress}%</span>
                    </div>
                  </td>
                  <td className="table-cell text-muted-text">Mar 28, 2026 🟢</td>
                  <td className="table-cell"><Badge status="Pending Approval" /></td>
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
      </div>

      {/* Goal Creation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-[16px]">Create New Goal</h3>
                <button onClick={() => setIsDrawerOpen(false)} className="text-muted-text hover:text-primary-text">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">Step 1 of 3 — Alignment</span>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium">Select Company Goal</label>
                      <select className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action">
                        <option>Grow ARR to $50M by EOY</option>
                        <option>Achieve NPS &gt; 65</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium">Goal Title</label>
                    <input type="text" placeholder="e.g. Launch new API documentation" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-medium">Description</label>
                    <textarea rows={3} className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium">Weight %</label>
                      <input type="number" defaultValue={25} className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium">Due Date</label>
                      <input type="date" className="w-full border border-border rounded-[4px] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-primary-action" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex items-center gap-3">
                <button onClick={() => setIsDrawerOpen(false)} className="btn-primary flex-1">Submit for Approval</button>
                <button onClick={() => setIsDrawerOpen(false)} className="btn-outline flex-1">Save as Draft</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const TeamGoalsView = () => {
  const [selectedMember, setSelectedMember] = useState(EMPLOYEES[0]);

  return (
    <div className="space-y-6">
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
        <div className="col-span-4 space-y-4">
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

        <div className="col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[14px]">{selectedMember.name}'s Goals</h3>
              <p className="text-[12px] text-muted-text">{selectedMember.role} • {selectedMember.department}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary bg-green-600 hover:bg-green-700">Approve All</button>
              <button className="btn-outline">Request Changes</button>
            </div>
          </div>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Goal Title</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {COMPANY_GOALS.slice(0, 3).map((goal) => (
                  <tr key={goal.id}>
                    <td className="table-cell font-medium">{goal.title}</td>
                    <td className="table-cell w-32">
                      <ProgressBar progress={goal.progress} />
                    </td>
                    <td className="table-cell"><Badge status="Pending Approval" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalyticsView = ({ openChatbot }: { openChatbot: (trigger: string) => void }) => {
  const data = [
    { name: 'Engineering', completion: 85, reviews: 70 },
    { name: 'Product', completion: 92, reviews: 88 },
    { name: 'Marketing', completion: 78, reviews: 65 },
    { name: 'Sales', completion: 60, reviews: 45 },
    { name: 'Operations', completion: 72, reviews: 60 },
  ];

  const trendData = [
    { name: 'Q1', score: 3.8 },
    { name: 'Q2', score: 3.9 },
    { name: 'Q3', score: 4.1 },
    { name: 'Q4', score: 4.2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button className="btn-outline">Department</button>
        <button className="btn-outline">Time Period</button>
        <div className="flex-1" />
        <button className="btn-outline flex items-center gap-2">
          <ArrowUpRight size={14} />
          Export Report
        </button>
        <button 
          onClick={() => openChatbot('ANALYTICS')}
          className="p-2 bg-indigo-50 text-indigo-600 rounded-[4px] hover:bg-indigo-100 transition-all border border-indigo-100"
        >
          <Sparkles size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-[14px]">Goal Completion Rate by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={11} width={80} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ fontSize: '12px', borderRadius: '4px' }} />
                <Bar dataKey="completion" fill="#3B4FD8" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-[14px]">Performance Distribution</h3>
          <div className="pt-4">
            <BellCurveChart />
          </div>
        </div>

        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-[14px]">Performance Trend (Overall)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} domain={[3, 5]} />
                <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '4px' }} />
                <Line type="monotone" dataKey="score" stroke="#3B4FD8" strokeWidth={2} dot={{ r: 4, fill: '#3B4FD8' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalDetailView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-text text-[12px]">
        <button onClick={onBack} className="hover:text-primary-text">Company Goals</button>
        <ChevronRight size={12} />
        <span className="text-primary-text font-medium">Grow ARR to $50M by EOY</span>
        <Badge status="Active" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Key Results', value: '4' },
          { label: 'Teams Aligned', value: '4' },
          { label: 'Individuals', value: '42' },
          { label: 'Overall Progress', value: '65%' },
        ].map((stat, i) => (
          <div key={i} className="card">
            <span className="text-[11px] text-muted-text uppercase tracking-tight">{stat.label}</span>
            <div className="text-[20px] font-bold mt-1">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card space-y-6">
        <div className="space-y-2">
          <h3 className="font-bold text-[16px]">Goal Description</h3>
          <p className="text-muted-text leading-relaxed">
            Our primary objective for 2025 is to scale our Annual Recurring Revenue to $50M. 
            This involves expanding into new markets, increasing upsell opportunities within our existing base, 
            and maintaining a churn rate below 5%.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-[14px]">Key Results</h3>
          <div className="card p-0 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">KR Title</th>
                  <th className="table-header">Target</th>
                  <th className="table-header">Current</th>
                  <th className="table-header">Progress</th>
                  <th className="table-header">Owner</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { title: 'New Logo ARR', target: '$15M', current: '$9.2M', progress: 61, owner: 'Alex Reid' },
                  { title: 'Expansion ARR', target: '$10M', current: '$7.5M', progress: 75, owner: 'Sarah Chen' },
                ].map((kr, i) => (
                  <tr key={i}>
                    <td className="table-cell font-medium">{kr.title}</td>
                    <td className="table-cell">{kr.target}</td>
                    <td className="table-cell">{kr.current}</td>
                    <td className="table-cell w-32">
                      <ProgressBar progress={kr.progress} />
                    </td>
                    <td className="table-cell text-muted-text">{kr.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            </tbody>
          </table>
        </div>
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
        {['Cycle Builder', 'Competencies', 'Form Builder', 'Automation Rules', 'Notification Rules', 'Role Permissions'].map((tab) => (
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
      </div>
    </div>
  );
};

const DevelopmentPlanView = ({ openChatbot }: { openChatbot: (trigger: string) => void }) => {
  const [activeTab, setActiveTab] = useState('My Plan');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-bold">Development Plan</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => openChatbot('DEV_PLAN')}
            className="btn-outline flex items-center gap-2 text-indigo-600 border-indigo-200 bg-indigo-50/50"
          >
            <Sparkles size={14} />
            AI Coach
          </button>
          <button className="btn-primary">+ Add Goal</button>
        </div>
      </div>

      <div className="flex items-center border-b border-border">
        {['My Plan', 'Team Plans', 'Resources'].map((tab) => (
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
              <motion.div layoutId="activeTabDev" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-action" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {[
            { title: 'Advanced Project Management', category: 'Skill', status: 'In Progress', progress: 65, deadline: 'Jun 2026' },
            { title: 'Public Speaking & Presentation', category: 'Soft Skill', status: 'Not Started', progress: 0, deadline: 'Aug 2026' },
            { title: 'Cloud Architecture Certification', category: 'Technical', status: 'Completed', progress: 100, deadline: 'Mar 2026' },
          ].map((goal, i) => (
            <div key={i} className="card-review">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text">{goal.category}</span>
                    <Badge status={goal.status} />
                  </div>
                  <h4 className="text-[15px] font-bold">{goal.title}</h4>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded text-muted-text"><MoreVertical size={14} /></button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-text uppercase">Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    className="h-full bg-primary-action"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1 text-[11px] text-muted-text font-medium">
                  <Calendar size={12} />
                  Target: {goal.deadline}
                </div>
                <button className="text-[12px] font-bold text-primary-action hover:underline">Update Progress</button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="card space-y-4">
            <h4 className="text-[12px] font-bold text-muted-text uppercase tracking-wider">Recommended Resources</h4>
            <div className="space-y-3">
              {[
                { title: 'Leadership Foundations', type: 'Course', duration: '4h 30m', platform: 'LinkedIn Learning' },
                { title: 'Effective Communication', type: 'Workshop', duration: '2h', platform: 'Internal' },
                { title: 'System Design Patterns', type: 'Book', duration: '12 chapters', platform: 'O\'Reilly' },
              ].map((res, i) => (
                <div key={i} className="p-3 rounded border border-border hover:border-primary-action cursor-pointer transition-all group">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gray-100 rounded text-muted-text">{res.type}</span>
                    <span className="text-[10px] text-muted-text">{res.platform}</span>
                  </div>
                  <h5 className="text-[13px] font-bold group-hover:text-primary-action transition-colors">{res.title}</h5>
                  <p className="text-[11px] text-muted-text mt-1">{res.duration}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-2 text-[12px] font-bold text-primary-action hover:underline">Explore All Resources</button>
          </div>

          <div className="card bg-indigo-50 border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700">
              <Sparkles size={16} />
              <h4 className="text-[13px] font-bold">AI Career Path Suggestion</h4>
            </div>
            <p className="text-[12px] text-indigo-900 leading-relaxed">
              Based on your "Strong" rating in technical execution and interest in architecture, we recommend exploring the <b>Senior Architect</b> path.
            </p>
            <button className="w-full py-2 bg-indigo-600 text-white rounded-[4px] text-[12px] font-bold hover:bg-indigo-700 transition-all">View Path Details</button>
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
                        <span className="text-[10px] font-bold uppercase tracking-wider">PerfoPulse AI</span>
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
                placeholder="Ask PerfoPulse AI anything..."
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

export default function App() {
  console.log('App rendering...');
  const [activeView, setActiveView] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [roleMode, setRoleMode] = useState<'Direct' | 'Skip-Level'>('Direct');
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedEmployeeReview, setSelectedEmployeeReview] = useState<string | null>(null);

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
    { name: 'Company Goals', icon: <Building2 size={14} /> },
    { name: 'My Goals', icon: <Target size={14} /> },
    { name: 'Team Goals', icon: <Users size={14} /> },
    { name: 'Reviews', icon: <ClipboardList size={14} /> },
    { name: 'Feedback', icon: <MessageSquare size={14} /> },
    { name: 'Talent Review', icon: <Trophy size={14} /> },
    { name: 'Merit Cycles', icon: <BarChart3 size={14} /> },
    { name: 'Development Plan', icon: <TrendingUp size={14} /> },
    { name: 'People', icon: <Users size={14} /> },
    { name: 'Analytics', icon: <BarChart3 size={14} /> },
    { name: 'Admin', icon: <Settings size={14} /> },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard setActiveView={setActiveView} />;
      case 'Company Goals': return <CompanyGoalsView setActiveView={setActiveView} />;
      case 'People': return <PeopleDirectory />;
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
      case 'Merit Cycles': return <MeritCyclesView setActiveView={setActiveView} />;
      case 'MeritCycleDetail': return <MeritCycleDetailView onBack={() => setActiveView('Merit Cycles')} />;
      case 'SelfAssessment': return <SelfAssessmentView onBack={() => setActiveView('Reviews')} />;
      case 'ManagerReview': return <ManagerReviewView onBack={() => setActiveView('Reviews')} openChatbot={openChatbot} />;
      case 'ReviewResults': return <ReviewResultsView onBack={() => setActiveView('Reviews')} />;
      case 'Talent Review': return <TalentReviewView roleMode={roleMode} />;
      case 'Development Plan': return <DevelopmentPlanView openChatbot={openChatbot} />;
      case 'Analytics': return <AnalyticsView openChatbot={openChatbot} />;
      case 'My Goals': return <MyGoalsView />;
      case 'Team Goals': return <TeamGoalsView />;
      case 'Admin': return <AdminView />;
      case 'GoalDetail': return <GoalDetailView onBack={() => setActiveView('Company Goals')} />;
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
              <h1 className="text-[14px] font-bold text-primary-text leading-tight">PerfoPulse</h1>
              <div className="flex items-center gap-1">
                <div className="w-[1px] h-3 bg-border" />
                <span className="text-[11px] text-muted-text">People Bridge</span>
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
              <span className={cn(activeView === item.name ? "text-primary-action" : "text-muted-text group-hover:text-primary-text")}>
                {item.icon}
              </span>
              {isSidebarOpen && <span>{item.name}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border bg-indigo-50/30">
          <button 
            onClick={() => openChatbot('GENERAL')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-[13px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all",
              !isSidebarOpen && "justify-center px-0"
            )}
          >
            <Sparkles size={14} />
            {isSidebarOpen && <span>AI Assistant</span>}
          </button>
        </div>

        <div className="p-4 border-t border-border space-y-3">
          {isSidebarOpen ? (
            <>
              <button className="text-[12px] text-muted-text hover:text-primary-text block w-full text-left">Change Password</button>
              <button className="text-[12px] text-muted-text hover:text-primary-text block w-full text-left">My Profile</button>
              <button className="flex items-center gap-2 text-[12px] text-muted-text hover:text-primary-text w-full text-left">
                <LogOut size={12} />
                Log Out
              </button>
            </>
          ) : (
            <button className="text-muted-text hover:text-primary-text block w-full text-center">
              <LogOut size={16} className="mx-auto" />
            </button>
          )}
        </div>
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
                {(activeView === 'Reviews' || activeView === 'Talent Review') && (
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
            <button className="btn-primary flex items-center gap-2">
              <Plus size={14} />
              <span className="hidden sm:inline">Create New</span>
            </button>
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
