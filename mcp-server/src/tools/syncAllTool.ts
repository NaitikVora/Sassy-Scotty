/**
 * sync_all tool - Unified data fetching from all sources
 */

import { z } from "zod";
import { fetchCanvasAssignments, fetchCanvasCalendarEvents } from "./canvasTools.js";
import { fetchSioSchedule } from "./sioTools.js";
import { mergeTasks } from "../utils/normalization.js";
import type { Task } from "../models/Task.js";
import * as logger from "../utils/logger.js";

/**
 * Sync all data from Canvas and SIO
 */
export const syncAll = {
  name: "sync_all",
  description: "Fetch and normalize data from all sources (Canvas + SIO) and return unified task list",
  inputSchema: z.object({
    timeWindowDays: z.number().optional().describe("How far ahead to fetch events/assignments (default: 14)"),
    includeCompletedAssignments: z.boolean().optional().describe("Include completed Canvas assignments"),
    weeksOfSchedule: z.number().optional().describe("Number of weeks of class schedule to generate (default: 4)"),
  }),
  handler: async (args: {
    timeWindowDays?: number;
    includeCompletedAssignments?: boolean;
    weeksOfSchedule?: number;
  }): Promise<{ tasks: Task[] }> => {
    try {
      logger.info("Starting sync_all operation...");

      const timeWindowDays = args.timeWindowDays || 14;
      const weeksOfSchedule = args.weeksOfSchedule || 4;

      // Fetch Canvas assignments
      logger.info("Fetching Canvas assignments...");
      const assignmentsResult = await fetchCanvasAssignments.handler({
        includeCompleted: args.includeCompletedAssignments || false,
      });

      // Fetch Canvas calendar events
      logger.info("Fetching Canvas calendar events...");
      const eventsResult = await fetchCanvasCalendarEvents.handler({
        daysAhead: timeWindowDays,
      });

      // Fetch SIO schedule
      logger.info("Fetching SIO schedule...");
      const scheduleResult = await fetchSioSchedule.handler({
        weeksAhead: weeksOfSchedule,
      });

      // Merge all tasks
      const allTasks = mergeTasks([
        assignmentsResult.tasks,
        eventsResult.tasks,
        scheduleResult.tasks,
      ]);

      logger.info(`sync_all complete: ${allTasks.length} total tasks`);

      return { tasks: allTasks };
    } catch (error) {
      logger.error("sync_all failed", error);
      throw error;
    }
  },
};
