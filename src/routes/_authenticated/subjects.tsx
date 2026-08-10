import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { SUBJECT_COLORS, useDeleteRecord, useSaveRecord, useSubjects, type Subject } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({
    meta: [
      { title: "Subjects — StudyMate" },
      {
        name: "description",
        content: "Manage your semester subjects: codes, credits, faculty, colours and notes.",
      },
      { property: "og:title", content: "Subjects — StudyMate" },
      { property: "og:description", content: "All of your semester subjects in one place." },
    ],
  }),
  component: SubjectsPage,
});

type FormState = {
  name: string;
  code: string;
  faculty: string;
  credits: string;
  color: string;
  notes: string;
};

const EMPTY: FormState = { name: "", code: "", faculty: "", credits: "3", color: SUBJECT_COLORS[0]!, notes: "" };

function SubjectsPage() {
  const { data, isLoading, error } = useSubjects();
  const save = useSaveRecord("subjects", "Subject");
  const remove = useDeleteRecord("subjects", "Subject");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setForm({
      name: subject.name,
      code: subject.code ?? "",
      faculty: subject.faculty ?? "",
      credits: String(subject.credits),
      color: subject.color,
      notes: subject.notes ?? "",
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Subject name is required");
      return;
    }
    const credits = Number(form.credits);
    if (!Number.isInteger(credits) || credits < 0 || credits > 20) {
      toast.error("Credits must be a whole number between 0 and 20");
      return;
    }
    await save.mutateAsync({
      id: editing?.id,
      values: {
        name: form.name.trim().slice(0, 100),
        code: form.code.trim() || null,
        faculty: form.faculty.trim() || null,
        credits,
        color: form.color,
        notes: form.notes.trim() || null,
      },
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Everything you're studying this semester."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add subject
          </Button>
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Add your first subject to start building your timetable and study plan."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Add subject
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data!.map((subject) => (
            <article
              key={subject.id}
              className="surface group p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="size-10 shrink-0 rounded-xl"
                    style={{ backgroundColor: subject.color }}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{subject.name}</h2>
                    <p className="truncate text-xs text-muted-foreground">
                      {subject.code || "No code"} • {subject.credits} credits
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(subject.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Faculty</dt>
                  <dd className="truncate font-medium">{subject.faculty || "—"}</dd>
                </div>
              </dl>
              {subject.notes && (
                <p className="mt-3 line-clamp-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  {subject.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit subject" : "Add subject"}</DialogTitle>
            <DialogDescription>
              Subjects power your timetable, tasks, deadlines and notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Subject name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Data Structures"
                maxLength={100}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code">Subject code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="CS201"
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min={0}
                  max={20}
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
              </div>
            </div>
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
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select colour ${color}`}
                    onClick={() => setForm({ ...form, color })}
                    className={cn(
                      "size-8 rounded-lg transition-transform hover:scale-110",
                      form.color === color && "ring-2 ring-ring ring-offset-2",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Syllabus highlights, reference books…"
                rows={3}
                maxLength={1000}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Add subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete subject?"
        description="Classes, tasks and notes linked to this subject will be unlinked but not deleted."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
