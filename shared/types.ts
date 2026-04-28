/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Application-specific types
export type Priority = "low" | "medium" | "high";
export type Frequency = "daily" | "weekly" | "custom";
export type HabitCategory = "fitness" | "learning" | "work" | "wellness" | "reflection";
export type ScheduledHabitStatus = "pending" | "completed" | "skipped" | "rescheduled";

export interface FreeSlotData {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface HabitAssignmentData {
  habitId: number;
  startTime: Date;
  endTime: Date;
}

export interface HabitStatsData {
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  averageDailyCompletions: number;
}
