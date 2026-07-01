# AI Agents for Performance Management — Use Cases per Stage

This document proposes how **AI agents** can be introduced into the Scyne Performance
platform at **every step** of the performance cycle. For each stage it maps the existing
screen/component to concrete agent use cases, the data the agent reads, the action it
takes, and where a human stays in the loop.

The proposals are grounded in what leading products ship today — **Lattice AI**
(coaching, drafting, meeting prep, automated summaries), **15Five**, **Leapsome**
(OKRs + feedback + learning), **Culture Amp** (analytics-driven insights), **Betterworks**,
and **Engagedly** — plus 2025–26 market patterns (see [Market Inspiration](#market-inspiration)).

## Design principles (apply to every agent)

- **Human-in-the-loop by default.** Agents draft, suggest, summarize, and flag — a
  person (employee, manager, or HR) reviews and approves before anything is finalized or
  shared. This mirrors every mainstream product: *"AI should enhance, not replace, the
  human side of reviews."*
- **Grounded, not generative-only.** Agents reason over real platform data (goals,
  progress history, feedback, check-ins, grade expectations) rather than inventing content.
- **Transparent.** Any AI-generated or AI-assisted content is labelled as such; employees
  are told when AI is involved.
- **Bias-aware.** Language and rating agents flag biased/vague phrasing and run
  distribution checks; regular bias audits across demographics.
- **Auditable.** Every agent action is written to the existing `changeHistory` /
  audit-trail model with an "AI-assisted" attribution.

## Agent roster (reusable services)

These named agents are referenced throughout the stages below:

| Agent | Responsibility |
|---|---|
| **Goal Coach** | Drafts SMART goals, milestones, and alignment suggestions |
| **Progress Sentinel** | Monitors goals, predicts risk, nudges, drafts updates |
| **Feedback Synthesizer** | Clusters themes, summarizes 360° inputs, detects sentiment |
| **Review Writer** | Drafts self-assessment & manager-review narratives from evidence |
| **Bias & Tone Guardian** | Flags biased/vague language, checks rating consistency |
| **Calibration Analyst** | Builds distribution/9-box analytics, surfaces outliers |
| **Cycle Orchestrator** | Automates scheduling, reminders, escalations, config |
| **Development Planner** | Turns gaps into learning/coaching plans for next cycle |

---

## Section 1 — Goal Setting & Alignment

### 1.1 Practice Goals (org-level) — `CompanyGoalsView`
**Agent: Goal Coach + Calibration Analyst**
- Draft practice-goal descriptions and measurable key results from a short prompt.
- Suggest which teams/individuals should contribute, based on role profiles and past
  alignment, to close **coverage gaps** shown in "Practice Goal Coverage".
- Forecast year-end attainment from historical progress trends and flag at-risk org goals.
- **Reads:** practice goals, `SCYNE_VALUES`, team alignment counts, progress history.
- **Human step:** Leadership/HR edits and publishes.

### 1.2 Grade Expectations — `GradeExpectationsView`
**Agent: Goal Coach**
- Act as a **calibration reference assistant**: given an employee's grade (G3–G6) and role,
  explain what "Met vs. Exceeded" looks like and suggest goals that would demonstrate the
  next grade's expectations.
- **Reads:** `GRADE_EXPECTATIONS`, `ROLE_PROFILES`.
- **Human step:** Advisory only; informs goal-setting conversations.

### 1.3 My Goals (individual creation) — `MyGoalsView`
**Agent: Goal Coach**
- **Draft goals** from a one-line intent; auto-generate **milestones** and metrics matched
  to the goal type (Strategic / Individual / Team).
- **Alignment check:** recommend which Practice Goals this goal should link to and score the
  strength of alignment before submission.
- Suggest **skills from the passport** and Scyne values to link.
- Quality gate: flag vague or unmeasurable goals ("improve communication") and rewrite as
  SMART.
- **Reads:** goal draft, employee role, parent practice goals, skills passport.
- **Human step:** Employee edits, then requests manager approval.

### 1.4 Team Goals (manager approval) — `TeamGoalsView`
**Agent: Goal Coach + Feedback Synthesizer**
- **Summarize a submission set** for the manager: which goals are well-aligned, which are
  duplicative, and where the team **under-covers** a practice goal.
- Draft **approval / request-changes comments** with specific rationale.
- Flag goals that are misaligned, unmeasurable, or overloaded on one pillar.
- **Reads:** submitted goals, practice-goal targets, team coverage.
- **Human step:** Manager approves / rejects / requests changes (agent only proposes).

---

## Section 2 — Ongoing Tracking (active cycle)

### 2.1 Goal Detail & progress updates — `GoalDetailView`
**Agent: Progress Sentinel**
- **Risk prediction:** combine `daysUntilDue`, current progress, and milestone completion to
  predict "At Risk / Overdue" *before* the deadline, with an explanation.
- Suggest the **next milestone** or a recovery plan when a goal stalls.
- **Draft a progress-update note** from linked activity so employees update in one click.
- Recommend skills/activities to link based on the work described.
- **Reads:** progress history, milestones, metrics, linked items.
- **Human step:** Employee confirms the update; the note is labelled AI-assisted.

### 2.2 Check-Ins — `MyGoalsView` (Check-Ins tab)
**Agent: Progress Sentinel + Feedback Synthesizer**
- Generate **talking points** for a 1:1 from recent goal movement, blockers, and open
  feedback.
- Summarize a free-text check-in into structured follow-up actions.
- Detect **early warning patterns** (repeated blockers, momentum drop) and nudge a check-in.
- **Reads:** `CHECK_IN_LOG`, goal progress, feedback.

### 2.3 Notifications & Tasks — `NotificationCenter`
**Agent: Cycle Orchestrator**
- Autonomously **create, prioritize, and time** reminders/tasks (goal update due, approval
  pending, feedback overdue) instead of fixed calendar triggers.
- **Smart escalation:** if a task is ignored, escalate to the right person (TL / skip-level)
  per policy.
- Batch and phrase nudges to reduce notification fatigue.
- **Reads:** `NOTIFICATIONS`, `TASKS`, cadence rules.

---

## Section 3 — Feedback Loop (continuous)

### 3.1 Request Feedback (Scyne 360°) — `FeedbackView` (Request tab)
**Agent: Feedback Synthesizer + Goal Coach**
- **Recommend respondents** (peers, leads, skip-level) most relevant to the employee's
  recent work and goals.
- Suggest the **competencies** to ask about, tailored to role and current goals.
- Draft the request scope/message; propose a reminder cadence.
- **Reads:** role, linked goals, recent activity, `COMPETENCIES`.
- **Human step:** Requestor confirms recipients and scope.

### 3.2 Give Feedback — `FeedbackView` (Give tab)
**Agent: Review Writer + Bias & Tone Guardian**
- Turn a rough note into **specific, behavioral feedback** ("not a team player" →
  "missed two sprint hand-offs; here's the impact…").
- Real-time **tone/bias flagging** and rewrite suggestions before sending.
- **Reads:** draft text, recipient/goal context.
- **Human step:** Giver approves final wording.

### 3.3 Feedback Received & Insights — `FeedbackInsightsView`
**Agent: Feedback Synthesizer**
- **Theme clustering** across all feedback (strengths vs. development patterns) — e.g.
  *"consistently praised for collaboration, repeatedly flagged for delayed follow-ups."*
- Sentiment and competency tagging; compare themes against role/grade expectations.
- Produce a **development-ready summary** the employee can act on.
- **Reads:** feedback collection, `FEEDBACK_THEMES`, competencies, role profile.

---

## Section 4 — Review Cycle Management

### 4.1 Reviews overview — `ReviewsView`
**Agent: Cycle Orchestrator**
- Surface **what needs attention now** (overdue self-reviews, pending manager reviews) and
  the fastest path to complete the cycle.
- Predict cycle completion date from current velocity.
- **Reads:** `REVIEW_CYCLES` completion aggregates.

### 4.2 Self-Assessment — `SelfAssessmentView`
**Agent: Review Writer**
- Compile the employee's **accomplishments** from the period (completed goals, milestones,
  recognition) into a first-draft narrative per section.
- Provide **reflection prompts** ("What was your biggest impact this quarter?").
- Flag incomplete sections before submit.
- **Reads:** goals achieved, competencies, check-ins, feedback received.
- **Human step:** Employee edits and submits their own words.

### 4.3 Manager Review — `ManagerReviewView`
**Agent: Review Writer + Bias & Tone Guardian**  *(the Sparkles/chatbot entry point already exists here)*
- **Draft the review** from evidence: self-assessment + peer feedback + goal progress +
  history — with a **suggested rating** and the reasons behind it.
- Draft per-goal manager commentary grounded in specific outcomes.
- **Bias/consistency check:** flag vague personality judgments and rating drift vs. the
  manager's other reviews.
- Highlight anomalies (self vs. manager rating gaps) to discuss.
- **Reads:** self-assessment, peer feedback, goal progress, prior ratings.
- **Human step:** Manager owns accuracy, context, final rating, and sharing.

### 4.4 Calibration / Cycle Workspace — `CycleWorkspaceView`
**Agent: Calibration Analyst**  *(extends the existing "AI Summary" panel)*
- Generate the **cohort analytics narrative**: bell-curve distribution, rating heatmap,
  9-box positioning — in plain language.
- Detect **outliers and inconsistency** across managers/departments ("Team A rates a full
  point higher for similar goal attainment").
- Suggest moderation actions and check for demographic bias in the distribution.
- **Reads:** all cycle ratings, employee attributes (role, tenure, department).
- **Human step:** HR/managers make calibration decisions.

### 4.5 Individual Review Workspace (360°) — `IndividualReviewWorkspaceView`
**Agent: Feedback Synthesizer + Review Writer**
- **Synthesize all 360° sources** (self, peers, manager, skip-level) into one coherent
  narrative with agreed strengths, divergences, and 2–3 development focuses.
- Surface where sources conflict so the manager can reconcile.
- **Reads:** multi-source review inputs.
- **Human step:** Manager finalizes and shares.

### 4.6 Review Results & Acknowledgement — `ReviewResultsView`
**Agent: Development Planner**
- Translate the final rating + comments into a **plain-language explanation** and a
  proposed **development plan** for next cycle.
- Auto-queue recommended learning/goals into the next cycle on acknowledgement.
- **Reads:** final rating, calibrated outcome, manager summary.
- **Human step:** Employee acknowledges; plan is a suggestion.

---

## Section 5 — Admin & Configuration (spans the cycle)

### 5.1 Cycle Builder — `CycleBuilder`
**Agent: Cycle Orchestrator**
- Recommend cycle **timeline and form template** from org size and past cycle durations.
- Auto-configure stage deadlines and participant lists from HRIS.
- **Reads:** org data, past cycles.

### 5.2 Form Builder — `FormBuilderView`
**Agent: Review Writer**
- Generate a **draft question set** for a cycle type (annual, new-hire 30/60/90, upward).
- Suggest question types and flag redundant/leading questions.

### 5.3 Automation Rules — `AutomationRulesView`
**Agent: Cycle Orchestrator**
- Propose rule scenarios (e.g. new-hire check-ins, goal-cadence reminders) and **predict
  their impact/volume** before enabling.
- Suggest **manager-change policy** defaults and edge cases.

### 5.4 Notification Rules — `NotificationRulesView`
**Agent: Cycle Orchestrator**
- Recommend channel + escalation policies that minimize fatigue while hitting SLAs.
- Learn from open/completion rates to tune cadence.

---

## Section 6 — Dashboard

### 6.1 Dashboard — `Dashboard`
**Agent: Progress Sentinel + Calibration Analyst**
- Personalized **"state of your performance"** briefing: what's on track, what's at risk,
  what's due, and the single highest-value next action.
- For managers: a team roll-up with the reviews/goals that need intervention first.
- **Reads:** aggregated goals, reviews, feedback, deadlines.

---

## Market Inspiration

Patterns adopted here that are already standard or emerging in the market:

- **Drafting assistants** for self-reviews and manager reviews from collected evidence
  (Lattice, 15Five, PerformYard, Leapsome).
- **Multi-source synthesis** — combining goals, peer feedback, manager notes, recognition,
  and learning into one performance view to reduce bias (Engagedly, Culture Amp).
- **Continuous monitoring / Progress agents** — auto-update KPI progress, flag blockers and
  burnout/retention risk, trigger real-time nudges (Betterworks, Humaans).
- **Bias & tone flagging** — replacing "not leadership material" with specific behavioral
  observations; auditing rating consistency across teams (Lattice, Engagedly).
- **Calibration analytics** — distribution, heatmaps, 9-box, outlier detection (Culture Amp,
  Betterworks).
- **Development planning** — connecting performance gaps to learning/coaching paths queued
  into the next cycle (Leapsome, 15Five).
- **Agentic automation** — autonomous scheduling, reminders, escalation, and data
  aggregation across HRIS/collaboration tools (Humaans, emerging "AI agent" HR tooling).

### Guardrails emphasized across the market (and adopted above)
- Managers retain final approval authority.
- Employees are told when AI is involved (transparency).
- Regular bias audits across demographic groups.
- AI supports patterns; it does not dictate final judgments.
- Privacy/compliance controls protect sensitive performance data.

## Suggested rollout order

1. **Review Writer** for self-assessment & manager review (highest perceived value, matches the existing Sparkles entry point in `ManagerReviewView`).
2. **Feedback Synthesizer** for 360° insights (`FeedbackInsightsView`, `IndividualReviewWorkspaceView`).
3. **Progress Sentinel** for risk detection & nudges (`GoalDetailView`, Dashboard).
4. **Goal Coach** for goal drafting & alignment (`MyGoalsView`, `TeamGoalsView`).
5. **Calibration Analyst** (`CycleWorkspaceView`) and **Cycle Orchestrator** (Admin).

## Sources

- [10 Best AI Performance Management Tools (2026) — People Managing People](https://peoplemanagingpeople.com/tools/best-ai-performance-management-tools/)
- [Using AI to Write Performance Reviews — Lattice](https://lattice.com/articles/using-ai-to-write-performance-reviews-everything-you-need-to-know)
- [AI in Performance Reviews: Use Cases, Tools & Risks (2026) — Engagedly](https://engagedly.com/blog/use-of-artificial-intelligence-in-performance-reviews/)
- [Performance Review Automation: Smarter Reviews with AI Agents — Humaans](https://humaans.io/hr-glossary/performance-review-automation)
- [AI Performance Reviews: How to Use AI in 2026 — Factorial](https://factorialhr.com/blog/ai-performance-reviews/)
- [Best AI Performance Review Generators for 2026 — PerformYard](https://www.performyard.com/articles/ai-performance-review-generators)
