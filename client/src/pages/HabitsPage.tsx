import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function HabitsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", category: "fitness", priority: "medium",
    durationMinutes: 30, frequency: "daily", targetDaysPerWeek: 7,
  });

  const habitsQuery = trpc.habits.list.useQuery();
  const createHabitMutation = trpc.habits.create.useMutation({
    onSuccess: () => {
      habitsQuery.refetch();
      setFormData({ name: "", description: "", category: "fitness", priority: "medium",
        durationMinutes: 30, frequency: "daily", targetDaysPerWeek: 7 });
      setIsOpen(false);
      toast.success("Habit created!");
    },
    onError: (error) => toast.error(error.message || "Failed"),
  });

  const deleteHabitMutation = trpc.habits.delete.useMutation({
    onSuccess: () => { habitsQuery.refetch(); toast.success("Deleted!"); },
    onError: (error) => toast.error(error.message || "Failed"),
  });

  const habits = habitsQuery.data || [];
  const isLoading = habitsQuery.isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error("Name required"); return; }
    await createHabitMutation.mutateAsync({
      ...formData, durationMinutes: parseInt(formData.durationMinutes.toString()),
      targetDaysPerWeek: parseInt(formData.targetDaysPerWeek.toString()),
    });
  };

  const categoryColors: { [key: string]: string } = {
    fitness: "text-green-400 bg-green-500/20 border-green-500/30",
    learning: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    work: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    wellness: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    reflection: "text-pink-400 bg-pink-500/20 border-pink-500/30",
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Habits</h1>
          <p className="text-gray-400">Manage your habits and routines</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
              <DialogDescription className="text-gray-400">Add a new habit to track</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white rounded-full" placeholder="e.g., Morning Run" required />
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white rounded-full" placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Category</Label>
                  <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {["fitness", "learning", "work", "wellness", "reflection"].map(c => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-white/10 rounded-full">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-300">Priority</Label>
                  <Select value={formData.priority} onValueChange={v => setFormData({...formData, priority: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {["low", "medium", "high"].map(p => (
                        <SelectItem key={p} value={p} className="text-white hover:bg-white/10 rounded-full">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 rounded-full" disabled={createHabitMutation.isPending}>
                {createHabitMutation.isPending ? "Creating..." : "Create Habit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {habits.map((habit, idx) => (
            <motion.div key={habit.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <h3 className="font-semibold text-white text-lg">{habit.name}</h3>
                        <Badge className={categoryColors[habit.category] || categoryColors.fitness}>{habit.category}</Badge>
                        <Badge variant={habit.priority === "high" ? "destructive" : "outline"} className="rounded-full">
                          {habit.priority}
                        </Badge>
                      </div>
                      {habit.description && <p className="text-gray-400 text-sm mb-2">{habit.description}</p>}
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{habit.durationMinutes} min</span>
                        <span>{habit.frequency}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => confirm("Delete this habit?") && deleteHabitMutation.mutate({ id: habit.id })}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {habits.length === 0 && (
        <Card className="bg-white/5 border-white/10 rounded-2xl">
          <CardContent className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No habits yet. Create your first habit!</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
