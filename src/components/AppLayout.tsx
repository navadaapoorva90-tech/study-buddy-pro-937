import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  NotebookPen,
  Sun,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/planner", label: "Study Planner", icon: ClipboardList },
  { to: "/deadlines", label: "Exams & Assignments", icon: GraduationCap },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/progress", label: "Progress", icon: TrendingUp },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const initials = (user?.user_metadata?.["full_name"] as string | undefined)
    ? (user!.user_metadata["full_name"] as string)
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (user?.email?.[0] ?? "S").toUpperCase();

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon
              className={cn("size-4.5 shrink-0", active ? "text-primary" : "text-muted-foreground")}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      <span className="font-display text-lg font-semibold">StudyMate</span>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        {brand}
        {nav}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4.5" />
            Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-sidebar shadow-lift animate-in slide-in-from-left">
            <div className="flex items-center justify-between border-b border-sidebar-border pr-3">
              <div className="flex-1">{brand}</div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            {nav}
            <div className="border-t border-sidebar-border p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground"
              >
                <LogOut className="size-4.5" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <span className="truncate text-sm font-medium text-muted-foreground">
            {NAV.find((n) => n.to === pathname)?.label ?? "StudyMate"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
              title={user?.email ?? ""}
            >
              {initials}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
