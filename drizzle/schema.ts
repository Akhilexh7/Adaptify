export type UserRole = "user" | "admin";
export type HabitPriority = "low" | "medium" | "high";
export type HabitFrequency = "daily" | "weekly" | "custom";
export type ScheduledHabitStatus =
  | "pending"
  | "completed"
  | "skipped"
  | "rescheduled";

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface InsertUser {
  id?: number;
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
  lastSignedIn?: Date;
}

export interface Habit {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  category: string;
  priority: HabitPriority;
  durationMinutes: number;
  frequency: HabitFrequency;
  targetDaysPerWeek: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertHabit {
  id?: number;
  userId: number;
  name: string;
  description?: string | null;
  category: string;
  priority: HabitPriority;
  durationMinutes: number;
  frequency: HabitFrequency;
  targetDaysPerWeek?: number | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimetableEvent {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertTimetableEvent {
  id?: number;
  userId: number;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScheduledHabit {
  id: number;
  habitId: number;
  userId: number;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  status: ScheduledHabitStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertScheduledHabit {
  id?: number;
  habitId: number;
  userId: number;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  status?: ScheduledHabitStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HabitCompletion {
  id: number;
  habitId: number;
  userId: number;
  completedAt: Date;
  durationMinutes: number | null;
  notes: string | null;
  currentStreak: number | null;
  createdAt: Date;
}

export interface InsertHabitCompletion {
  id?: number;
  habitId: number;
  userId: number;
  completedAt: Date;
  durationMinutes?: number | null;
  notes?: string | null;
  currentStreak?: number | null;
  createdAt?: Date;
}

export interface HabitStreak {
  id: number;
  habitId: number;
  userId: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate: Date | null;
  updatedAt: Date;
}

export interface InsertHabitStreak {
  id?: number;
  habitId: number;
  userId: number;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDate?: Date | null;
  updatedAt?: Date;
}
