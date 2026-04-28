import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getFreeSlots, assignTasks } from "./scheduler";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Habits router
  habits: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserHabits(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        priority: z.enum(["low", "medium", "high"]),
        durationMinutes: z.number().min(1),
        frequency: z.enum(["daily", "weekly", "custom"]),
        targetDaysPerWeek: z.number().min(1).max(7).optional(),
      }))
      .mutation(({ ctx, input }) => db.createHabit({ ...input, userId: ctx.user.id })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        durationMinutes: z.number().optional(),
        frequency: z.enum(["daily", "weekly", "custom"]).optional(),
        targetDaysPerWeek: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => db.updateHabit(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteHabit(input.id)),
  }),

  // Timetable Events router
  timetable: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) => db.getUserTimetableEvents(ctx.user.id, input?.startDate, input?.endDate)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startTime: z.date(),
        endTime: z.date(),
        isRecurring: z.boolean().optional(),
        recurrencePattern: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createTimetableEvent({ ...input, userId: ctx.user.id })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        isRecurring: z.boolean().optional(),
        recurrencePattern: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateTimetableEvent(input.id, input)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteTimetableEvent(input.id)),
  }),

  // Scheduler router
  scheduler: router({
    getFreeSlots: protectedProcedure
      .input(z.object({
        date: z.date(),
        dayStartHour: z.number().min(0).max(23).default(6),
        dayEndHour: z.number().min(0).max(23).default(23),
      }))
      .query(async ({ ctx, input }) => {
        const dayStart = new Date(input.date);
        dayStart.setHours(input.dayStartHour, 0, 0, 0);
        const dayEnd = new Date(input.date);
        dayEnd.setHours(input.dayEndHour, 59, 59, 999);
        const events = await db.getUserTimetableEvents(ctx.user.id, dayStart, dayEnd);
        return getFreeSlots(dayStart, dayEnd, events);
      }),
    assignHabits: protectedProcedure
      .input(z.object({
        date: z.date(),
        dayStartHour: z.number().min(0).max(23).default(6),
        dayEndHour: z.number().min(0).max(23).default(23),
      }))
      .mutation(async ({ ctx, input }) => {
        const dayStart = new Date(input.date);
        dayStart.setHours(input.dayStartHour, 0, 0, 0);
        const dayEnd = new Date(input.date);
        dayEnd.setHours(input.dayEndHour, 59, 59, 999);
        const events = await db.getUserTimetableEvents(ctx.user.id, dayStart, dayEnd);
        const habits = await db.getUserHabits(ctx.user.id);
        const freeSlots = getFreeSlots(dayStart, dayEnd, events);
        const assignments = assignTasks(freeSlots, habits.filter(h => h.isActive));
        return assignments;
      }),
  }),

  // Scheduled Habits router
  scheduledHabits: router({
    list: protectedProcedure
      .input(z.object({ date: z.date().optional() }).optional())
      .query(({ ctx, input }) => db.getUserScheduledHabits(ctx.user.id, input?.date)),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "skipped", "rescheduled"]),
      }))
      .mutation(({ input }) => db.updateScheduledHabitStatus(input.id, input.status)),
  }),

  // Habit Completions router
  completions: router({
    list: protectedProcedure
      .input(z.object({
        habitId: z.number(),
        limit: z.number().default(30),
      }))
      .query(({ input }) => db.getHabitCompletions(input.habitId, input.limit)),
    create: protectedProcedure
      .input(z.object({
        habitId: z.number(),
        completedAt: z.date(),
        durationMinutes: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => db.createHabitCompletion({ ...input, userId: ctx.user.id, currentStreak: 0 })),
    getByDateRange: protectedProcedure
      .input(z.object({
        habitId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(({ input }) => db.getHabitCompletionsByDate(input.habitId, input.startDate, input.endDate)),
  }),

  // Habit Streaks router
  streaks: router({
    get: protectedProcedure
      .input(z.object({ habitId: z.number() }))
      .query(({ input }) => db.getHabitStreak(input.habitId)),
    update: protectedProcedure
      .input(z.object({
        habitId: z.number(),
        currentStreak: z.number(),
        bestStreak: z.number(),
        lastCompletedDate: z.date(),
      }))
      .mutation(({ input }) => db.updateHabitStreak(input.habitId, input.currentStreak, input.bestStreak, input.lastCompletedDate)),
  }),
});

export type AppRouter = typeof appRouter;
