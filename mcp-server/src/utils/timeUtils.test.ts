/**
 * Unit tests for timeUtils
 */

import { describe, it, expect } from "vitest";
import {
  isToday,
  isTomorrow,
  isPast,
  hoursUntil,
  daysUntil,
  isWithinDays,
  parseTimeToMinutes,
  formatMinutesToTime,
  timeRangesOverlap,
  calculateFreeTime,
} from "./timeUtils.js";

describe("timeUtils", () => {
  describe("isToday", () => {
    it("should return true for today's date", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const today = new Date("2025-01-15T18:00:00Z");
      expect(isToday(today, now)).toBe(true);
    });

    it("should return false for tomorrow", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const tomorrow = new Date("2025-01-16T12:00:00Z");
      expect(isToday(tomorrow, now)).toBe(false);
    });
  });

  describe("isTomorrow", () => {
    it("should return true for tomorrow's date", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const tomorrow = new Date("2025-01-16T12:00:00Z");
      expect(isTomorrow(tomorrow, now)).toBe(true);
    });

    it("should return false for today", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const today = new Date("2025-01-15T18:00:00Z");
      expect(isTomorrow(today, now)).toBe(false);
    });
  });

  describe("isPast", () => {
    it("should return true for past dates", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const past = new Date("2025-01-14T12:00:00Z");
      expect(isPast(past, now)).toBe(true);
    });

    it("should return false for future dates", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const future = new Date("2025-01-16T12:00:00Z");
      expect(isPast(future, now)).toBe(false);
    });
  });

  describe("hoursUntil", () => {
    it("should calculate hours correctly", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const future = new Date("2025-01-15T18:00:00Z");
      expect(hoursUntil(future, now)).toBe(6);
    });

    it("should return negative for past dates", () => {
      const now = new Date("2025-01-15T12:00:00Z");
      const past = new Date("2025-01-15T10:00:00Z");
      expect(hoursUntil(past, now)).toBe(-2);
    });
  });

  describe("parseTimeToMinutes", () => {
    it("should parse morning time correctly", () => {
      expect(parseTimeToMinutes("09:30")).toBe(570);
    });

    it("should parse afternoon time correctly", () => {
      expect(parseTimeToMinutes("14:45")).toBe(885);
    });

    it("should parse midnight correctly", () => {
      expect(parseTimeToMinutes("00:00")).toBe(0);
    });
  });

  describe("formatMinutesToTime", () => {
    it("should format morning time correctly", () => {
      expect(formatMinutesToTime(570)).toBe("09:30");
    });

    it("should format afternoon time correctly", () => {
      expect(formatMinutesToTime(885)).toBe("14:45");
    });

    it("should format midnight correctly", () => {
      expect(formatMinutesToTime(0)).toBe("00:00");
    });
  });

  describe("timeRangesOverlap", () => {
    it("should detect overlapping ranges", () => {
      const start1 = new Date("2025-01-15T10:00:00Z");
      const end1 = new Date("2025-01-15T12:00:00Z");
      const start2 = new Date("2025-01-15T11:00:00Z");
      const end2 = new Date("2025-01-15T13:00:00Z");

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it("should detect non-overlapping ranges", () => {
      const start1 = new Date("2025-01-15T10:00:00Z");
      const end1 = new Date("2025-01-15T12:00:00Z");
      const start2 = new Date("2025-01-15T13:00:00Z");
      const end2 = new Date("2025-01-15T14:00:00Z");

      expect(timeRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });
  });

  describe("calculateFreeTime", () => {
    it("should calculate free time with no occupied blocks", () => {
      const dayStart = new Date("2025-01-15T08:00:00Z");
      const dayEnd = new Date("2025-01-15T17:00:00Z");

      const freeMinutes = calculateFreeTime([], dayStart, dayEnd);
      expect(freeMinutes).toBe(540); // 9 hours
    });

    it("should calculate free time with one occupied block", () => {
      const dayStart = new Date("2025-01-15T08:00:00Z");
      const dayEnd = new Date("2025-01-15T17:00:00Z");

      const occupied = [
        {
          start: new Date("2025-01-15T10:00:00Z"),
          end: new Date("2025-01-15T12:00:00Z"),
        },
      ];

      const freeMinutes = calculateFreeTime(occupied, dayStart, dayEnd);
      expect(freeMinutes).toBe(420); // 9 hours - 2 hours = 7 hours
    });
  });
});
