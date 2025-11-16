/**
 * Time and date utilities for task scheduling and vibe context
 */

/**
 * Parse ISO 8601 string to Date
 */
export function parseISODate(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Format Date to ISO 8601 string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get ISO date string (YYYY-MM-DD)
 */
export function getISODateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Check if a date is today
 */
export function isToday(date: Date, now: Date = new Date()): boolean {
  return getISODateString(date) === getISODateString(now);
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date, now: Date = new Date()): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getISODateString(date) === getISODateString(tomorrow);
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date, now: Date = new Date()): boolean {
  return date < now;
}

/**
 * Get hours until a date
 */
export function hoursUntil(date: Date, now: Date = new Date()): number {
  const diffMs = date.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Get days until a date
 */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const diffMs = date.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Check if date is within the next N days
 */
export function isWithinDays(date: Date, days: number, now: Date = new Date()): boolean {
  const daysAway = daysUntil(date, now);
  return daysAway >= 0 && daysAway <= days;
}

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Format minutes since midnight to HH:MM
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Create a Date from ISO date string and time string
 */
export function combineDateAndTime(isoDate: string, timeStr: string): Date {
  const date = new Date(isoDate);
  const minutes = parseTimeToMinutes(timeStr);
  date.setHours(Math.floor(minutes / 60));
  date.setMinutes(minutes % 60);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}

/**
 * Get the next occurrence of a day of week
 * @param dayOfWeek 0 = Sunday, 1 = Monday, etc.
 * @param fromDate Starting date
 */
export function getNextDayOfWeek(dayOfWeek: number, fromDate: Date = new Date()): Date {
  const result = new Date(fromDate);
  const currentDay = fromDate.getDay();
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
  result.setDate(result.getDate() + (daysUntilTarget || 7));
  return result;
}

/**
 * Get all occurrences of specific days of week within a date range
 * @param daysOfWeek Array of day numbers (0 = Sunday, 1 = Monday, etc.)
 * @param startDate Range start
 * @param endDate Range end
 */
export function getRecurringDates(
  daysOfWeek: number[],
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Calculate total minutes of free time in a day, given occupied blocks
 */
export function calculateFreeTime(
  occupiedBlocks: Array<{ start: Date; end: Date }>,
  dayStart: Date,
  dayEnd: Date
): number {
  // Sort blocks by start time
  const sorted = occupiedBlocks
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let freeMinutes = 0;
  let currentTime = dayStart;

  for (const block of sorted) {
    if (block.start > currentTime) {
      // Gap found
      const gapMs = block.start.getTime() - currentTime.getTime();
      freeMinutes += gapMs / (1000 * 60);
    }
    currentTime = block.end > currentTime ? block.end : currentTime;
  }

  // Check remaining time until day end
  if (currentTime < dayEnd) {
    const remainingMs = dayEnd.getTime() - currentTime.getTime();
    freeMinutes += remainingMs / (1000 * 60);
  }

  return Math.max(0, freeMinutes);
}
