import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, Flame, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function CompletionPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  // Queries
  const habitsQuery = trpc.habits.list.useQuery();
  const completionsQuery = trpc.completions.list.useQuery({
    habitId: selectedHabitId || 0,
    limit: 30,
  });
  const streaksQuery = trpc.streaks.get.useQuery({
    habitId: selectedHabitId || 0,
  });

  const completeHabitMutation = trpc.completions.create.useMutation({
    onSuccess: () => {
      habitsQuery.refetch();
      completionsQuery.refetch();
      streaksQuery.refetch();
      setNotes("");
      setDurationMinutes("30");
      setIsOpen(false);
      toast.success("Habit marked as complete!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark habit as complete");
    },
  });

  const habits = habitsQuery.data || [];
  const completions = completionsQuery.data || [];
  const streak = streaksQuery.data;
  const isLoading = habitsQuery.isLoading;

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabitId) {
      toast.error("Please select a habit");
      return;
    }

    await completeHabitMutation.mutateAsync({
      habitId: selectedHabitId,
      completedAt: new Date(),
      durationMinutes: parseInt(durationMinutes) || 30,
      notes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Track Completions</h1>
        <p className="text-muted-foreground">Mark habits as complete and build streaks</p>
      </div>

      {/* Habits Grid */}
      {habits.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map((habit) => {
            const habitCompletions = completions.filter((c) => c.habitId === habit.id);
            const completionRate = habitCompletions.length > 0 ? Math.round((habitCompletions.length / 30) * 100) : 0;

            return (
              <Card key={habit.id} className="bg-card border-border hover:border-primary/50 transition">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  {habit.description && (
                    <CardDescription className="mt-1">{habit.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold text-foreground">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-muted-foreground">Current Streak:</span>
                    <span className="font-semibold text-foreground">
                      {streak?.currentStreak || 0} days
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-muted-foreground">Best Streak:</span>
                    <span className="font-semibold text-foreground">
                      {streak?.bestStreak || 0} days
                    </span>
                  </div>

                  <Dialog open={isOpen && selectedHabitId === habit.id} onOpenChange={(open) => {
                    if (open) {
                      setSelectedHabitId(habit.id);
                      setIsOpen(true);
                    } else {
                      setIsOpen(false);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2" onClick={() => setSelectedHabitId(habit.id)}>
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Complete Habit</DialogTitle>
                        <DialogDescription>Mark {habit.name} as complete</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleComplete} className="space-y-4">
                        <div>
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (optional)</Label>
                          <Textarea
                            id="notes"
                            placeholder="How did it go?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={completeHabitMutation.isPending}>
                          {completeHabitMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Marking...
                            </>
                          ) : (
                            "Mark Complete"
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">No habits created yet</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Completions */}
      {completions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Completions
            </CardTitle>
            <CardDescription>Your recent habit completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completions.slice(0, 10).map((completion) => (
                <div key={completion.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">Habit #{completion.habitId}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(completion.completedAt), "MMM d, yyyy h:mm a")}
                    </p>
                    {completion.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{completion.notes}</p>
                    )}
                  </div>
                  <Badge variant="default">{completion.durationMinutes}m</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
