/**
 * Unit tests for normalization utilities
 */

import { describe, it, expect } from "vitest";
import {
  determineKanbanStage,
  determineTaskStatus,
  extractCourseCode,
  canvasAssignmentToTask,
} from "./normalization.js";
import type { CanvasCourse, CanvasAssignment } from "../models/CanvasTypes.js";

describe("normalization", () => {
  describe("determineKanbanStage", () => {
    it("should return brain_dump for no due date", () => {
      expect(determineKanbanStage(undefined)).toBe("brain_dump");
    });

    it("should return kinda_urgent for due within 48 hours", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const dueAt = new Date("2025-01-16T12:00:00Z").toISOString();
      expect(determineKanbanStage(dueAt, now)).toBe("kinda_urgent");
    });

    it("should return brain_dump for due more than 48 hours away", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const dueAt = new Date("2025-01-20T12:00:00Z").toISOString();
      expect(determineKanbanStage(dueAt, now)).toBe("brain_dump");
    });

    it("should return kinda_urgent for overdue tasks", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const dueAt = new Date("2025-01-14T12:00:00Z").toISOString();
      expect(determineKanbanStage(dueAt, now)).toBe("kinda_urgent");
    });
  });

  describe("determineTaskStatus", () => {
    it("should return completed if submitted", () => {
      expect(determineTaskStatus(undefined, true)).toBe("completed");
    });

    it("should return pending for future date", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const dueAt = new Date("2025-01-20T12:00:00Z").toISOString();
      expect(determineTaskStatus(dueAt, false, now)).toBe("pending");
    });

    it("should return overdue for past date", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const dueAt = new Date("2025-01-14T12:00:00Z").toISOString();
      expect(determineTaskStatus(dueAt, false, now)).toBe("overdue");
    });
  });

  describe("extractCourseCode", () => {
    it("should extract course code from course_code field", () => {
      const course: CanvasCourse = {
        id: 1,
        name: "Fundamentals of Programming",
        course_code: "15-112",
        workflow_state: "available",
        account_id: 1,
      };

      expect(extractCourseCode(course)).toBe("15-112");
    });

    it("should extract course code from course name", () => {
      const course: CanvasCourse = {
        id: 1,
        name: "15-112 S25: Fundamentals of Programming",
        course_code: "",
        workflow_state: "available",
        account_id: 1,
      };

      expect(extractCourseCode(course)).toBe("15-112");
    });
  });

  describe("canvasAssignmentToTask", () => {
    it("should convert Canvas assignment to Task", () => {
      const assignment: CanvasAssignment = {
        id: 123,
        name: "Homework 1",
        description: "Complete exercises 1-10",
        due_at: "2025-01-20T23:59:00Z",
        points_possible: 100,
        submission_types: ["online_text_entry"],
        course_id: 1,
        html_url: "https://canvas.example.com/courses/1/assignments/123",
      };

      const course: CanvasCourse = {
        id: 1,
        name: "15-112 Fundamentals of Programming",
        course_code: "15-112",
        workflow_state: "available",
        account_id: 1,
      };

      const task = canvasAssignmentToTask(assignment, course);

      expect(task.source).toBe("canvas");
      expect(task.title).toBe("Homework 1");
      expect(task.description).toBe("Complete exercises 1-10");
      expect(task.courseCode).toBe("15-112");
      expect(task.dueAt).toBe("2025-01-20T23:59:00Z");
      expect(task.type).toBe("assignment");
      expect(task.rawSourceId).toBe("123");
    });

    it("should detect exam assignments", () => {
      const assignment: CanvasAssignment = {
        id: 456,
        name: "Midterm Exam",
        due_at: "2025-02-15T23:59:00Z",
        points_possible: 200,
        submission_types: ["online_quiz"],
        course_id: 1,
        html_url: "https://canvas.example.com/courses/1/assignments/456",
      };

      const task = canvasAssignmentToTask(assignment);

      expect(task.type).toBe("exam");
    });
  });
});
