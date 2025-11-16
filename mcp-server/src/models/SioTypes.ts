/**
 * TypeScript interfaces for CMU SIO schedule data
 */

export interface SioScheduleEntry {
  /** Unique identifier for this schedule entry */
  id: string;

  /** Course code (e.g., "15-112") */
  courseCode: string;

  /** Course title */
  courseTitle: string;

  /** Section number */
  section?: string;

  /** Meeting type (Lecture, Lab, Recitation, etc.) */
  meetingType: "Lecture" | "Lab" | "Recitation" | "Studio" | "Seminar" | "Other";

  /** Days of week (e.g., "MWF", "TR") */
  days: string;

  /** Start time (HH:MM format, 24-hour) */
  startTime: string;

  /** End time (HH:MM format, 24-hour) */
  endTime: string;

  /** Building and room */
  location: string;

  /** Instructor name(s) */
  instructor?: string;

  /** Units/credits */
  units?: number;
}

/**
 * Parsed SIO schedule for a semester
 */
export interface SioSchedule {
  /** Semester term (e.g., "F24", "S25") */
  term: string;

  /** All schedule entries */
  entries: SioScheduleEntry[];

  /** When this was fetched */
  fetchedAt: string;
}

/**
 * Days of week mapping for SIO
 */
export const SIO_DAYS_MAP: Record<string, number> = {
  "M": 1,  // Monday
  "T": 2,  // Tuesday
  "W": 3,  // Wednesday
  "R": 4,  // Thursday (R to avoid confusion with T)
  "F": 5,  // Friday
  "S": 6,  // Saturday
  "U": 0,  // Sunday
};

/**
 * Helper to parse SIO days string into day numbers
 */
export function parseSioDays(daysStr: string): number[] {
  const days: number[] = [];
  for (const char of daysStr) {
    const dayNum = SIO_DAYS_MAP[char];
    if (dayNum !== undefined) {
      days.push(dayNum);
    }
  }
  return days;
}
