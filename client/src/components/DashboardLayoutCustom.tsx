import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Menu, X, LogOut, Home, Zap, Settings, BarChart3, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// Background Shader Component
const BackgroundShader = () => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material: any = ref.current.material;
    if (material.uniforms?.u_time) material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const uniforms = {
    u_time: { value: 0, type: "1f" },
    u_resolution: { value: new THREE.Vector2(size.width * 2, size.height * 2) },
    u_colors: {
      value: [
        new THREE.Vector3(59/255, 130/255, 246/255), new THREE.Vector3(99/255, 102/255, 241/255),
        new THREE.Vector3(59/255, 130/255, 246/255), new THREE.Vector3(99/255, 102/255, 241/255),
        new THREE.Vector3(59/255, 130/255, 246/255), new THREE.Vector3(99/255, 102/255, 241/255),
      ], type: "3fv",
    },
    u_opacities: { value: [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14], type: "1fv" },
    u_total_size: { value: 20, type: "1f" },
    u_dot_size: { value: 2, type: "1f" },
    u_reverse: { value: 0, type: "1i" },
  };

  const material = useState(() => new THREE.ShaderMaterial({
    vertexShader: `precision mediump float; in vec2 coordinates; uniform vec2 u_resolution; out vec2 fragCoord; void main(){ gl_Position = vec4(position.x, position.y, 0.0, 1.0); fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution; fragCoord.y = u_resolution.y - fragCoord.y; }`,
    fragmentShader: `
      precision mediump float; in vec2 fragCoord; uniform float u_time; uniform float u_opacities[10]; uniform vec3 u_colors[6]; uniform float u_total_size; uniform float u_dot_size; uniform vec2 u_resolution; uniform int u_reverse; out vec4 fragColor;
      float PHI = 1.61803398874989484820459;
      float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
      void main() {
        vec2 st = fragCoord.xy;
        st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
        st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));
        float opacity = step(0.0, st.x) * step(0.0, st.y);
        vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
        float rand = random(st2 * floor((u_time / 5.0) + random(st2) + 5.0));
        opacity *= u_opacities[int(rand * 10.0)];
        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
        opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
        vec3 color = u_colors[int(random(st2) * 6.0)];
        fragColor = vec4(color, opacity); fragColor.rgb *= fragColor.a;
      }`,
    uniforms: uniforms as any,
    glslVersion: THREE.GLSL3,
    blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
  }))[0];

  return <mesh ref={ref as any}><planeGeometry args={[2, 2]} /><primitive object={material} attach="material" /></mesh>;
};

interface DashboardLayoutProps { children: React.ReactNode; }

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const navItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard", id: "dashboard" },
    { label: "Habits", icon: Zap, href: "/dashboard/habits", id: "habits" },
    { label: "Schedule", icon: Calendar, href: "/dashboard/schedule", id: "schedule" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics", id: "analytics" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings", id: "settings" },
  ];

  const handleLogout = async () => {
    localStorage.setItem("__dev_logged_out__", "true");
    sessionStorage.setItem("justLoggedOut", "true");
    localStorage.removeItem("manus-runtime-user-info");
    logout().catch(() => {});
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Canvas className="h-full w-full"><BackgroundShader /></Canvas>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0.95)_100%)]" />
      </div>

      {/* Floating Sidebar / Navbar */}
      <div className={cn("fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300",
        sidebarOpen ? "w-auto" : "w-auto")}>
        <div className="flex items-center pl-6 pr-6 py-3 backdrop-blur-sm rounded-full border border-[#333] bg-[rgba(31,31,31,0.57)]">
          {/* Logo */}
          <div className="relative w-5 h-5 flex items-center justify-center mr-4 sm:mr-6">
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 top-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 left-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 right-0 top-1/2 transform -translate-y-1/2 opacity-80"></span>
            <span className="absolute w-1.5 h-1.5 rounded-full bg-gray-200 bottom-0 left-1/2 transform -translate-x-1/2 opacity-80"></span>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden sm:flex items-center space-x-4 sm:space-x-6 text-sm mr-4 sm:mr-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => navigate(item.href)}
                  className="group relative inline-block overflow-hidden h-5 flex items-center text-sm">
                  <div className="flex flex-col transition-transform duration-400 ease-out transform group-hover:-translate-y-1/2">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="text-white">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3">
            <button onClick={handleLogout} className="px-4 py-2 text-xs sm:text-sm border border-[#333] bg-[rgba(31,31,31,0.62)] text-gray-300 rounded-full hover:border-white/50 hover:text-white transition-colors duration-200">
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="sm:hidden ml-auto text-gray-300 focus:outline-none" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {!sidebarOpen && (
          <div className="sm:hidden mt-2 bg-[rgba(31,31,31,0.95)] backdrop-blur-sm rounded-2xl border border-[#333] p-4 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { navigate(item.href); setSidebarOpen(true); }}
                className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10">
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pt-[90px]">
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
