import { TimetableEvent, Habit, ScheduledHabit } from "../drizzle/schema";

export interface FreeSlot {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

export interface HabitAssignment {
  habitId: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Detects free time slots in a user's day based on their timetable events
 * @param dayStart - Start of the day (typically 00:00)
 * @param dayEnd - End of the day (typically 23:59)
 * @param timetableEvents - Array of fixed commitments
 * @returns Array of free time slots
 */
export function getFreeSlots(
  dayStart: Date,
  dayEnd: Date,
  timetableEvents: TimetableEvent[]
): FreeSlot[] {
  // Sort events by start time
  const sortedEvents = [...timetableEvents].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const slots: FreeSlot[] = [];
  let currentTime = new Date(dayStart);

  for (const event of sortedEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Skip events outside the day
    if (eventEnd <= currentTime) continue;
    if (eventStart >= dayEnd) break;

    // Clamp event times to day boundaries
    const clampedStart = new Date(Math.max(eventStart.getTime(), dayStart.getTime()));
    const clampedEnd = new Date(Math.min(eventEnd.getTime(), dayEnd.getTime()));

    // If there's a gap before this event, add it as a free slot
    if (currentTime < clampedStart) {
      const durationMs = clampedStart.getTime() - currentTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      if (durationMinutes > 0) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(clampedStart),
          durationMinutes,
        });
      }
    }

    currentTime = new Date(Math.max(currentTime.getTime(), clampedEnd.getTime()));
  }

  // Add remaining time until day end
  if (currentTime < dayEnd) {
    const durationMs = dayEnd.getTime() - currentTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    if (durationMinutes > 0) {
      slots.push({
        startTime: new Date(currentTime),
        endTime: new Date(dayEnd),
        durationMinutes,
      });
    }
  }

  return slots;
}

/**
 * Assigns habits to free slots based on priority and time requirements
 * Priority rules:
 * - High priority habits get first choice of slots
 * - Focus tasks (learning, work) prefer morning slots
 * - Physical habits prefer evening slots
 * - Light habits (reading, reflection) prefer night slots
 * @param freeSlots - Available time slots
 * @param habits - Habits to assign
 * @returns Array of habit assignments
 */
export function assignTasks(
  freeSlots: FreeSlot[],
  habits: Habit[]
): HabitAssignment[] {
  const assignments: HabitAssignment[] = [];
  const availableSlots = [...freeSlots];

  // Sort habits by priority (high > medium > low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedHabits = [...habits].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  for (const habit of sortedHabits) {
    // Find the best slot for this habit
    const bestSlotIndex = findBestSlot(
      availableSlots,
      habit,
      assignments.length
    );

    if (bestSlotIndex !== -1) {
      const slot = availableSlots[bestSlotIndex];

      // Create assignment
      const startTime = new Date(slot.startTime);
      const endTime = new Date(startTime.getTime() + habit.durationMinutes * 60 * 1000);

      assignments.push({
        habitId: habit.id,
        startTime,
        endTime,
      });

      // Update the slot
      const remainingMinutes = slot.durationMinutes - habit.durationMinutes;
      if (remainingMinutes > 0) {
        availableSlots[bestSlotIndex] = {
          startTime: endTime,
          endTime: slot.endTime,
          durationMinutes: remainingMinutes,
        };
      } else {
        availableSlots.splice(bestSlotIndex, 1);
      }
    }
  }

  return assignments;
}

/**
 * Finds the best slot for a habit based on category and time preferences
 */
function findBestSlot(
  slots: FreeSlot[],
  habit: Habit,
  dayProgress: number
): number {
  let bestIndex = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];

    // Check if slot is large enough
    if (slot.durationMinutes < habit.durationMinutes) {
      continue;
    }

    // Calculate score based on time of day and category
    let score = 0;

    const hour = slot.startTime.getHours();

    // Category-based time preferences
    if (habit.category === "learning" || habit.category === "work") {
      // Prefer morning (6-12)
      if (hour >= 6 && hour < 12) score += 100;
      else if (hour >= 12 && hour < 18) score += 50;
      else score -= 50;
    } else if (habit.category === "fitness" || habit.category === "exercise") {
      // Prefer evening (17-21)
      if (hour >= 17 && hour < 21) score += 100;
      else if (hour >= 6 && hour < 12) score += 50;
      else score -= 50;
    } else if (habit.category === "wellness" || habit.category === "reflection") {
      // Prefer night (20-23)
      if (hour >= 20 && hour < 23) score += 100;
      else if (hour >= 18 && hour < 20) score += 50;
      else score -= 50;
    }

    // Prefer slots that fit exactly or with minimal waste
    const waste = slot.durationMinutes - habit.durationMinutes;
    score += Math.max(0, 50 - waste);

    // Prefer earlier slots for high priority habits
    if (habit.priority === "high") {
      score += Math.max(0, 50 - hour);
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/**
 * Reschedules habits when a timetable event is cancelled or modified
 * @param freeSlots - Newly available free slots
 * @param unscheduledHabits - Habits that need to be rescheduled
 * @returns Array of new habit assignments
 */
export function reschedule(
  freeSlots: FreeSlot[],
  unscheduledHabits: Habit[]
): HabitAssignment[] {
  return assignTasks(freeSlots, unscheduledHabits);
}

/**
 * Calculates habit completion statistics
 */
export interface HabitStats {
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  averageDailyCompletions: number;
}

export function calculateHabitStats(
  completions: any[],
  targetDaysPerWeek: number,
  daysTracked: number
): HabitStats {
  const totalCompletions = completions.length;
  const completionRate = daysTracked > 0 ? (totalCompletions / (daysTracked * (targetDaysPerWeek / 7))) * 100 : 0;
  const averageDailyCompletions = daysTracked > 0 ? totalCompletions / daysTracked : 0;

  return {
    totalCompletions,
    completionRate: Math.min(100, Math.round(completionRate)),
    currentStreak: 0,
    bestStreak: 0,
    averageDailyCompletions: Math.round(averageDailyCompletions * 100) / 100,
  };
}
