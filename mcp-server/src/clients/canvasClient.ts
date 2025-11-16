/**
 * Canvas LMS API Client
 * Provides methods to fetch courses, assignments, and calendar events
 */

import fetch from "node-fetch";
import type {
  CanvasCourse,
  CanvasAssignment,
  CanvasCalendarEvent,
} from "../models/CanvasTypes.js";
import { env } from "../utils/env.js";
import * as logger from "../utils/logger.js";

export class CanvasClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = baseUrl || env.canvasApiBaseUrl;
    this.token = token || env.canvasApiToken;

    // Ensure baseUrl doesn't have trailing slash
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  /**
   * Make authenticated request to Canvas API
   */
  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    logger.debug(`Canvas API request: ${url.pathname}`);

    const response = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Canvas API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get all courses for the current user
   * Filters to only active enrollments by default
   */
  async getCourses(includeCompleted: boolean = false): Promise<CanvasCourse[]> {
    const params: Record<string, string> = {
      "enrollment_state": includeCompleted ? "active,completed" : "active",
      "include[]": "total_scores,enrollments",
      "per_page": "100",
    };

    try {
      const courses = await this.request<CanvasCourse[]>("/api/v1/courses", params);
      logger.info(`Fetched ${courses.length} courses from Canvas`);
      return courses;
    } catch (error) {
      logger.error("Failed to fetch Canvas courses", error);
      throw error;
    }
  }

  /**
   * Get assignments for a specific course
   */
  async getAssignmentsForCourse(
    courseId: number,
    includeSubmissions: boolean = true
  ): Promise<CanvasAssignment[]> {
    const params: Record<string, string> = {
      "per_page": "100",
      "order_by": "due_at",
    };

    if (includeSubmissions) {
      params["include[]"] = "submission";
    }

    try {
      const assignments = await this.request<CanvasAssignment[]>(
        `/api/v1/courses/${courseId}/assignments`,
        params
      );
      logger.debug(`Fetched ${assignments.length} assignments for course ${courseId}`);
      return assignments;
    } catch (error) {
      logger.error(`Failed to fetch assignments for course ${courseId}`, error);
      return []; // Return empty array on error for robustness
    }
  }

  /**
   * Get assignments across all active courses
   */
  async getAllAssignments(
    includeCompleted: boolean = false,
    dueAfter?: string,
    dueBefore?: string
  ): Promise<Array<{ assignment: CanvasAssignment; course: CanvasCourse }>> {
    try {
      const courses = await this.getCourses(includeCompleted);
      const results: Array<{ assignment: CanvasAssignment; course: CanvasCourse }> = [];

      for (const course of courses) {
        const assignments = await this.getAssignmentsForCourse(course.id, true);

        for (const assignment of assignments) {
          // Filter by date range if specified
          if (dueAfter && assignment.due_at) {
            if (new Date(assignment.due_at) < new Date(dueAfter)) {
              continue;
            }
          }

          if (dueBefore && assignment.due_at) {
            if (new Date(assignment.due_at) > new Date(dueBefore)) {
              continue;
            }
          }

          results.push({ assignment, course });
        }
      }

      logger.info(`Fetched ${results.length} total assignments across all courses`);
      return results;
    } catch (error) {
      logger.error("Failed to fetch all assignments", error);
      throw error;
    }
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(
    startDate?: string,
    endDate?: string,
    contextCodes?: string[]
  ): Promise<CanvasCalendarEvent[]> {
    const params: Record<string, string> = {
      "per_page": "100",
    };

    if (startDate) {
      params["start_date"] = startDate;
    }

    if (endDate) {
      params["end_date"] = endDate;
    }

    if (contextCodes && contextCodes.length > 0) {
      params["context_codes[]"] = contextCodes.join(",");
    }

    try {
      const events = await this.request<CanvasCalendarEvent[]>(
        "/api/v1/calendar_events",
        params
      );
      logger.info(`Fetched ${events.length} calendar events from Canvas`);
      return events;
    } catch (error) {
      logger.error("Failed to fetch calendar events", error);
      throw error;
    }
  }

  /**
   * Get calendar events for the next N days
   */
  async getUpcomingCalendarEvents(days: number = 7): Promise<CanvasCalendarEvent[]> {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + days);

    return this.getCalendarEvents(
      now.toISOString(),
      end.toISOString()
    );
  }
}

/**
 * Default Canvas client instance using environment variables
 */
export const canvasClient = new CanvasClient();
