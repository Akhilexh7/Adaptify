import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import HabitsPage from "./pages/HabitsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import DashboardLayout from "./components/DashboardLayoutCustom";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path={"/"} component={Home} />
      {isAuthenticated && (
        <>
          <Route path={"/dashboard"}>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>
          <Route path={"/dashboard/habits"}>
            <DashboardLayout>
              <HabitsPage />
            </DashboardLayout>
          </Route>
          <Route path={"/dashboard/analytics"}>
            <DashboardLayout>
              <AnalyticsPage />
            </DashboardLayout>
          </Route>
          <Route path={"/dashboard/schedule"}>
            <DashboardLayout>
              <SchedulePage />
            </DashboardLayout>
          </Route>
          <Route path={"/dashboard/settings"}>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </Route>
        </>
      )}
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
