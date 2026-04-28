import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function SchedulePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [formData, setFormData] = useState({
    title: "", description: "", startTime: "", endTime: "", isRecurring: false,
  });

  const timetableQuery = trpc.timetable.list.useQuery({
    startDate: new Date(selectedDate), endDate: new Date(selectedDate + "T23:59:59"),
  });

  const createEventMutation = trpc.timetable.create.useMutation({
    onSuccess: () => { timetableQuery.refetch(); setIsOpen(false); toast.success("Event created!"); },
    onError: (error) => toast.error(error.message || "Failed"),
  });

  const deleteEventMutation = trpc.timetable.delete.useMutation({
    onSuccess: () => { timetableQuery.refetch(); toast.success("Deleted!"); },
    onError: (error) => toast.error(error.message || "Failed"),
  });

  const events = timetableQuery.data || [];
  const isLoading = timetableQuery.isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error("Title required"); return; }
    if (!formData.startTime || !formData.endTime) { toast.error("Times required"); return; }
    const start = new Date(`${selectedDate}T${formData.startTime}`);
    const end = new Date(`${selectedDate}T${formData.endTime}`);
    if (end <= start) { toast.error("End must be after start"); return; }
    await createEventMutation.mutateAsync({
      title: formData.title, description: formData.description,
      startTime: start, endTime: end, isRecurring: formData.isRecurring,
    });
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
          <h1 className="text-3xl font-bold text-white">Schedule</h1>
          <p className="text-gray-400">Manage your fixed events</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
            <DialogHeader>
              <DialogTitle>New Event</DialogTitle>
              <DialogDescription className="text-gray-400">Add a fixed commitment</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-gray-300">Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="bg-white/5 border-white/10 text-white rounded-full" placeholder="e.g., Work Meeting" required />
              </div>
              <div>
                <Label className="text-gray-300">Description</Label>
                <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-white/5 border-white/10 text-white rounded-full" placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300">Start Time</Label>
                  <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="bg-white/5 border-white/10 text-white rounded-full" required />
                </div>
                <div>
                  <Label className="text-gray-300">End Time</Label>
                  <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="bg-white/5 border-white/10 text-white rounded-full" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 rounded-full" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Events for {format(new Date(selectedDate), "MMMM d, yyyy")}
          </CardTitle>
          <CardDescription className="text-gray-400">{events.length} event(s) scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="mb-4 bg-white/5 border border-white/10 text-white rounded-full px-4 py-2" />
          <div className="space-y-3">
            {events.map((event, idx) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-4 h-4 text-red-400" />
                      <h3 className="font-semibold text-white">{event.title}</h3>
                    </div>
                    {event.description && <p className="text-sm text-gray-400 mb-2">{event.description}</p>}
                    <p className="text-sm text-gray-500">
                      {format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => confirm("Delete?") && deleteEventMutation.mutate({ id: event.id })}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          {events.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600" />
              <p>No events scheduled for this day</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
