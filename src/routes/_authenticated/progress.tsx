import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BookOpen, CalendarClock, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { PageHeader, EmptyState, ListSkeleton, ErrorState } from "@/components/state";
import {
  DAYS,
  daysUntil,
  useClasses,
  useDeadlines,
  useNotes,
  useSubjects,
  useTasks,
} from "@/lib/db";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress & Analytics — StudyMate" },
      {
        name: "description",
        content:
          "See completion rates, workload per subject and weekly class load to understand how your semester is going.",
      },
      { property: "og:title", content: "Progress & Analytics — StudyMate" },
      { property: "og:description", content: "Analytics that show where your study time really goes." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const tasks = useTasks();
  const subjects = useSubjects();
  const classes = useClasses();
  const deadlines = useDeadlines();
  const notes = useNotes();

  const isLoading =
    tasks.isLoading || subjects.isLoading || classes.isLoading || deadlines.isLoading;
  const error = tasks.error ?? subjects.error ?? classes.error ?? deadlines.error;

  const stats = useMemo(() => {
    const taskList = tasks.data ?? [];
    const completed = taskList.filter((t) => t.status === "completed").length;
    const inProgress = taskList.filter((t) => t.status === "in_progress").length;
    const overdue = taskList.filter(
      (t) => t.status !== "completed" && t.due_date && daysUntil(t.due_date) < 0,
    ).length;
    const rate = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;

    const perSubject = (subjects.data ?? [])
      .map((subject) => {
        const subjectTasks = taskList.filter((t) => t.subject_id === subject.id);
        const done = subjectTasks.filter((t) => t.status === "completed").length;
        return {
          subject,
          total: subjectTasks.length,
          done,
          percent: subjectTasks.length ? Math.round((done / subjectTasks.length) * 100) : 0,
          classes: (classes.data ?? []).filter((c) => c.subject_id === subject.id).length,
        };
      })
      .sort((a, b) => b.total - a.total);

    const weekly = DAYS.map((day, index) => ({
      day,
      count: (classes.data ?? []).filter((c) => c.day_of_week === index).length,
    }));
    const busiest = weekly.reduce((a, b) => (b.count > a.count ? b : a), weekly[0]!);

    const openDeadlines = (deadlines.data ?? []).filter(
      (d) => d.status !== "completed" && daysUntil(d.due_date) >= 0,
    ).length;

    return {
      taskTotal: taskList.length,
      completed,
      inProgress,
      overdue,
      rate,
      perSubject,
      weekly,
      busiest,
      openDeadlines,
      maxWeekly: Math.max(1, ...weekly.map((w) => w.count)),
    };
  }, [tasks.data, subjects.data, classes.data, deadlines.data]);

  const cards = [
    { label: "Completion rate", value: `${stats.rate}%`, icon: TrendingUp, hint: `${stats.completed} of ${stats.taskTotal} tasks` },
    { label: "In progress", value: stats.inProgress, icon: Clock, hint: "Tasks currently active" },
    { label: "Overdue tasks", value: stats.overdue, icon: CheckCircle2, hint: "Needs attention" },
    { label: "Open deadlines", value: stats.openDeadlines, icon: CalendarClock, hint: "Exams & assignments ahead" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="How your semester is actually going." />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <card.icon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <section className="surface p-5 lg:col-span-3">
              <h2 className="text-sm font-semibold">Progress by subject</h2>
              {stats.perSubject.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="No subjects yet"
                  description="Add subjects and tasks to see per-subject progress."
                />
              ) : (
                <ul className="mt-4 space-y-4">
                  {stats.perSubject.map((row) => (
                    <li key={row.subject.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: row.subject.color }}
                          />
                          <span className="truncate font-medium">{row.subject.name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {row.done}/{row.total} tasks • {row.classes} classes
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${row.percent}%`,
                            backgroundColor: row.subject.color,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="surface p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Weekly class load</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Busiest day: {stats.busiest.count > 0 ? stats.busiest.day : "—"}
              </p>
              <ul className="mt-4 space-y-3">
                {stats.weekly.map((row) => (
                  <li key={row.day} className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-xs text-muted-foreground">
                      {row.day.slice(0, 3)}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(row.count / stats.maxWeekly) * 100}%` }}
                      />
                    </div>
                    <span className="w-4 shrink-0 text-right text-xs font-medium">{row.count}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Subjects</dt>
                  <dd className="text-lg font-semibold">{subjects.data?.length ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Notes written</dt>
                  <dd className="text-lg font-semibold">{notes.data?.length ?? 0}</dd>
                </div>
              </dl>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
