import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  ListChecks,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  DAYS,
  daysUntil,
  formatDate,
  formatTime,
  todayISO,
  useClasses,
  useDeadlines,
  useSubjects,
  useTasks,
  type Subject,
} from "@/lib/db";
import { EmptyState, ListSkeleton } from "@/components/state";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudyMate" },
      {
        name: "description",
        content: "Your classes today, study tasks, upcoming deadlines and study progress.",
      },
      { property: "og:title", content: "Dashboard — StudyMate" },
      { property: "og:description", content: "Today's classes, tasks and upcoming deadlines." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="surface flex items-center gap-4 p-4 transition-shadow hover:shadow-lift">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const subjects = useSubjects();
  const classes = useClasses();
  const tasks = useTasks();
  const deadlines = useDeadlines();

  const subjectMap = new Map<string, Subject>((subjects.data ?? []).map((s) => [s.id, s]));
  const today = new Date();
  const todayClasses = (classes.data ?? []).filter((c) => c.day_of_week === today.getDay());
  const allTasks = tasks.data ?? [];
  const completed = allTasks.filter((t) => t.status === "completed");
  const pending = allTasks.filter((t) => t.status !== "completed");
  const todayTasks = pending.filter((t) => t.due_date && t.due_date <= todayISO());
  const upcoming = (deadlines.data ?? [])
    .filter((d) => d.status === "upcoming" && daysUntil(d.due_date) >= 0)
    .slice(0, 5);
  const rate = allTasks.length ? Math.round((completed.length / allTasks.length) * 100) : 0;

  const name =
    (user?.user_metadata?.["full_name"] as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div className="space-y-6">
      <div className="hero-glow surface p-6">
        <p className="text-sm text-muted-foreground">
          {today.toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {greeting()}, {name}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          You have {todayClasses.length} {todayClasses.length === 1 ? "class" : "classes"} and{" "}
          {todayTasks.length} {todayTasks.length === 1 ? "task" : "tasks"} due today.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/timetable">
              <Plus className="size-4" /> Add class
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/planner">
              <Plus className="size-4" /> Add task
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/subjects">
              <Plus className="size-4" /> Add subject
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Total subjects" value={subjects.data?.length ?? 0} />
        <StatCard icon={CalendarDays} label="Classes today" value={todayClasses.length} />
        <StatCard icon={ListChecks} label="Pending tasks" value={pending.length} />
        <StatCard icon={CheckCircle2} label="Completed tasks" value={completed.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Today's classes</h2>
            <Link to="/timetable" className="text-xs font-medium text-primary hover:underline">
              View timetable
            </Link>
          </div>
          {classes.isLoading ? (
            <ListSkeleton rows={2} />
          ) : todayClasses.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No classes today"
              description={`Nothing scheduled for ${DAYS[today.getDay()]}. Enjoy the free day or add a class.`}
            />
          ) : (
            <ul className="space-y-3">
              {todayClasses.map((item) => {
                const subject = item.subject_id ? subjectMap.get(item.subject_id) : undefined;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 rounded-xl border border-border p-3.5 transition-colors hover:bg-accent/50"
                  >
                    <span
                      className="h-10 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: subject?.color ?? "var(--primary)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[item.room, item.faculty].filter(Boolean).join(" • ") || "No room set"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="mb-4 text-base font-semibold">Study progress</h2>
          <p className="text-3xl font-semibold">{rate}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {completed.length} of {allTasks.length} tasks completed
          </p>
          <Progress value={rate} className="mt-4" />
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">In progress</span>
              <span className="font-medium">
                {allTasks.filter((t) => t.status === "in_progress").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-medium">
                {allTasks.filter((t) => t.status === "pending").length}
              </span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="mt-5 w-full">
            <Link to="/progress">See full progress</Link>
          </Button>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Today's study tasks</h2>
            <Link to="/planner" className="text-xs font-medium text-primary hover:underline">
              Open planner
            </Link>
          </div>
          {tasks.isLoading ? (
            <ListSkeleton rows={2} />
          ) : todayTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nothing due today"
              description="Add study tasks in the planner to see them here."
            />
          ) : (
            <ul className="space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.subject_id
                        ? (subjectMap.get(task.subject_id)?.name ?? "General")
                        : "General"}
                    </p>
                  </div>
                  <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>
                    {task.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Upcoming deadlines</h2>
            <Link to="/deadlines" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {deadlines.isLoading ? (
            <ListSkeleton rows={2} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No upcoming deadlines"
              description="Add exams, assignments or projects to stay ahead of them."
            />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((item) => {
                const left = daysUntil(item.due_date);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-3.5"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <CalendarClock className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {item.type} • {formatDate(item.due_date)}
                      </p>
                    </div>
                    <Badge variant={left <= 2 ? "destructive" : "secondary"}>
                      {left === 0 ? "Today" : left === 1 ? "Tomorrow" : `${left}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
