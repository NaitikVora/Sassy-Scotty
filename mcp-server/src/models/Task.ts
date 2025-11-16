/**
 * Unified Task model for Sassy Scotty
 * Supports tasks from Canvas, SIO, and manual entry
 * Includes Kanban stage for board organization
 */

export type TaskSource = "canvas" | "sio" | "manual";

export type TaskType =
  | "assignment"
  | "exam"
  | "lecture"
  | "lab"
  | "recitation"
  | "event"
  | "todo";

export type TaskStatus = "pending" | "completed" | "overdue";

/**
 * Kanban stages correspond to front-end columns.
 * Front-end may map these to Gen Z labels like:
 * - brain_dump      → "brain dump 🧠"
 * - kinda_urgent    → "kinda urgent ngl"
 * - in_progress     → "we balling rn"
 * - done            → "ate & left no crumbs"
 */
export type KanbanStage =
  | "brain_dump"
  | "kinda_urgent"
  | "in_progress"
  | "done";

export const KANBAN_STAGES: KanbanStage[] = [
  "brain_dump",
  "kinda_urgent",
  "in_progress",
  "done",
];

export interface Task {
  /** Unique ID within this MCP */
  id: string;

  /** Source system */
  source: TaskSource;

  /** Display title */
  title: string;

  /** Detailed description */
  description?: string;

  /** Course code (e.g., "15-112") */
  courseCode?: string;

  /** Full course name */
  courseName?: string;

  /** Due date/time (ISO 8601) */
  dueAt?: string;

  /** Start time (ISO 8601) - for classes/events */
  startAt?: string;

  /** End time (ISO 8601) - for classes/events */
  endAt?: string;

  /** Physical location */
  location?: string;

  /** Task type */
  type: TaskType;

  /** Priority level */
  priority?: "low" | "medium" | "high";

  /** Current status */
  status?: TaskStatus;

  /** Current Kanban board column */
  kanbanStage?: KanbanStage;

  /** Original source system ID */
  rawSourceId?: string;

  /** Additional metadata from source systems */
  metadata?: Record<string, unknown>;
}

/**
 * Helper to generate a unique task ID
 */
export function generateTaskId(source: TaskSource, sourceId: string): string {
  return `${source}-${sourceId}-${Date.now()}`;
}
