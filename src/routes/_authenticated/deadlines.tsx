import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, EmptyState, ListSkeleton, ErrorState } from "@/components/state";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  daysUntil,
  formatDate,
  todayISO,
  useDeadlines,
  useDeleteRecord,
  useSaveRecord,
  useSubjects,
  type Deadline,
  type DeadlineType,
} from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deadlines")({
  head: () => ({
    meta: [
      { title: "Exams & Assignments — StudyMate" },
      {
        name: "description",
        content:
          "Track exams, assignments and project deadlines with countdowns so nothing slips through.",
      },
      { property: "og:title", content: "Exams & Assignments — StudyMate" },
      { property: "og:description", content: "Every deadline, with a countdown you can trust." },
    ],
  }),
  component: DeadlinesPage,
});

const TYPES: DeadlineType[] = ["exam", "assignment", "project", "other"];

type FormState = {
  title: string;
  description: string;
  subject_id: string;
  type: DeadlineType;
  due_date: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  subject_id: "none",
  type: "exam",
  due_date: todayISO(),
};

function DeadlinesPage() {
  const { data, isLoading, error } = useDeadlines();
  const subjects = useSubjects();
  const save = useSaveRecord("deadlines", "Deadline");
  const remove = useDeleteRecord("deadlines", "Deadline");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deadline | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | DeadlineType>("all");

  const subjectMap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  const { upcoming, past } = useMemo(() => {
    const list = (data ?? [])
      .filter((item) => (typeFilter === "all" ? true : item.type === typeFilter))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
    return {
      upcoming: list.filter((item) => item.status !== "completed" && daysUntil(item.due_date) >= 0),
      past: list.filter((item) => item.status === "completed" || daysUntil(item.due_date) < 0),
    };
  }, [data, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (item: Deadline) => {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description ?? "",
      subject_id: item.subject_id ?? "none",
      type: item.type,
      due_date: item.due_date,
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.due_date) {
      toast.error("Due date is required");
      return;
    }
    await save.mutateAsync({
      id: editing?.id,
      values: {
        title: form.title.trim().slice(0, 140),
        description: form.description.trim() || null,
        subject_id: form.subject_id === "none" ? null : form.subject_id,
        type: form.type,
        due_date: form.due_date,
      },
    });
    setOpen(false);
  };

  const card = (item: Deadline) => {
    const subject = item.subject_id ? subjectMap.get(item.subject_id) : undefined;
    const days = daysUntil(item.due_date);
    const done = item.status === "completed";
    const urgent = !done && days <= 3;
    return (
      <li key={item.id} className="surface group p-4 transition-shadow hover:shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {item.type}
              </span>
              {done && (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                  Done
                </span>
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-sm font-semibold",
                done && "text-muted-foreground line-through",
              )}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {subject && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: subject.color }} />
                  {subject.name}
                </span>
              )}
              <span>{formatDate(item.due_date)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {!done && (
              <span
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  days < 0
                    ? "bg-destructive-soft text-destructive"
                    : urgent
                      ? "bg-warning-soft text-warning"
                      : "bg-primary-soft text-primary",
                )}
              >
                {days < 0
                  ? `${Math.abs(days)}d overdue`
                  : days === 0
                    ? "Today"
                    : `${days}d left`}
              </span>
            )}
            <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Toggle completed"
                onClick={() =>
                  save.mutate({
                    id: item.id,
                    values: { status: done ? "upcoming" : "completed" },
                  })
                }
              >
                <Check className={cn("size-3.5", done && "text-success")} />
              </Button>
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
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams & assignments"
        description="Countdowns for everything with a due date."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add deadline
          </Button>
        }
      />

      <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No deadlines tracked"
          description="Add your exams, assignments and project submissions to see live countdowns."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Add deadline
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past & done ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-5">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing upcoming"
                description="You're all caught up for now."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">{upcoming.map(card)}</ul>
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-5">
            {past.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No past deadlines"
                description="Completed and overdue items will appear here."
              />
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">{past.map(card)}</ul>
            )}
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit deadline" : "Add deadline"}</DialogTitle>
            <DialogDescription>Exams, assignments, projects and anything else due.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Mid-semester exam"
                maxLength={140}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as DeadlineType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due">Due date *</Label>
                <Input
                  id="due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(value) => setForm({ ...form, subject_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={1000}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Add deadline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete deadline?"
        description="This deadline will be permanently removed."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
