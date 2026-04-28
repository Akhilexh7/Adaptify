import { MongoClient, type Db } from "mongodb";
import type {
  Habit,
  HabitCompletion,
  HabitStreak,
  InsertHabit,
  InsertHabitCompletion,
  InsertHabitStreak,
  InsertScheduledHabit,
  InsertTimetableEvent,
  InsertUser,
  ScheduledHabit,
  ScheduledHabitStatus,
  TimetableEvent,
  User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _client: MongoClient | null = null;
let _db: Db | null = null;
let _indexesReady = false;
let _connectionError: string | null = null;

type CounterName =
  | "users"
  | "habits"
  | "timetable_events"
  | "scheduled_habits"
  | "habit_completions"
  | "habit_streaks";

const getDatabaseName = () => {
  if (!ENV.databaseUrl) return "smart-habit-tracker";

  try {
    const parsed = new URL(ENV.databaseUrl);
    const pathname = parsed.pathname.replace(/^\//, "");
    return pathname || "smart-habit-tracker";
  } catch {
    return "smart-habit-tracker";
  }
};

const normalizeUser = (doc: any): User => ({
  id: doc.id,
  openId: doc.openId,
  name: doc.name ?? null,
  email: doc.email ?? null,
  loginMethod: doc.loginMethod ?? null,
  role: doc.role ?? "user",
  createdAt: new Date(doc.createdAt),
  updatedAt: new Date(doc.updatedAt),
  lastSignedIn: new Date(doc.lastSignedIn),
});

const normalizeHabit = (doc: any): Habit => ({
  id: doc.id,
  userId: doc.userId,
  name: doc.name,
  description: doc.description ?? null,
  category: doc.category,
  priority: doc.priority,
  durationMinutes: doc.durationMinutes,
  frequency: doc.frequency,
  targetDaysPerWeek: doc.targetDaysPerWeek ?? null,
  isActive: doc.isActive ?? true,
  createdAt: new Date(doc.createdAt),
  updatedAt: new Date(doc.updatedAt),
});

const normalizeTimetableEvent = (doc: any): TimetableEvent => ({
  id: doc.id,
  userId: doc.userId,
  title: doc.title,
  description: doc.description ?? null,
  startTime: new Date(doc.startTime),
  endTime: new Date(doc.endTime),
  isRecurring: doc.isRecurring ?? false,
  recurrencePattern: doc.recurrencePattern ?? null,
  createdAt: new Date(doc.createdAt),
  updatedAt: new Date(doc.updatedAt),
});

const normalizeScheduledHabit = (doc: any): ScheduledHabit => ({
  id: doc.id,
  habitId: doc.habitId,
  userId: doc.userId,
  scheduledDate: new Date(doc.scheduledDate),
  startTime: new Date(doc.startTime),
  endTime: new Date(doc.endTime),
  status: doc.status ?? "pending",
  createdAt: new Date(doc.createdAt),
  updatedAt: new Date(doc.updatedAt),
});

const normalizeHabitCompletion = (doc: any): HabitCompletion => ({
  id: doc.id,
  habitId: doc.habitId,
  userId: doc.userId,
  completedAt: new Date(doc.completedAt),
  durationMinutes: doc.durationMinutes ?? null,
  notes: doc.notes ?? null,
  currentStreak: doc.currentStreak ?? null,
  createdAt: new Date(doc.createdAt),
});

const normalizeHabitStreak = (doc: any): HabitStreak => ({
  id: doc.id,
  habitId: doc.habitId,
  userId: doc.userId,
  currentStreak: doc.currentStreak,
  bestStreak: doc.bestStreak,
  lastCompletedDate: doc.lastCompletedDate ? new Date(doc.lastCompletedDate) : null,
  updatedAt: new Date(doc.updatedAt),
});

async function ensureIndexes(db: Db) {
  if (_indexesReady) return;

  await Promise.all([
    db.collection("users").createIndex({ id: 1 }, { unique: true }),
    db.collection("users").createIndex({ openId: 1 }, { unique: true }),
    db.collection("habits").createIndex({ id: 1 }, { unique: true }),
    db.collection("habits").createIndex({ userId: 1 }),
    db.collection("timetable_events").createIndex({ id: 1 }, { unique: true }),
    db.collection("timetable_events").createIndex({ userId: 1, startTime: 1, endTime: 1 }),
    db.collection("scheduled_habits").createIndex({ id: 1 }, { unique: true }),
    db.collection("scheduled_habits").createIndex({ userId: 1, scheduledDate: 1 }),
    db.collection("habit_completions").createIndex({ id: 1 }, { unique: true }),
    db.collection("habit_completions").createIndex({ habitId: 1, completedAt: -1 }),
    db.collection("habit_streaks").createIndex({ id: 1 }, { unique: true }),
    db.collection("habit_streaks").createIndex({ habitId: 1 }, { unique: true }),
  ]);

  _indexesReady = true;
}

async function getNextSequence(name: CounterName): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const counters = db.collection<{ _id: CounterName; seq: number }>("counters");
  const result = await counters.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  return result?.seq ?? 1;
}

// Lazily create the MongoDB instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _client = new MongoClient(ENV.databaseUrl);
      await _client.connect();
      _db = _client.db(getDatabaseName());
      await ensureIndexes(_db);
      _connectionError = null;
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _connectionError = error instanceof Error ? error.message : String(error);
      _client = null;
      _db = null;
    }
  }

  return _db;
}

export async function connectDb(): Promise<Db | null> {
  const db = await getDb();

  if (db) {
    try {
      await db.command({ ping: 1 });
      _connectionError = null;
      return db;
    } catch (error) {
      _connectionError = error instanceof Error ? error.message : String(error);
      console.warn("[Database] Ping failed:", error);
      return null;
    }
  }

  if (!ENV.databaseUrl) {
    _connectionError = "DATABASE_URL is not configured";
  }

  return null;
}

export function getDatabaseStatus() {
  return {
    configured: Boolean(ENV.databaseUrl),
    connected: Boolean(_db),
    databaseName: getDatabaseName(),
    error: _connectionError,
  };
}

function requireDbOrThrow(db: Db | null, action: string): Db {
  if (db) return db;

  const status = getDatabaseStatus();
  const reason =
    status.error ??
    (status.configured
      ? "MongoDB is not reachable"
      : "DATABASE_URL is not configured");

  throw new Error(`[Database] Cannot ${action}: ${reason}`);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "upsert user");

  const users = readyDb.collection("users");
  const existing = await users.findOne({ openId: user.openId });
  const now = new Date();

  if (existing) {
    await users.updateOne(
      { openId: user.openId },
      {
        $set: {
          ...(user.name !== undefined ? { name: user.name ?? null } : {}),
          ...(user.email !== undefined ? { email: user.email ?? null } : {}),
          ...(user.loginMethod !== undefined
            ? { loginMethod: user.loginMethod ?? null }
            : {}),
          ...(user.role !== undefined ? { role: user.role } : {}),
          lastSignedIn: user.lastSignedIn ?? now,
          updatedAt: now,
        },
      }
    );
    return;
  }

  const id = await getNextSequence("users");
  await users.insertOne({
    id,
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
    createdAt: user.createdAt ?? now,
    updatedAt: user.updatedAt ?? now,
    lastSignedIn: user.lastSignedIn ?? now,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "get user");

  const user = await readyDb.collection("users").findOne({ openId });
  return user ? normalizeUser(user) : undefined;
}

// Habit queries
export async function createHabit(habit: InsertHabit): Promise<Habit | null> {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "create habit");

  const id = await getNextSequence("habits");
  const now = new Date();
  const created: Habit = {
    id,
    userId: habit.userId,
    name: habit.name,
    description: habit.description ?? null,
    category: habit.category,
    priority: habit.priority,
    durationMinutes: habit.durationMinutes,
    frequency: habit.frequency,
    targetDaysPerWeek: habit.targetDaysPerWeek ?? 7,
    isActive: habit.isActive ?? true,
    createdAt: habit.createdAt ?? now,
    updatedAt: habit.updatedAt ?? now,
  };

  await readyDb.collection("habits").insertOne(created);
  return created;
}

export async function getUserHabits(userId: number): Promise<Habit[]> {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "list habits");

  const habits = await readyDb.collection("habits").find({ userId }).sort({ createdAt: 1 }).toArray();
  return habits.map(normalizeHabit);
}

export async function getHabitById(habitId: number): Promise<Habit | null> {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "get habit");

  const habit = await readyDb.collection("habits").findOne({ id: habitId });
  return habit ? normalizeHabit(habit) : null;
}

export async function updateHabit(
  habitId: number,
  updates: Partial<InsertHabit>
): Promise<Habit | null> {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "update habit");

  await readyDb.collection("habits").updateOne(
    { id: habitId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  return getHabitById(habitId);
}

export async function deleteHabit(habitId: number): Promise<boolean> {
  const db = await getDb();
  const readyDb = requireDbOrThrow(db, "delete habit");

  await readyDb.collection("habits").deleteOne({ id: habitId });
  return true;
}

// Timetable Event queries
export async function createTimetableEvent(
  event: InsertTimetableEvent
): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const id = await getNextSequence("timetable_events");
  const now = new Date();
  const created: TimetableEvent = {
    id,
    userId: event.userId,
    title: event.title,
    description: event.description ?? null,
    startTime: event.startTime,
    endTime: event.endTime,
    isRecurring: event.isRecurring ?? false,
    recurrencePattern: event.recurrencePattern ?? null,
    createdAt: event.createdAt ?? now,
    updatedAt: event.updatedAt ?? now,
  };

  await db.collection("timetable_events").insertOne(created);
  return created;
}

export async function getUserTimetableEvents(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<TimetableEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const filter: Record<string, unknown> = { userId };
  if (startDate && endDate) {
    filter.startTime = { $gte: startDate };
    filter.endTime = { $lte: endDate };
  }

  const events = await db
    .collection("timetable_events")
    .find(filter)
    .sort({ startTime: 1 })
    .toArray();

  return events.map(normalizeTimetableEvent);
}

export async function getTimetableEventById(
  eventId: number
): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;

  const event = await db.collection("timetable_events").findOne({ id: eventId });
  return event ? normalizeTimetableEvent(event) : null;
}

export async function updateTimetableEvent(
  eventId: number,
  updates: Partial<InsertTimetableEvent>
): Promise<TimetableEvent | null> {
  const db = await getDb();
  if (!db) return null;

  await db.collection("timetable_events").updateOne(
    { id: eventId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    }
  );

  return getTimetableEventById(eventId);
}

export async function deleteTimetableEvent(eventId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.collection("timetable_events").deleteOne({ id: eventId });
  return true;
}

// Scheduled Habit queries
export async function createScheduledHabit(
  scheduled: InsertScheduledHabit
): Promise<ScheduledHabit | null> {
  const db = await getDb();
  if (!db) return null;

  const id = await getNextSequence("scheduled_habits");
  const now = new Date();
  const created: ScheduledHabit = {
    id,
    habitId: scheduled.habitId,
    userId: scheduled.userId,
    scheduledDate: scheduled.scheduledDate,
    startTime: scheduled.startTime,
    endTime: scheduled.endTime,
    status: scheduled.status ?? "pending",
    createdAt: scheduled.createdAt ?? now,
    updatedAt: scheduled.updatedAt ?? now,
  };

  await db.collection("scheduled_habits").insertOne(created);
  return created;
}

export async function getUserScheduledHabits(
  userId: number,
  date?: Date
): Promise<ScheduledHabit[]> {
  const db = await getDb();
  if (!db) return [];

  const filter: Record<string, unknown> = { userId };
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    filter.scheduledDate = { $gte: dayStart, $lte: dayEnd };
  }

  const scheduled = await db
    .collection("scheduled_habits")
    .find(filter)
    .sort({ scheduledDate: 1, startTime: 1 })
    .toArray();

  return scheduled.map(normalizeScheduledHabit);
}

export async function updateScheduledHabitStatus(
  scheduledId: number,
  status: ScheduledHabitStatus
): Promise<ScheduledHabit | null> {
  const db = await getDb();
  if (!db) return null;

  await db.collection("scheduled_habits").updateOne(
    { id: scheduledId },
    {
      $set: {
        status,
        updatedAt: new Date(),
      },
    }
  );

  const updated = await db.collection("scheduled_habits").findOne({ id: scheduledId });
  return updated ? normalizeScheduledHabit(updated) : null;
}

// Habit Completion queries
export async function createHabitCompletion(
  completion: InsertHabitCompletion
): Promise<HabitCompletion | null> {
  const db = await getDb();
  if (!db) return null;

  const id = await getNextSequence("habit_completions");
  const created: HabitCompletion = {
    id,
    habitId: completion.habitId,
    userId: completion.userId,
    completedAt: completion.completedAt,
    durationMinutes: completion.durationMinutes ?? null,
    notes: completion.notes ?? null,
    currentStreak: completion.currentStreak ?? 0,
    createdAt: completion.createdAt ?? new Date(),
  };

  await db.collection("habit_completions").insertOne(created);
  return created;
}

export async function getHabitCompletions(
  habitId: number,
  limit = 30
): Promise<HabitCompletion[]> {
  const db = await getDb();
  if (!db) return [];

  const completions = await db
    .collection("habit_completions")
    .find({ habitId })
    .sort({ completedAt: -1 })
    .limit(limit)
    .toArray();

  return completions.map(normalizeHabitCompletion);
}

export async function getHabitCompletionsByDate(
  habitId: number,
  startDate: Date,
  endDate: Date
): Promise<HabitCompletion[]> {
  const db = await getDb();
  if (!db) return [];

  const completions = await db
    .collection("habit_completions")
    .find({
      habitId,
      completedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
    .sort({ completedAt: -1 })
    .toArray();

  return completions.map(normalizeHabitCompletion);
}

// Habit Streak queries
export async function getOrCreateHabitStreak(
  habitId: number,
  userId: number
): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.collection("habit_streaks").findOne({ habitId });
  if (existing) {
    return normalizeHabitStreak(existing);
  }

  const id = await getNextSequence("habit_streaks");
  const created: HabitStreak = {
    id,
    habitId,
    userId,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    updatedAt: new Date(),
  };

  await db.collection("habit_streaks").insertOne(created);
  return created;
}

export async function updateHabitStreak(
  habitId: number,
  currentStreak: number,
  bestStreak: number,
  lastCompletedDate: Date
): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;

  await db.collection("habit_streaks").updateOne(
    { habitId },
    {
      $set: {
        currentStreak,
        bestStreak,
        lastCompletedDate,
        updatedAt: new Date(),
      },
    }
  );

  const streak = await db.collection("habit_streaks").findOne({ habitId });
  return streak ? normalizeHabitStreak(streak) : null;
}

export async function getHabitStreak(habitId: number): Promise<HabitStreak | null> {
  const db = await getDb();
  if (!db) return null;

  const streak = await db.collection("habit_streaks").findOne({ habitId });
  return streak ? normalizeHabitStreak(streak) : null;
}
