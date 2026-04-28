import { eq, and, gte, lte, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, habits, InsertHabit, Habit, timetableEvents, InsertTimetableEvent, TimetableEvent, scheduledHabits, InsertScheduledHabit, ScheduledHabit, habitCompletions, InsertHabitCompletion, HabitCompletion, habitStreaks, InsertHabitStreak, HabitStreak } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Habit queries
export async function createHabit(habit: InsertHabit): Promise<Habit | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(habits).values(habit);
  const id = result[0]?.insertId;
  if (!id) return null;
  return db.select().from(habits).where(eq(habits.id, id as number)).limit(1).then(r => r[0] || null);
}

export async function getUserHabits(userId: number): Promise<Habit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habits).where(eq(habits.userId, userId));
}

export async function getHabitById(habitId: number): Promise<Habit | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(habits).where(eq(habits.id, habitId)).limit(1);
  return result[0] || null;
}

export async function updateHabit(habitId: number, updates: Partial<InsertHabit>): Promise<Habit | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(habits).set(updates).where(eq(habits.id, habitId));
  return getHabitById(habitId);
}

export async function deleteHabit(habitId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(habits).where(eq(habits.id, habitId));
  return true;
}

// Timetable Event queries
export async function createTimetableEvent(event: InsertTimetableEvent): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(timetableEvents).values(event);
  const id = result[0]?.insertId;
  if (!id) return null;
  return db.select().from(timetableEvents).where(eq(timetableEvents.id, id as number)).limit(1).then(r => r[0] || null);
}

export async function getUserTimetableEvents(userId: number, startDate?: Date, endDate?: Date): Promise<TimetableEvent[]> {
  const db = await getDb();
  if (!db) return [];
  if (startDate && endDate) {
    return db.select().from(timetableEvents).where(and(eq(timetableEvents.userId, userId), gte(timetableEvents.startTime, startDate), lte(timetableEvents.endTime, endDate)));
  }
  return db.select().from(timetableEvents).where(eq(timetableEvents.userId, userId));
}

export async function getTimetableEventById(eventId: number): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(timetableEvents).where(eq(timetableEvents.id, eventId)).limit(1);
  return result[0] || null;
}

export async function updateTimetableEvent(eventId: number, updates: Partial<InsertTimetableEvent>): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(timetableEvents).set(updates).where(eq(timetableEvents.id, eventId));
  return getTimetableEventById(eventId);
}

export async function deleteTimetableEvent(eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(timetableEvents).where(eq(timetableEvents.id, eventId));
  return true;
}

// Scheduled Habit queries
export async function createScheduledHabit(scheduled: InsertScheduledHabit): Promise<ScheduledHabit | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(scheduledHabits).values(scheduled);
  const id = result[0]?.insertId;
  if (!id) return null;
  return db.select().from(scheduledHabits).where(eq(scheduledHabits.id, id as number)).limit(1).then(r => r[0] || null);
}

export async function getUserScheduledHabits(userId: number, date?: Date): Promise<ScheduledHabit[]> {
  const db = await getDb();
  if (!db) return [];
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    return db.select().from(scheduledHabits).where(and(eq(scheduledHabits.userId, userId), gte(scheduledHabits.scheduledDate, dayStart), lte(scheduledHabits.scheduledDate, dayEnd)));
  }
  return db.select().from(scheduledHabits).where(eq(scheduledHabits.userId, userId));
}

export async function updateScheduledHabitStatus(scheduledId: number, status: "pending" | "completed" | "skipped" | "rescheduled"): Promise<ScheduledHabit | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(scheduledHabits).set({ status }).where(eq(scheduledHabits.id, scheduledId));
  const result = await db.select().from(scheduledHabits).where(eq(scheduledHabits.id, scheduledId)).limit(1);
  return result[0] || null;
}

// Habit Completion queries
export async function createHabitCompletion(completion: InsertHabitCompletion): Promise<HabitCompletion | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(habitCompletions).values(completion);
  const id = result[0]?.insertId;
  if (!id) return null;
  return db.select().from(habitCompletions).where(eq(habitCompletions.id, id as number)).limit(1).then(r => r[0] || null);
}

export async function getHabitCompletions(habitId: number, limit: number = 30): Promise<HabitCompletion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habitCompletions).where(eq(habitCompletions.habitId, habitId)).orderBy(desc(habitCompletions.completedAt)).limit(limit);
}

export async function getHabitCompletionsByDate(habitId: number, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habitCompletions).where(and(eq(habitCompletions.habitId, habitId), gte(habitCompletions.completedAt, startDate), lte(habitCompletions.completedAt, endDate))).orderBy(desc(habitCompletions.completedAt));
}

// Habit Streak queries
export async function getOrCreateHabitStreak(habitId: number, userId: number): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(habitStreaks).where(eq(habitStreaks.habitId, habitId)).limit(1);
  if (existing.length > 0) return existing[0];
  const result = await db.insert(habitStreaks).values({ habitId, userId, currentStreak: 0, bestStreak: 0 });
  const id = result[0]?.insertId;
  if (!id) return null;
  return db.select().from(habitStreaks).where(eq(habitStreaks.id, id as number)).limit(1).then(r => r[0] || null);
}

export async function updateHabitStreak(habitId: number, currentStreak: number, bestStreak: number, lastCompletedDate: Date): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(habitStreaks).set({ currentStreak, bestStreak, lastCompletedDate }).where(eq(habitStreaks.habitId, habitId));
  const result = await db.select().from(habitStreaks).where(eq(habitStreaks.habitId, habitId)).limit(1);
  return result[0] || null;
}

export async function getHabitStreak(habitId: number): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(habitStreaks).where(eq(habitStreaks.habitId, habitId)).limit(1);
  return result[0] || null;
}
