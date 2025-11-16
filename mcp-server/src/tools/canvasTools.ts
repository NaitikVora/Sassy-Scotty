/**
 * MCP tools for Canvas integration
 */

import { z } from "zod";
import { canvasClient } from "../clients/canvasClient.js";
import {
  canvasAssignmentToTask,
  canvasCalendarEventToTask,
  extractCourseCode,
} from "../utils/normalization.js";
import type { Task } from "../models/Task.js";
import * as logger from "../utils/logger.js";

/**
 * Fetch Canvas courses
 */
export const fetchCanvasCourses = {
  name: "fetch_canvas_courses",
  description: "Fetch all Canvas courses for the current student",
  inputSchema: z.object({
    includeCompleted: z.boolean().optional().describe("Include completed courses"),
  }),
  handler: async (args: { includeCompleted?: boolean }) => {
    try {
      const courses = await canvasClient.getCourses(args.includeCompleted || false);

      return {
        courses: courses.map((course) => ({
          id: course.id,
          name: course.name,
          courseCode: extractCourseCode(course),
          workflowState: course.workflow_state,
          startAt: course.start_at,
          endAt: course.end_at,
        })),
      };
    } catch (error) {
      logger.error("fetch_canvas_courses failed", error);
      throw error;
    }
  },
};

/**
 * Fetch Canvas assignments
 */
export const fetchCanvasAssignments = {
  name: "fetch_canvas_assignments",
  description: "Fetch Canvas assignments, optionally filtered by course and date range",
  inputSchema: z.object({
    courseId: z.number().optional().describe("Specific course ID to fetch assignments from"),
    includeCompleted: z.boolean().optional().describe("Include completed assignments"),
    dueAfter: z.string().optional().describe("Only assignments due after this date (ISO 8601)"),
    dueBefore: z.string().optional().describe("Only assignments due before this date (ISO 8601)"),
  }),
  handler: async (args: {
    courseId?: number;
    includeCompleted?: boolean;
    dueAfter?: string;
    dueBefore?: string;
  }): Promise<{ tasks: Task[] }> => {
    try {
      let tasks: Task[] = [];

      if (args.courseId) {
        // Fetch for specific course
        const assignments = await canvasClient.getAssignmentsForCourse(args.courseId, true);
        const courses = await canvasClient.getCourses(args.includeCompleted || false);
        const course = courses.find((c) => c.id === args.courseId);

        tasks = assignments.map((assignment) =>
          canvasAssignmentToTask(assignment, course)
        );
      } else {
        // Fetch across all courses
        const results = await canvasClient.getAllAssignments(
          args.includeCompleted || false,
          args.dueAfter,
          args.dueBefore
        );

        tasks = results.map(({ assignment, course }) =>
          canvasAssignmentToTask(assignment, course)
        );
      }

      logger.info(`Returning ${tasks.length} Canvas assignments as tasks`);
      return { tasks };
    } catch (error) {
      logger.error("fetch_canvas_assignments failed", error);
      throw error;
    }
  },
};

/**
 * Fetch Canvas calendar events
 */
export const fetchCanvasCalendarEvents = {
  name: "fetch_canvas_calendar_events",
  description: "Fetch Canvas calendar events within a date range",
  inputSchema: z.object({
    startDate: z.string().optional().describe("Start date (ISO 8601)"),
    endDate: z.string().optional().describe("End date (ISO 8601)"),
    daysAhead: z.number().optional().describe("Number of days ahead to fetch (alternative to endDate)"),
  }),
  handler: async (args: {
    startDate?: string;
    endDate?: string;
    daysAhead?: number;
  }): Promise<{ tasks: Task[] }> => {
    try {
      let events;

      if (args.daysAhead) {
        events = await canvasClient.getUpcomingCalendarEvents(args.daysAhead);
      } else {
        events = await canvasClient.getCalendarEvents(args.startDate, args.endDate);
      }

      const tasks = events.map(canvasCalendarEventToTask);

      logger.info(`Returning ${tasks.length} Canvas calendar events as tasks`);
      return { tasks };
    } catch (error) {
      logger.error("fetch_canvas_calendar_events failed", error);
      throw error;
    }
  },
};
