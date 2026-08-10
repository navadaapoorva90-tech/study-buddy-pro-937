import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  NotebookPen,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyMate — Plan your semester, not just your day" },
      {
        name: "description",
        content:
          "StudyMate is a student planner for college: weekly timetable, subjects, study tasks, exam deadlines, notes and progress tracking in one place.",
      },
      { property: "og:title", content: "StudyMate — Plan your semester, not just your day" },
      {
        property: "og:description",
        content:
          "Weekly timetable, subjects, study tasks, exam deadlines and notes in one student workspace.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Weekly timetable",
    body: "Colour-coded classes with faculty, room and time slots. Today is always highlighted.",
  },
  {
    icon: BookOpen,
    title: "Subjects",
    body: "Track codes, credits, faculty and per-subject notes across your semester.",
  },
  {
    icon: ClipboardList,
    title: "Study planner",
    body: "Tasks with priority, due dates and status. Filter and sort however you study.",
  },
  {
    icon: GraduationCap,
    title: "Exams & assignments",
    body: "Every deadline in one list, with the closest ones surfaced on your dashboard.",
  },
  { icon: NotebookPen, title: "Notes", body: "Searchable notes, linked to the subject they belong to." },
  {
    icon: TrendingUp,
    title: "Progress",
    body: "Completion rate, tasks by subject and what's coming up next.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold">StudyMate</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link to="/auth">Log in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="hero-glow">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Private by design — your data is yours only
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-6xl">
            Plan your semester,
            <br />
            not just your day.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            StudyMate keeps your timetable, subjects, study tasks, exam deadlines and notes in one
            calm workspace — so you always know what's next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Create free account <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-2xl font-semibold sm:text-3xl">Everything a student actually needs</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} StudyMate</span>
          <span>Built for college students.</span>
        </div>
      </footer>
    </div>
  );
}
