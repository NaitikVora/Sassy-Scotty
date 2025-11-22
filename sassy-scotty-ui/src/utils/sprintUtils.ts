/**
 * Sprint utility functions
 * Sprints are 2-week periods starting from August 25, 2025
 */

export interface Sprint {
  number: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

// First sprint start date: August 25, 2025
const FIRST_SPRINT_START = new Date('2025-08-25T00:00:00');
const SPRINT_DURATION_DAYS = 14; // 2 weeks

/**
 * Calculate which sprint number a given date falls into
 */
export function getSprintNumber(date: Date): number {
  const diffTime = date.getTime() - FIRST_SPRINT_START.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / SPRINT_DURATION_DAYS) + 1;
}

/**
 * Get sprint details for a given sprint number
 */
export function getSprint(sprintNumber: number): Sprint {
  const startDate = new Date(FIRST_SPRINT_START);
  startDate.setDate(startDate.getDate() + (sprintNumber - 1) * SPRINT_DURATION_DAYS);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + SPRINT_DURATION_DAYS - 1);
  endDate.setHours(23, 59, 59, 999);

  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    number: sprintNumber,
    startDate,
    endDate,
    label: `Sprint ${sprintNumber} (${startStr} - ${endStr})`,
  };
}

/**
 * Get the current sprint based on today's date
 */
export function getCurrentSprint(): Sprint {
  const today = new Date();
  const sprintNumber = getSprintNumber(today);
  return getSprint(sprintNumber);
}

/**
 * Get a list of recent and upcoming sprints
 */
export function getAvailableSprints(): Sprint[] {
  const currentSprintNumber = getSprintNumber(new Date());
  const sprints: Sprint[] = [];

  // Get previous 3, current, and next 6 sprints
  const startSprint = Math.max(1, currentSprintNumber - 3);
  const endSprint = currentSprintNumber + 6;

  for (let i = startSprint; i <= endSprint; i++) {
    sprints.push(getSprint(i));
  }

  return sprints;
}

/**
 * Check if a date falls within a sprint
 */
export function isDateInSprint(date: Date | string | undefined, sprint: Sprint): boolean {
  if (!date) return false;

  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return checkDate >= sprint.startDate && checkDate <= sprint.endDate;
}

/**
 * Format sprint date range for display
 */
export function formatSprintRange(sprint: Sprint): string {
  return sprint.label;
}
