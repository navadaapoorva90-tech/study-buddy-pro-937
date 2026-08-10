import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { PageHeader, EmptyState, ListSkeleton, ErrorState } from "@/components/state";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import {
  daysUntil,
  formatDate,
  todayISO,
  useDeleteRecord,
  useSaveRecord,
  useSubjects,
  useTasks,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Study Planner — StudyMate" },
      {
        name: "description",
        content:
          "Plan study sessions and revision tasks by subject, priority and due date, and track them to completion.",
      },
      { property: "og:title", content: "Study Planner — StudyMate" },
      { property: "og:description", content: "Turn your syllabus into a plan you can actually finish." },
    ],
  }),
  component: PlannerPage,
});

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

const PRIORITY_CLASS: Record<Priority, string> = {
  high: "bg-destructive-soft text-destructive",
  medium: "bg-warning-soft text-warning",
  low: "bg-success-soft text-success",
};

type FormState = {
  title: string;
  description: string;
  subject_id: string;
  priority: Priority;
  status: TaskStatus;
  due_date: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  subject_id: "none",
  priority: "medium",
  status: "pending",
  due_date: todayISO(),
};

function PlannerPage() {
  const { data, isLoading, error } = useTasks();
  const subjects = useSubjects();
  const save = useSaveRecord("tasks", "Task");
  const remove = useDeleteRecord("tasks", "Task");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const subjectMap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  const filtered = useMemo(() => {
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    return (data ?? [])
      .filter((task) => (statusFilter === "all" ? true : task.status === statusFilter))
      .filter((task) => (subjectFilter === "all" ? true : task.subject_id === subjectFilter))
      .sort((a, b) => {
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (b.status === "completed" && a.status !== "completed") return -1;
        if (a.due_date && b.due_date && a.due_date !== b.due_date)
          return a.due_date.localeCompare(b.due_date);
        return order[a.priority] - order[b.priority];
      });
  }, [data, statusFilter, subjectFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description ?? "",
      subject_id: task.subject_id ?? "none",
      priority: task.priority,
      status: task.status,
      due_date: task.due_date ?? "",
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Task title is required");
      return;
    }
    await save.mutateAsync({
      id: editing?.id,
      values: {
        title: form.title.trim().slice(0, 140),
        description: form.description.trim() || null,
        subject_id: form.subject_id === "none" ? null : form.subject_id,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
      },
    });
    setOpen(false);
  };

  const toggleDone = (task: Task) => {
    save.mutate({
      id: task.id,
      values: { status: task.status === "completed" ? "pending" : "completed" },
    });
  };

  const completed = (data ?? []).filter((t) => t.status === "completed").length;
  const total = data?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study planner"
        description={
          total > 0
            ? `${completed} of ${total} tasks completed.`
            : "Break your syllabus into small, finishable tasks."
        }
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add task
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {(subjects.data ?? []).map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={total === 0 ? ListTodo : CheckCircle2}
          title={total === 0 ? "No tasks yet" : "Nothing matches these filters"}
          description={
            total === 0
              ? "Add a study task and track it through to completion."
              : "Try a different status or subject filter."
          }
          action={
            total === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Add task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((task) => {
            const subject = task.subject_id ? subjectMap.get(task.subject_id) : undefined;
            const overdue =
              task.status !== "completed" && task.due_date && daysUntil(task.due_date) < 0;
            return (
              <li
                key={task.id}
                className="surface group flex items-start gap-3 p-4 transition-shadow hover:shadow-lift"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={task.status === "completed"}
                  onCheckedChange={() => toggleDone(task)}
                  aria-label={`Mark ${task.title} complete`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        task.status === "completed" && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        PRIORITY_CLASS[task.priority],
                      )}
                    >
                      {task.priority}
                    </span>
                    {task.status === "in_progress" && (
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        In progress
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {subject && (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={cn(overdue && "font-semibold text-destructive")}>
                        {overdue ? "Overdue • " : "Due "}
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(task)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setDeleteId(task.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "Add task"}</DialogTitle>
            <DialogDescription>Small, specific tasks are easier to finish.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Task title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Revise binary trees – chapter 4"
                maxLength={140}
              />
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(value) => setForm({ ...form, priority: value as Priority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due">Due date</Label>
                <Input
                  id="due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete task?"
        description="This study task will be permanently removed."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
