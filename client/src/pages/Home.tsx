import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { BeamsBackground } from "@/components/ui/beams-background";
import { SignInPage } from "@/components/ui/sign-in-flow-1";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();

  const justLoggedOut = typeof window !== "undefined" && (
    sessionStorage.getItem("justLoggedOut") === "true" ||
    localStorage.getItem("__dev_logged_out__") === "true"
  );

  useEffect(() => {
    if (isAuthenticated && !justLoggedOut) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, justLoggedOut, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="animate-pulse text-white/50">Loading...</div>
    </div>
  );
  if (isAuthenticated && !justLoggedOut) return null;

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden">
      {/* Animated Beams Background - Keep ONLY the background */}
      <div className="absolute inset-0 z-0">
        <BeamsBackground />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.6)_0%,_rgba(0,0,0,0.95)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(16,185,129,0.1)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,_rgba(59,130,246,0.08)_0%,_transparent_60%)]" />
      </div>

      {/* Replace all components with new SignInPage */}
      <SignInPage />
    </div>
  );
}
