/**
 * Types for Scotty Vibe Context
 * Used by the scotty_vibe_context tool to generate structured coaching context
 */

export type DayLoadLevel =
  | "chill"      // 0-2 tasks due, light schedule
  | "normal"     // 3-5 tasks due, typical schedule
  | "busy"       // 6-8 tasks due or packed schedule
  | "cooked";    // 8+ tasks due or multiple exams

export interface FocusBlock {
  /** Unique ID for this focus block */
  id: string;

  /** Start time (ISO 8601) */
  startAt: string;

  /** End time (ISO 8601) */
  endAt: string;

  /** Recommended activity label */
  label: string;

  /** Suggested location for this focus block */
  suggestedLocation?: string;
}

export interface BreakIdea {
  /** Unique ID for this break idea */
  id: string;

  /** Activity description */
  label: string;

  /** How long this break should be */
  durationMinutes: number;
}

export interface RiskyTaskSummary {
  /** Task ID from the Task model */
  taskId: string;

  /** Task title */
  title: string;

  /** Due date if applicable */
  dueAt?: string;

  /** Risk level assessment */
  riskLevel: "low" | "medium" | "high";

  /** Short explanation of risk */
  reason: string;
}

export interface ScottyVibeSummary {
  /** Date for this summary (ISO date yyyy-mm-dd) */
  date: string;

  /** Overall load assessment */
  dayLoad: DayLoadLevel;

  /** Total tasks for today */
  totalTasksToday: number;

  /** Tasks due today */
  totalDueToday: number;

  /** Overdue tasks */
  totalOverdue: number;

  /** Free time available in minutes */
  freeBlockMinutes: number;

  /** First due time today (ISO 8601) */
  firstDueAt?: string;
}

export interface ScottyVibeContext {
  /** High-level summary of the day */
  summary: ScottyVibeSummary;

  /** Recommended focus/work blocks */
  focusBlocks: FocusBlock[];

  /** Break suggestions */
  breakIdeas: BreakIdea[];

  /** Tasks that need attention */
  riskyTasks: RiskyTaskSummary[];

  /** Recommended task order (array of Task IDs) */
  suggestedOrder: string[];

  /** Neutral hints for the LLM to transform into Sassy Scotty voice */
  notesForCoach: string[];
}

/**
 * User preferences for vibe context generation
 */
export interface UserPreferences {
  /** Wake time (HH:MM format) */
  wakeTime?: string;

  /** Sleep time (HH:MM format) */
  sleepTime?: string;

  /** Social energy level */
  socialEnergy?: "low" | "medium" | "high";

  /** Preferred study locations */
  preferredLocations?: string[];
}
