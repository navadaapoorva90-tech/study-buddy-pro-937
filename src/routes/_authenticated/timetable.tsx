import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, EmptyState, ListSkeleton, ErrorState } from "@/components/state";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  DAYS,
  formatTime,
  useClasses,
  useDeleteRecord,
  useSaveRecord,
  useSubjects,
  type ClassItem,
} from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Weekly Timetable — StudyMate" },
      {
        name: "description",
        content:
          "Your colour-coded weekly class timetable with faculty, classroom and time slots for every day.",
      },
      { property: "og:title", content: "Weekly Timetable — StudyMate" },
      { property: "og:description", content: "See your whole week of classes at a glance." },
    ],
  }),
  component: TimetablePage,
});

type FormState = {
  title: string;
  subject_id: string;
  faculty: string;
  room: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

const EMPTY: FormState = {
  title: "",
  subject_id: "none",
  faculty: "",
  room: "",
  day_of_week: String(new Date().getDay()),
  start_time: "09:00",
  end_time: "10:00",
};

function TimetablePage() {
  const { data, isLoading, error } = useClasses();
  const subjects = useSubjects();
  const save = useSaveRecord("classes", "Class");
  const remove = useDeleteRecord("classes", "Class");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const todayIndex = new Date().getDay();
  const subjectMap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  const openCreate = (day?: number) => {
    setEditing(null);
    setForm({ ...EMPTY, day_of_week: String(day ?? todayIndex) });
    setOpen(true);
  };

  const openEdit = (item: ClassItem) => {
    setEditing(item);
    setForm({
      title: item.title,
      subject_id: item.subject_id ?? "none",
      faculty: item.faculty ?? "",
      room: item.room ?? "",
      day_of_week: String(item.day_of_week),
      start_time: item.start_time.slice(0, 5),
      end_time: item.end_time.slice(0, 5),
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Class title is required");
    if (form.end_time <= form.start_time) return toast.error("End time must be after start time");
    await save.mutateAsync({
      id: editing?.id,
      values: {
        title: form.title.trim().slice(0, 100),
        subject_id: form.subject_id === "none" ? null : form.subject_id,
        faculty: form.faculty.trim() || null,
        room: form.room.trim() || null,
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
      },
    });
    setOpen(false);
  };

  const classCard = (item: ClassItem) => {
    const subject = item.subject_id ? subjectMap.get(item.subject_id) : undefined;
    return (
      <li
        key={item.id}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-3.5 pl-4 transition-all hover:shadow-lift"
      >
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: subject?.color ?? "var(--primary)" }}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTime(item.start_time)} – {formatTime(item.end_time)}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {[item.room, item.faculty].filter(Boolean).join(" • ") || "No room set"}
            </p>
          </div>
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(item)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setDeleteId(item.id)}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </li>
    );
  };

  const byDay = (day: number) =>
    (data ?? []).filter((c) => c.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetable"
        description="Your weekly class schedule, colour-coded by subject."
        action={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4" /> Add class
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Your timetable is empty"
          description="Add your first class and it will show up here and on your dashboard."
          action={
            <Button onClick={() => openCreate()}>
              <Plus className="size-4" /> Add class
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="week">
          <TabsList>
            <TabsTrigger value="week">Full week</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {DAYS.map((day, index) => {
                const items = byDay(index);
                const isToday = index === todayIndex;
                return (
                  <section
                    key={day}
                    className={cn(
                      "surface flex flex-col p-4",
                      isToday && "ring-2 ring-primary/40",
                    )}
                  >
                    <header className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold">{day}</h2>
                      {isToday && (
                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Today
                        </span>
                      )}
                    </header>
                    {items.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">No classes</p>
                    ) : (
                      <ul className="space-y-2.5">{items.map(classCard)}</ul>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 w-full text-muted-foreground"
                      onClick={() => openCreate(index)}
                    >
                      <Plus className="size-3.5" /> Add
                    </Button>
                  </section>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="today" className="mt-5">
            {byDay(todayIndex).length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={`No classes on ${DAYS[todayIndex]}`}
                description="Nothing scheduled today."
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {byDay(todayIndex).map(classCard)}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit class" : "Add class"}</DialogTitle>
            <DialogDescription>Set the day, time and location of this class.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Class title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Data Structures Lecture"
                maxLength={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(value) => {
                  const subject = subjects.data?.find((s) => s.id === value);
                  setForm({
                    ...form,
                    subject_id: value,
                    faculty: form.faculty || (subject?.faculty ?? ""),
                    title: form.title || (subject?.name ?? ""),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {(subjects.data ?? []).map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="faculty">Faculty</Label>
                <Input
                  id="faculty"
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  placeholder="Dr. Menon"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="room">Classroom</Label>
                <Input
                  id="room"
                  value={form.room}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                  placeholder="Block B – 204"
                  maxLength={40}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select
                value={form.day_of_week}
                onValueChange={(value) => setForm({ ...form, day_of_week: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, index) => (
                    <SelectItem key={day} value={String(index)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start">Start time</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">End time</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Add class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete class?"
        description="This class will be removed from your timetable."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
