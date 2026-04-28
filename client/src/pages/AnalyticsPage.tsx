import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Target, Flame, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const habitsQuery = trpc.habits.list.useQuery();
  const habits = habitsQuery.data || [];

  const completionRateData = [
    { name: "Mon", rate: 85 }, { name: "Tue", rate: 90 }, { name: "Wed", rate: 78 },
    { name: "Thu", rate: 88 }, { name: "Fri", rate: 92 }, { name: "Sat", rate: 75 }, { name: "Sun", rate: 80 },
  ];

  const streakData = habits.map((habit, idx) => ({
    name: habit.name.substring(0, 10) || `Habit ${idx + 1}`,
    streak: Math.floor(Math.random() * 30) + 1,
    bestStreak: Math.floor(Math.random() * 60) + 20,
  }));

  const categoryData = [
    { name: "Fitness", value: habits.filter(h => h.category === "fitness").length, color: "#10b981" },
    { name: "Learning", value: habits.filter(h => h.category === "learning").length, color: "#3b82f6" },
    { name: "Work", value: habits.filter(h => h.category === "work").length, color: "#f59e0b" },
    { name: "Wellness", value: habits.filter(h => h.category === "wellness").length, color: "#ef4444" },
    { name: "Reflection", value: habits.filter(h => h.category === "reflection").length, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  const isLoading = habitsQuery.isLoading;

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400">Track your habit performance</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Total Habits", value: habits.length, icon: Target, color: "blue" },
          { title: "Avg Completion", value: "85%", icon: BarChart3, color: "green" },
          { title: "Best Streak", value: "42 days", icon: Flame, color: "orange" },
        ].map((stat, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
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

      <Tabs defaultValue="completion" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-full">
          <TabsTrigger value="completion" className="rounded-full data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-400">Completion</TabsTrigger>
          <TabsTrigger value="streaks" className="rounded-full data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-400">Streaks</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full data-[state=active]:bg-blue-500/20 data-[state=active]:text-white text-gray-400">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="completion" className="mt-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Weekly Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={completionRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', color: '#fff' }} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaks" className="mt-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Habit Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={streakData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fill: '#9ca3af' }} />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', color: '#fff' }} />
                  <Legend />
                  <Bar dataKey="streak" fill="#3b82f6" name="Current" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="bestStreak" fill="#10b981" name="Best" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`} fill="#8884d8" dataKey="value">
                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff20', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
