# Smart Habit Tracker + Dynamic Scheduler

A premium, real-time adaptive scheduling system that intelligently fits personal habits into your daily life around fixed commitments. Built with a modern tech stack and a beautiful dark-themed UI.

## 🎯 Overview

**Smart Habit Tracker** is a full-stack web application that solves the challenge of maintaining habits while juggling a busy schedule. Instead of manually scheduling habits, the app automatically detects free time slots in your day and assigns habits based on priority and optimal timing. When your schedule changes, habits are dynamically rescheduled to fit newly available slots.

### Key Features

- **Intelligent Scheduling**: Automatically detects free time slots and assigns habits based on priority and category-specific timing preferences
- **Dynamic Rescheduling**: When fixed events are cancelled or modified, habits instantly adapt to new free slots
- **Real-Time Dashboard**: View your daily and weekly schedule with a beautiful timeline interface
- **Habit Management**: Create, edit, and delete habits with customizable priority, duration, frequency, and category
- **Completion Tracking**: Mark habits as complete, track streaks, and monitor progress with visual indicators
- **Advanced Analytics**: Visualize habit completion rates, streaks, and productivity insights with Recharts
- **Responsive Design**: Premium dark-themed UI that works seamlessly on desktop, tablet, and mobile
- **Authentication**: Secure Manus OAuth integration with session management

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components for consistent design
- Recharts for data visualization
- Wouter for routing
- tRPC React Query for type-safe API calls

**Backend:**
- Node.js + Express
- tRPC for end-to-end type safety
- Drizzle ORM for database management
- MySQL for data persistence

**Authentication:**
- Manus OAuth for secure user authentication
- Session-based authentication with JWT

### Database Schema

The application uses the following core tables:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `habits` | User-defined habits with metadata |
| `timetable_events` | Fixed commitments (work, classes, meetings) |
| `scheduled_habits` | Scheduled time slots for habits |
| `habit_completions` | Completion history and tracking |
| `habit_streaks` | Current and best streaks for each habit |

### Scheduling Algorithm

The scheduling engine implements intelligent habit assignment:

1. **Free Slot Detection**: Analyzes timetable events to identify available time windows
2. **Priority-Based Assignment**: High-priority habits get first choice of slots
3. **Category-Specific Timing**:
   - Focus tasks (learning, work) → Morning slots (6-12)
   - Physical habits (fitness, exercise) → Evening slots (17-21)
   - Light habits (wellness, reflection) → Night slots (20-23)
4. **Optimal Fit**: Prefers slots that minimize waste and match habit duration
5. **Dynamic Rescheduling**: When events change, unscheduled habits are reassigned to new free slots

## 📁 Project Structure

```
smart-habit-tracker/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── HabitsPage.tsx      # Habit management
│   │   │   └── AnalyticsPage.tsx   # Analytics & insights
│   │   ├── components/             # Reusable UI components
│   │   │   ├── DashboardLayoutCustom.tsx  # Sidebar layout
│   │   │   └── ui/                # shadcn/ui components
│   │   ├── lib/
│   │   │   └── trpc.ts            # tRPC client setup
│   │   ├── App.tsx                # Main app routing
│   │   └── index.css              # Global styles
│   └── public/                     # Static assets
├── server/                          # Backend Node.js/Express
│   ├── routers.ts                 # tRPC procedure definitions
│   ├── db.ts                      # Database query helpers
│   ├── scheduler.ts               # Scheduling algorithm
│   └── _core/                     # Framework infrastructure
├── drizzle/                         # Database schema & migrations
│   ├── schema.ts                  # Table definitions
│   └── migrations/                # SQL migration files
├── shared/                          # Shared types & constants
└── package.json                    # Dependencies & scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ and pnpm
- MySQL database
- Manus OAuth credentials

### Installation

1. **Clone the repository** (or use the provided project):
   ```bash
   cd smart-habit-tracker
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   The following environment variables are automatically injected:
   - `DATABASE_URL`: MySQL connection string
   - `JWT_SECRET`: Session signing secret
   - `VITE_APP_ID`: Manus OAuth app ID
   - `OAUTH_SERVER_URL`: Manus OAuth server URL
   - `VITE_OAUTH_PORTAL_URL`: Manus login portal URL

4. **Run database migrations**:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Build for Production

```bash
pnpm build
pnpm start
```

## 📖 Usage Guide

### User Workflow

1. **Sign In**: Click "Sign In" on the landing page and authenticate with Manus OAuth
2. **Create Habits**: Navigate to the Habits section and create your habits with:
   - Name and description
   - Category (fitness, learning, work, wellness, reflection)
   - Priority (low, medium, high)
   - Duration in minutes
   - Frequency (daily, weekly, custom)

3. **Add Fixed Events**: Go to Schedule and add your fixed commitments:
   - Work hours
   - Classes
   - Meetings
   - Any other fixed time blocks

4. **Auto-Schedule**: The system automatically detects free slots and assigns habits
5. **Track Progress**: Mark habits as complete in the dashboard
6. **View Analytics**: Check the Analytics page for insights on completion rates and streaks

### Dashboard Features

- **Daily View**: See your schedule for a specific day with fixed events and scheduled habits
- **Weekly View**: Overview of your week's habits and schedule
- **Free Slots**: Visual representation of available time windows
- **Quick Stats**: Total habits, scheduled today, and available free time

## 🔌 API Reference

### tRPC Procedures

All procedures are type-safe and available through the `trpc` client.

#### Habits Router

```typescript
// List all user habits
trpc.habits.list.useQuery()

// Create a new habit
trpc.habits.create.useMutation({
  name: string
  description?: string
  category: string
  priority: "low" | "medium" | "high"
  durationMinutes: number
  frequency: "daily" | "weekly" | "custom"
  targetDaysPerWeek?: number
})

// Update a habit
trpc.habits.update.useMutation({
  id: number
  // ... partial fields to update
})

// Delete a habit
trpc.habits.delete.useMutation({ id: number })
```

#### Timetable Router

```typescript
// List timetable events
trpc.timetable.list.useQuery({
  startDate?: Date
  endDate?: Date
})

// Create a timetable event
trpc.timetable.create.useMutation({
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isRecurring?: boolean
  recurrencePattern?: string
})

// Update a timetable event
trpc.timetable.update.useMutation({
  id: number
  // ... partial fields to update
})

// Delete a timetable event
trpc.timetable.delete.useMutation({ id: number })
```

#### Scheduler Router

```typescript
// Get free slots for a day
trpc.scheduler.getFreeSlots.useQuery({
  date: Date
  dayStartHour?: number  // default: 6
  dayEndHour?: number    // default: 23
})

// Assign habits to free slots
trpc.scheduler.assignHabits.useMutation({
  date: Date
  dayStartHour?: number
  dayEndHour?: number
})
```

#### Completions Router

```typescript
// Get completion history for a habit
trpc.completions.list.useQuery({
  habitId: number
  limit?: number  // default: 30
})

// Mark a habit as complete
trpc.completions.create.useMutation({
  habitId: number
  completedAt: Date
  durationMinutes?: number
  notes?: string
})

// Get completions in a date range
trpc.completions.getByDateRange.useQuery({
  habitId: number
  startDate: Date
  endDate: Date
})
```

#### Streaks Router

```typescript
// Get streak info for a habit
trpc.streaks.get.useQuery({ habitId: number })

// Update streak counters
trpc.streaks.update.useMutation({
  habitId: number
  currentStreak: number
  bestStreak: number
  lastCompletedDate: Date
})
```

## 🎨 Design System

### Color Palette (Dark Theme)

- **Background**: `#000000` / `#09090b` (zinc-950)
- **Card**: `#18181b` (zinc-900)
- **Foreground**: `#fafafa` (zinc-50)
- **Muted Foreground**: `#a1a1aa` (zinc-400)
- **Primary**: `#3b82f6` (blue-500)
- **Destructive**: `#ef4444` (red-500)
- **Border**: `#27272a` (zinc-800)

### Component Library

The application uses shadcn/ui components for consistency:
- Button, Card, Dialog, Input, Label, Select
- Tabs, Badge, Progress, Tooltip
- And more...

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

Tests are written with Vitest and located alongside source files with `.test.ts` extension.

## 🔒 Security

- **Authentication**: Manus OAuth with secure session cookies
- **Authorization**: Protected procedures verify user identity
- **Database**: Parameterized queries prevent SQL injection
- **Environment Variables**: Sensitive data stored in environment, not in code

## 📊 Analytics Implementation

The Analytics page uses **Recharts** for data visualization:

- **Line Chart**: Weekly completion rate trends
- **Bar Chart**: Current vs best streaks for each habit
- **Pie Chart**: Distribution of habits by category

Charts are fully responsive and work on all screen sizes.

## 🚧 Future Enhancements

- Social features (share habits, compete with friends)
- Mobile app with push notifications
- AI-powered habit recommendations
- Integration with calendar services (Google Calendar, Outlook)
- Advanced filtering and search
- Habit templates and presets
- Team/group habit tracking
- Export data to CSV/PDF

## 📝 Development Notes

### Adding New Features

1. **Update Database Schema**: Modify `drizzle/schema.ts`
2. **Generate Migration**: Run `pnpm drizzle-kit generate`
3. **Add Query Helpers**: Update `server/db.ts`
4. **Create tRPC Procedures**: Add to `server/routers.ts`
5. **Build UI Components**: Create in `client/src/pages/` or `client/src/components/`
6. **Test End-to-End**: Verify in browser and with tests

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling (no custom CSS)
- shadcn/ui components for consistency
- Functional components with hooks
- tRPC for API calls (no fetch/axios)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` environment variable is set correctly
- Ensure MySQL server is running
- Check database credentials

### OAuth Not Working
- Verify Manus OAuth credentials are set
- Check redirect URLs match configured URLs
- Clear browser cookies and try again

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that theme provider is wrapping the app
- Verify CSS variables are defined in `index.css`

## 📄 License

This project is provided as-is for educational and personal use.

## 🤝 Support

For issues, questions, or suggestions, please reach out through the Manus platform.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and tRPC**
