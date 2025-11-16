/**
 * Normalization utilities to convert source-specific data to unified Task model
 */

import type { CanvasAssignment, CanvasCalendarEvent, CanvasCourse } from "../models/CanvasTypes.js";
import type { SioScheduleEntry } from "../models/SioTypes.js";
import type { Task, KanbanStage, TaskStatus, TaskType } from "../models/Task.js";
import { generateTaskId } from "../models/Task.js";
import { hoursUntil, isPast, parseISODate, combineDateAndTime, getRecurringDates } from "./timeUtils.js";

/**
 * Determine Kanban stage based on due date proximity
 */
export function determineKanbanStage(dueAt?: string, now: Date = new Date()): KanbanStage {
  if (!dueAt) {
    return "brain_dump";
  }

  const dueDate = parseISODate(dueAt);
  const hours = hoursUntil(dueDate, now);

  if (hours < 0) {
    // Overdue - should be urgent
    return "kinda_urgent";
  } else if (hours <= 48) {
    // Due within 48 hours
    return "kinda_urgent";
  } else {
    // More than 48 hours away
    return "brain_dump";
  }
}

/**
 * Determine task status based on due date and submission
 */
export function determineTaskStatus(
  dueAt?: string,
  submitted?: boolean,
  now: Date = new Date()
): TaskStatus {
  if (submitted) {
    return "completed";
  }

  if (!dueAt) {
    return "pending";
  }

  const dueDate = parseISODate(dueAt);
  if (isPast(dueDate, now)) {
    return "overdue";
  }

  return "pending";
}

/**
 * Determine task type from Canvas assignment
 */
export function determineTaskType(assignment: CanvasAssignment): TaskType {
  const name = assignment.name.toLowerCase();

  if (assignment.is_quiz_assignment || name.includes("quiz")) {
    return "exam";
  }

  if (name.includes("exam") || name.includes("test") || name.includes("midterm") || name.includes("final")) {
    return "exam";
  }

  return "assignment";
}

/**
 * Extract course code from Canvas course
 * Tries to parse format like "15-112 S25: Fundamentals of Programming"
 */
export function extractCourseCode(course: CanvasCourse): string {
  // Try to extract from course_code field first
  if (course.course_code) {
    // Remove semester suffix if present (e.g., "15112-S25" -> "15-112")
    const match = course.course_code.match(/^(\d+-\d+)/);
    if (match) {
      return match[1];
    }
    return course.course_code;
  }

  // Try to extract from course name
  const nameMatch = course.name.match(/^(\d+-\d+)/);
  if (nameMatch) {
    return nameMatch[1];
  }

  // Fallback to course_code as-is
  return course.course_code || `course-${course.id}`;
}

/**
 * Convert Canvas assignment to Task
 */
export function canvasAssignmentToTask(
  assignment: CanvasAssignment,
  course?: CanvasCourse
): Task {
  const submitted = assignment.submission?.workflow_state === "submitted" ||
                    assignment.submission?.workflow_state === "graded";

  const taskType = determineTaskType(assignment);
  const status = determineTaskStatus(assignment.due_at, submitted);
  const kanbanStage = submitted ? "done" : determineKanbanStage(assignment.due_at);

  return {
    id: generateTaskId("canvas", `assignment-${assignment.id}`),
    source: "canvas",
    title: assignment.name,
    description: assignment.description || undefined,
    courseCode: course ? extractCourseCode(course) : undefined,
    courseName: course?.name,
    dueAt: assignment.due_at || undefined,
    type: taskType,
    status,
    kanbanStage,
    rawSourceId: assignment.id.toString(),
    metadata: {
      canvasUrl: assignment.html_url,
      pointsPossible: assignment.points_possible,
      submissionTypes: assignment.submission_types,
      isQuiz: assignment.is_quiz_assignment,
    },
  };
}

/**
 * Convert Canvas calendar event to Task
 */
export function canvasCalendarEventToTask(event: CanvasCalendarEvent): Task {
  return {
    id: generateTaskId("canvas", `event-${event.id}`),
    source: "canvas",
    title: event.title,
    description: event.description || undefined,
    startAt: event.start_at,
    endAt: event.end_at || undefined,
    location: event.location_name || event.location_address || undefined,
    type: "event",
    status: "pending",
    kanbanStage: determineKanbanStage(event.start_at),
    rawSourceId: event.id.toString(),
    metadata: {
      contextCode: event.context_code,
      allDay: event.all_day,
    },
  };
}

/**
 * Convert SIO schedule entry to recurring Tasks
 * Generates individual task instances for each class meeting
 */
export function sioScheduleEntryToTasks(
  entry: SioScheduleEntry,
  startDate: Date,
  endDate: Date
): Task[] {
  const tasks: Task[] = [];

  // Parse days of week from SIO format (e.g., "MWF" -> [1, 3, 5])
  const daysOfWeek: number[] = [];
  const dayMap: Record<string, number> = {
    "U": 0, // Sunday
    "M": 1, // Monday
    "T": 2, // Tuesday
    "W": 3, // Wednesday
    "R": 4, // Thursday
    "F": 5, // Friday
    "S": 6, // Saturday
  };

  for (const char of entry.days) {
    const dayNum = dayMap[char];
    if (dayNum !== undefined) {
      daysOfWeek.push(dayNum);
    }
  }

  // Get all dates for these days of week
  const dates = getRecurringDates(daysOfWeek, startDate, endDate);

  // Map meeting type to task type
  const typeMap: Record<string, TaskType> = {
    "Lecture": "lecture",
    "Lab": "lab",
    "Recitation": "recitation",
  };
  const taskType: TaskType = typeMap[entry.meetingType] || "lecture";

  // Create a task for each occurrence
  for (const date of dates) {
    const startAt = combineDateAndTime(date.toISOString().split("T")[0], entry.startTime);
    const endAt = combineDateAndTime(date.toISOString().split("T")[0], entry.endTime);

    tasks.push({
      id: generateTaskId("sio", `${entry.id}-${date.toISOString().split("T")[0]}`),
      source: "sio",
      title: `${entry.courseCode} ${entry.meetingType}`,
      description: entry.courseTitle,
      courseCode: entry.courseCode,
      courseName: entry.courseTitle,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      location: entry.location,
      type: taskType,
      status: "pending",
      kanbanStage: "brain_dump", // Class meetings typically don't need urgency tracking
      rawSourceId: entry.id,
      metadata: {
        section: entry.section,
        instructor: entry.instructor,
        units: entry.units,
        meetingType: entry.meetingType,
      },
    });
  }

  return tasks;
}

/**
 * Merge and deduplicate tasks from multiple sources
 */
export function mergeTasks(taskLists: Task[][]): Task[] {
  const allTasks = taskLists.flat();

  // For now, simple concatenation
  // In a more sophisticated version, you could deduplicate based on title + date
  return allTasks;
}
