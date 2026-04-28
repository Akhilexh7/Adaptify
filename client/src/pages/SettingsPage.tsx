import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      if (!formData.name.trim() || !formData.email.trim()) {
        toast.error("Name and email are required");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-400">Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" placeholder="Enter your name" />
            </div>
            <div>
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" placeholder="Enter your email" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Email Reminders", "Push Notifications", "Weekly Summary"].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-gray-300">{item}</span>
                    <div className="w-11 h-6 bg-blue-500/30 rounded-full relative cursor-pointer">
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${idx < 2 ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Security
              </CardTitle>
              <CardDescription className="text-gray-400">Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:bg-white/10 hover:text-white">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
          Cancel
        </Button>
        <Button onClick={handleSaveSettings} disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-600 text-white">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </motion.div>
  );
}
