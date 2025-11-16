/**
 * Scotty Vibe Context Tool
 * Generates structured context for Sassy Scotty coaching feature
 */

import { z } from "zod";
import type { Task } from "../models/Task.js";
import type {
  ScottyVibeContext,
  DayLoadLevel,
  FocusBlock,
  BreakIdea,
  RiskyTaskSummary,
  UserPreferences,
} from "../models/ScottyVibeTypes.js";
import {
  parseISODate,
  isToday,
  hoursUntil,
  isPast,
  getISODateString,
  calculateFreeTime,
} from "../utils/timeUtils.js";
import * as logger from "../utils/logger.js";

/**
 * Compute day load level based on tasks
 */
function computeDayLoad(
  _tasksToday: Task[],
  dueToday: Task[],
  eventsToday: Task[],
  overdueTasks: Task[]
): DayLoadLevel {
  const totalDueToday = dueToday.length;
  const totalEventsToday = eventsToday.length;
  const totalOverdue = overdueTasks.length;

  // Count exams/quizzes separately as they're more stressful
  const examsToday = dueToday.filter((t) => t.type === "exam").length;

  // Scoring system
  let loadScore = 0;
  loadScore += totalDueToday * 2;
  loadScore += totalEventsToday * 0.5;
  loadScore += totalOverdue * 1.5;
  loadScore += examsToday * 3;

  if (loadScore <= 4) return "chill";
  if (loadScore <= 10) return "normal";
  if (loadScore <= 18) return "busy";
  return "cooked";
}

/**
 * Identify risky tasks that need attention
 */
function findRiskyTasks(tasks: Task[], now: Date): RiskyTaskSummary[] {
  const risky: RiskyTaskSummary[] = [];

  for (const task of tasks) {
    if (task.status === "completed") continue;

    // Skip recurring class meetings
    if (task.type === "lecture" || task.type === "lab" || task.type === "recitation") {
      continue;
    }

    if (!task.dueAt) continue;

    const dueDate = parseISODate(task.dueAt);
    const hours = hoursUntil(dueDate, now);

    let riskLevel: "low" | "medium" | "high" = "low";
    let reason = "";

    if (isPast(dueDate, now)) {
      riskLevel = "high";
      reason = "Overdue";
    } else if (hours <= 6) {
      riskLevel = "high";
      reason = `Due in ${Math.round(hours)} hours`;
    } else if (hours <= 24) {
      riskLevel = "high";
      reason = "Due within 24 hours";
    } else if (hours <= 48) {
      riskLevel = "medium";
      reason = "Due within 48 hours";
    } else if (task.type === "exam" && hours <= 72) {
      riskLevel = "medium";
      reason = "Exam coming up soon";
    }

    if (riskLevel !== "low") {
      risky.push({
        taskId: task.id,
        title: task.title,
        dueAt: task.dueAt,
        riskLevel,
        reason,
      });
    }
  }

  // Sort by risk level and due date
  return risky.sort((a, b) => {
    const riskWeight = { high: 3, medium: 2, low: 1 };
    const weightDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];
    if (weightDiff !== 0) return weightDiff;

    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return parseISODate(a.dueAt).getTime() - parseISODate(b.dueAt).getTime();
  });
}

/**
 * Generate focus blocks based on free time
 */
function buildFocusBlocks(
  freeMinutes: number,
  _tasksToday: Task[],
  now: Date,
  preferences?: UserPreferences
): FocusBlock[] {
  const blocks: FocusBlock[] = [];
  const dateStr = getISODateString(now);

  // Simple heuristic: create focus blocks in available time
  // In a real implementation, you'd analyze gaps between events

  if (freeMinutes >= 90) {
    // Morning block
    const morningStart = new Date(`${dateStr}T09:00:00`);
    const morningEnd = new Date(`${dateStr}T10:30:00`);
    if (morningStart > now) {
      blocks.push({
        id: `focus-morning-${dateStr}`,
        startAt: morningStart.toISOString(),
        endAt: morningEnd.toISOString(),
        label: "Deep work - morning focus",
        suggestedLocation: preferences?.preferredLocations?.[0] || "Hunt Library",
      });
    }
  }

  if (freeMinutes >= 180) {
    // Afternoon block
    const afternoonStart = new Date(`${dateStr}T14:00:00`);
    const afternoonEnd = new Date(`${dateStr}T15:30:00`);
    if (afternoonStart > now) {
      blocks.push({
        id: `focus-afternoon-${dateStr}`,
        startAt: afternoonStart.toISOString(),
        endAt: afternoonEnd.toISOString(),
        label: "Review & practice",
        suggestedLocation: "Gates Hillman Center",
      });
    }
  }

  if (freeMinutes >= 240) {
    // Evening block
    const eveningStart = new Date(`${dateStr}T19:00:00`);
    const eveningEnd = new Date(`${dateStr}T20:30:00`);
    if (eveningStart > now) {
      blocks.push({
        id: `focus-evening-${dateStr}`,
        startAt: eveningStart.toISOString(),
        endAt: eveningEnd.toISOString(),
        label: "Light review",
        suggestedLocation: preferences?.preferredLocations?.[1] || "Tepper",
      });
    }
  }

  return blocks;
}

/**
 * Generate break ideas based on time of day and social energy
 */
function generateBreakIdeas(
  now: Date,
  preferences?: UserPreferences
): BreakIdea[] {
  const ideas: BreakIdea[] = [];
  const socialEnergy = preferences?.socialEnergy || "medium";

  // Universal breaks
  ideas.push({
    id: "break-walk-cut",
    label: "Walk around the Cut",
    durationMinutes: 15,
  });

  ideas.push({
    id: "break-coffee",
    label: "Coffee run (La Prima or Entropy+)",
    durationMinutes: 20,
  });

  // Social energy dependent
  if (socialEnergy === "high") {
    ideas.push({
      id: "break-cohang",
      label: "Co-hang with study buddies",
      durationMinutes: 30,
    });
  }

  if (socialEnergy === "low") {
    ideas.push({
      id: "break-quiet",
      label: "Quiet time at Phipps (if you can swing it)",
      durationMinutes: 45,
    });
  }

  // Time of day dependent
  const hour = now.getHours();
  if (hour >= 12 && hour <= 14) {
    ideas.push({
      id: "break-lunch",
      label: "Lunch at the UC or Tartan Market",
      durationMinutes: 45,
    });
  }

  return ideas;
}

/**
 * Suggest task order based on priority and due dates
 */
function suggestTaskOrder(tasks: Task[], riskyTasks: RiskyTaskSummary[]): string[] {
  // Filter to actionable tasks (not completed, not recurring classes)
  const actionable = tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.type !== "lecture" &&
      t.type !== "lab" &&
      t.type !== "recitation"
  );

  // Sort by:
  // 1. Risky tasks first
  // 2. Then by due date
  // 3. Then by type (exams before assignments)
  const riskyIds = new Set(riskyTasks.map((r) => r.taskId));

  const sorted = actionable.sort((a, b) => {
    const aRisky = riskyIds.has(a.id);
    const bRisky = riskyIds.has(b.id);

    if (aRisky && !bRisky) return -1;
    if (!aRisky && bRisky) return 1;

    if (a.type === "exam" && b.type !== "exam") return -1;
    if (a.type !== "exam" && b.type === "exam") return 1;

    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;

    return parseISODate(a.dueAt).getTime() - parseISODate(b.dueAt).getTime();
  });

  return sorted.map((t) => t.id);
}

/**
 * Generate coaching notes for the LLM
 */
function generateCoachingNotes(
  tasks: Task[],
  tasksToday: Task[],
  dueToday: Task[],
  overdue: Task[],
  dayLoad: DayLoadLevel
): string[] {
  const notes: string[] = [];

  // Overall workload
  notes.push(`Student has ${tasks.length} total active tasks`);

  if (tasksToday.length > 0) {
    notes.push(`${tasksToday.length} tasks/events scheduled for today`);
  }

  if (dueToday.length > 0) {
    notes.push(`${dueToday.length} assignments/tasks due today`);
  }

  if (overdue.length > 0) {
    notes.push(`⚠️ ${overdue.length} overdue tasks need immediate attention`);
  }

  // Day load context
  notes.push(`Overall day load: ${dayLoad}`);

  // Exam detection
  const examsThisWeek = tasks.filter(
    (t) => t.type === "exam" && t.dueAt && hoursUntil(parseISODate(t.dueAt)) <= 168
  );
  if (examsThisWeek.length > 0) {
    notes.push(`🎯 ${examsThisWeek.length} exam(s) coming up this week`);
  }

  // Clustering detection
  const nextTwoDays = tasks.filter(
    (t) => t.dueAt && hoursUntil(parseISODate(t.dueAt)) <= 48
  );
  if (nextTwoDays.length >= 5) {
    notes.push("Tasks are heavily clustered in next 48 hours - suggest prioritization");
  }

  return notes;
}

/**
 * Scotty Vibe Context Tool
 */
export const scottyVibeContext = {
  name: "scotty_vibe_context",
  description: "Generate structured daily planning and vibe context for Sassy Scotty coaching",
  inputSchema: z.object({
    tasks: z.array(z.any()).describe("Array of Task objects"),
    now: z.string().describe("Current timestamp (ISO 8601)"),
    preferences: z.object({
      wakeTime: z.string().optional(),
      sleepTime: z.string().optional(),
      socialEnergy: z.enum(["low", "medium", "high"]).optional(),
      preferredLocations: z.array(z.string()).optional(),
    }).optional(),
  }),
  handler: async (args: {
    tasks: Task[];
    now: string;
    preferences?: UserPreferences;
  }): Promise<{ context: ScottyVibeContext }> => {
    try {
      const nowDate = parseISODate(args.now);
      const tasks = args.tasks;

      // Filter tasks for today
      const tasksToday = tasks.filter((t) => {
        if (t.startAt && isToday(parseISODate(t.startAt), nowDate)) return true;
        if (t.dueAt && isToday(parseISODate(t.dueAt), nowDate)) return true;
        return false;
      });

      const dueToday = tasks.filter(
        (t) => t.dueAt && isToday(parseISODate(t.dueAt), nowDate)
      );

      const eventsToday = tasksToday.filter(
        (t) => t.type === "event" || t.type === "lecture" || t.type === "lab"
      );

      const overdueTasks = tasks.filter(
        (t) => t.dueAt && isPast(parseISODate(t.dueAt), nowDate) && t.status !== "completed"
      );

      // Compute day load
      const dayLoad = computeDayLoad(tasksToday, dueToday, eventsToday, overdueTasks);

      // Calculate free time
      const occupiedBlocks = eventsToday
        .filter((t) => t.startAt && t.endAt)
        .map((t) => ({
          start: parseISODate(t.startAt!),
          end: parseISODate(t.endAt!),
        }));

      const wakeTime = args.preferences?.wakeTime || "08:00";
      const sleepTime = args.preferences?.sleepTime || "23:00";
      const dateStr = getISODateString(nowDate);
      const dayStart = new Date(`${dateStr}T${wakeTime}:00`);
      const dayEnd = new Date(`${dateStr}T${sleepTime}:00`);

      const freeMinutes = calculateFreeTime(occupiedBlocks, dayStart, dayEnd);

      // Find risky tasks
      const riskyTasks = findRiskyTasks(tasks, nowDate);

      // Build focus blocks
      const focusBlocks = buildFocusBlocks(freeMinutes, tasksToday, nowDate, args.preferences);

      // Generate break ideas
      const breakIdeas = generateBreakIdeas(nowDate, args.preferences);

      // Suggest task order
      const suggestedOrder = suggestTaskOrder(tasks, riskyTasks);

      // Generate coaching notes
      const notesForCoach = generateCoachingNotes(
        tasks,
        tasksToday,
        dueToday,
        overdueTasks,
        dayLoad
      );

      // Find first due time today
      const firstDueAt = dueToday
        .filter((t) => t.dueAt)
        .sort((a, b) => parseISODate(a.dueAt!).getTime() - parseISODate(b.dueAt!).getTime())[0]
        ?.dueAt;

      const context: ScottyVibeContext = {
        summary: {
          date: getISODateString(nowDate),
          dayLoad,
          totalTasksToday: tasksToday.length,
          totalDueToday: dueToday.length,
          totalOverdue: overdueTasks.length,
          freeBlockMinutes: Math.round(freeMinutes),
          firstDueAt,
        },
        focusBlocks,
        breakIdeas,
        riskyTasks,
        suggestedOrder,
        notesForCoach,
      };

      logger.info(`Generated Scotty vibe context: ${dayLoad} day with ${riskyTasks.length} risky tasks`);

      return { context };
    } catch (error) {
      logger.error("scotty_vibe_context failed", error);
      throw error;
    }
  },
};
