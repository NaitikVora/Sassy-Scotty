/**
 * MCP tools for CMU SIO integration
 */

import { z } from "zod";
import { sioClient } from "../clients/sioClient.js";
import { sioScheduleEntryToTasks } from "../utils/normalization.js";
import type { Task } from "../models/Task.js";
import * as logger from "../utils/logger.js";

/**
 * Fetch SIO schedule and convert to tasks
 */
export const fetchSioSchedule = {
  name: "fetch_sio_schedule",
  description: "Fetch class schedule from CMU SIO and convert to recurring task entries",
  inputSchema: z.object({
    termCode: z.string().optional().describe("Term code (e.g., 'S25', 'F24')"),
    weeksAhead: z.number().optional().describe("Number of weeks ahead to generate tasks for (default: 4)"),
  }),
  handler: async (args: {
    termCode?: string;
    weeksAhead?: number;
  }): Promise<{ tasks: Task[] }> => {
    try {
      const schedule = await sioClient.fetchCurrentSchedule();

      // Generate tasks for the next N weeks
      const weeksAhead = args.weeksAhead || 4;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (weeksAhead * 7));

      const allTasks: Task[] = [];

      for (const entry of schedule.entries) {
        const tasks = sioScheduleEntryToTasks(entry, startDate, endDate);
        allTasks.push(...tasks);
      }

      logger.info(`Returning ${allTasks.length} SIO schedule tasks`);
      return { tasks: allTasks };
    } catch (error) {
      logger.error("fetch_sio_schedule failed", error);
      throw error;
    }
  },
};
