import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, time, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Habits table: stores user-defined habits with priority, duration, frequency, and category
 */
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "fitness", "learning", "wellness"
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  durationMinutes: int("durationMinutes").notNull(), // duration in minutes
  frequency: mysqlEnum("frequency", ["daily", "weekly", "custom"]).default("daily").notNull(),
  targetDaysPerWeek: int("targetDaysPerWeek").default(7), // for weekly frequency
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

/**
 * Timetable Events: stores fixed commitments (work, classes, meetings, etc.)
 */
export const timetableEvents = mysqlTable("timetable_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurrencePattern: varchar("recurrencePattern", { length: 50 }), // e.g., "daily", "weekly", "weekdays"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimetableEvent = typeof timetableEvents.$inferSelect;
export type InsertTimetableEvent = typeof timetableEvents.$inferInsert;

/**
 * Scheduled Habits: stores the scheduled time slots for habits
 */
export const scheduledHabits = mysqlTable("scheduled_habits", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "skipped", "rescheduled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledHabit = typeof scheduledHabits.$inferSelect;
export type InsertScheduledHabit = typeof scheduledHabits.$inferInsert;

/**
 * Habit Completions: tracks when habits are completed with timestamps and streak data
 */
export const habitCompletions = mysqlTable("habit_completions", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  completedAt: timestamp("completedAt").notNull(),
  durationMinutes: int("durationMinutes"), // actual duration spent
  notes: text("notes"),
  currentStreak: int("currentStreak").default(0), // streak count at time of completion
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = typeof habitCompletions.$inferInsert;

/**
 * Habit Streaks: tracks current and best streaks for each habit
 */
export const habitStreaks = mysqlTable("habit_streaks", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  bestStreak: int("bestStreak").default(0).notNull(),
  lastCompletedDate: timestamp("lastCompletedDate"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HabitStreak = typeof habitStreaks.$inferSelect;
export type InsertHabitStreak = typeof habitStreaks.$inferInsert;

// Relations
export const habitsRelations = relations(habits, ({ many }) => ({
  completions: many(habitCompletions),
  scheduled: many(scheduledHabits),
  streaks: many(habitStreaks),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
}));

export const scheduledHabitsRelations = relations(scheduledHabits, ({ one }) => ({
  habit: one(habits, {
    fields: [scheduledHabits.habitId],
    references: [habits.id],
  }),
}));

export const habitStreaksRelations = relations(habitStreaks, ({ one }) => ({
  habit: one(habits, {
    fields: [habitStreaks.habitId],
    references: [habits.id],
  }),
}));

export const timetableEventsRelations = relations(timetableEvents, ({ one }) => ({
  user: one(users, {
    fields: [timetableEvents.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  timetableEvents: many(timetableEvents),
  scheduledHabits: many(scheduledHabits),
  habitCompletions: many(habitCompletions),
  habitStreaks: many(habitStreaks),
}));