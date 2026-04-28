import { describe, it, expect } from "vitest";
import { getFreeSlots, assignTasks } from "./scheduler";
import type { TimetableEvent, Habit } from "../drizzle/schema";

describe("Scheduler Engine", () => {
  it("should detect free slots correctly", () => {
    const dayStart = new Date("2026-04-28T06:00:00");
    const dayEnd = new Date("2026-04-28T23:00:00");
    const events: TimetableEvent[] = [
      {
        id: 1,
        userId: 1,
        title: "Work",
        description: null,
        startTime: new Date("2026-04-28T09:00:00"),
        endTime: new Date("2026-04-28T12:00:00"),
        isRecurring: false,
        recurrencePattern: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const slots = getFreeSlots(dayStart, dayEnd, events);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].startTime.getTime()).toBe(dayStart.getTime());
  });

  it("should assign habits based on priority", () => {
    const slots = [
      {
        startTime: new Date("2026-04-28T06:00:00"),
        endTime: new Date("2026-04-28T12:00:00"),
        durationMinutes: 360,
      },
    ];

    const habits: Habit[] = [
      {
        id: 1,
        userId: 1,
        name: "Morning Meditation",
        description: null,
        category: "wellness",
        priority: "high",
        durationMinutes: 30,
        frequency: "daily",
        targetDaysPerWeek: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const assignments = assignTasks(slots, habits);
    expect(assignments.length).toBe(1);
    expect(assignments[0].habitId).toBe(1);
  });

  it("should not assign habits to insufficient slots", () => {
    const slots = [
      {
        startTime: new Date("2026-04-28T06:00:00"),
        endTime: new Date("2026-04-28T06:15:00"),
        durationMinutes: 15,
      },
    ];

    const habits: Habit[] = [
      {
        id: 1,
        userId: 1,
        name: "Workout",
        description: null,
        category: "fitness",
        priority: "medium",
        durationMinutes: 60,
        frequency: "daily",
        targetDaysPerWeek: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const assignments = assignTasks(slots, habits);
    expect(assignments.length).toBe(0);
  });
});
