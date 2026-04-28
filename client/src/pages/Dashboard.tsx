import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Calendar, Zap, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"daily" | "weekly">("daily");

  const habitsQuery = trpc.habits.list.useQuery();
  const habits = habitsQuery.data || [];

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const timetableQuery = trpc.timetable.list.useQuery({ startDate: dayStart, endDate: dayEnd });
  const timetableEvents = timetableQuery.data || [];

  const freeSlotsQuery = trpc.scheduler.getFreeSlots.useQuery({ date: selectedDate, dayStartHour: 6, dayEndHour: 23 });
  const freeSlots = freeSlotsQuery.data || [];

  const scheduledQuery = trpc.scheduledHabits.list.useQuery({ date: selectedDate });
  const scheduledHabits = scheduledQuery.data || [];

  const isLoading = habitsQuery.isLoading || timetableQuery.isLoading || freeSlotsQuery.isLoading;

  const handlePreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Manage your habits and schedule</p>
      </div>

      {/* Date Navigation */}
      <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handlePreviousDay}
            className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white rounded-full">
            ← Previous
          </Button>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{format(selectedDate, "EEEE, MMMM d")}</div>
            <Button variant="ghost" size="sm" onClick={handleToday} className="mt-2 text-blue-400 hover:text-blue-300 rounded-full">
              Today
            </Button>
          </div>
          <Button variant="outline" onClick={handleNextDay}
            className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white rounded-full">
            Next →
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as "daily" | "weekly")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-full">
          <TabsTrigger value="daily" className="rounded-full data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-400">Daily View</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-400">Weekly View</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6 mt-6">
          {/* Timeline Overview */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-blue-400" />
                Daily Timeline
              </CardTitle>
              <CardDescription className="text-gray-400">Your schedule for {format(selectedDate, "MMMM d, yyyy")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timetableEvents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3">Fixed Commitments</h3>
                  <div className="space-y-2">
                    {timetableEvents.map((event) => (
                      <div key={event.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors">
                        <div className="font-medium text-white">{event.title}</div>
                        <div className="text-sm text-gray-400">
                          {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {freeSlots.length > 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    Available Time Slots
                  </h3>
                  <div className="space-y-2">
                    {freeSlots.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors">
                        <div className="font-medium text-white">Free Time</div>
                        <div className="text-sm text-gray-400">
                          {format(new Date(slot.startTime), "h:mm a")} - {format(new Date(slot.endTime), "h:mm a")} ({slot.durationMinutes} min)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timetableEvents.length === 0 && freeSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No events scheduled for this day</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduled Habits */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-yellow-400" />
                Scheduled Habits
              </CardTitle>
              <CardDescription className="text-gray-400">{scheduledHabits.length} habits scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledHabits.length > 0 ? (
                <div className="space-y-3">
                  {scheduledHabits.map((scheduled, idx) => (
                    <div key={scheduled.id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                      <div className="font-medium text-white">Habit #{scheduled.habitId}</div>
                      <div className="text-sm text-gray-400">
                        {format(new Date(scheduled.startTime), "h:mm a")} - {format(new Date(scheduled.endTime), "h:mm a")}
                      </div>
                      <Badge className="mt-2" variant={scheduled.status === "completed" ? "default" : "outline"}>
                        {scheduled.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No habits scheduled yet</p>
                  <Button variant="outline" size="sm" className="mt-4 border-white/20 text-gray-300 hover:bg-white/10 rounded-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Habits
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">Weekly Overview</CardTitle>
              <CardDescription className="text-gray-400">Your habits and schedule for this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50 text-blue-400" />
                <p>Weekly view coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Total Habits", value: habits.length, icon: Zap, color: "blue" },
          { title: "Scheduled Today", value: scheduledHabits.length, icon: CheckCircle2, color: "green" },
          { title: "Free Time", value: `${freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0)} min`, icon: Clock, color: "purple" },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
