import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { NotebookPen, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { PageHeader, EmptyState, ListSkeleton, ErrorState } from "@/components/state";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useDeleteRecord, useNotes, useSaveRecord, useSubjects, type Note } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({
    meta: [
      { title: "Study Notes — StudyMate" },
      {
        name: "description",
        content:
          "Write and search subject-wise study notes, summaries and formulas in one searchable place.",
      },
      { property: "og:title", content: "Study Notes — StudyMate" },
      { property: "og:description", content: "Searchable, subject-wise notes for revision." },
    ],
  }),
  component: NotesPage,
});

type FormState = { title: string; content: string; subject_id: string };
const EMPTY: FormState = { title: "", content: "", subject_id: "none" };

function NotesPage() {
  const { data, isLoading, error } = useNotes();
  const subjects = useSubjects();
  const save = useSaveRecord("notes", "Note");
  const remove = useDeleteRecord("notes", "Note");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const subjectMap = new Map((subjects.data ?? []).map((s) => [s.id, s]));

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data ?? [])
      .filter((note) => (subjectFilter === "all" ? true : note.subject_id === subjectFilter))
      .filter((note) =>
        term
          ? note.title.toLowerCase().includes(term) ||
            (note.content ?? "").toLowerCase().includes(term)
          : true,
      );
  }, [data, query, subjectFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setForm({
      title: note.title,
      content: note.content ?? "",
      subject_id: note.subject_id ?? "none",
    });
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Note title is required");
      return;
    }
    await save.mutateAsync({
      id: editing?.id,
      values: {
        title: form.title.trim().slice(0, 140),
        content: form.content.trim() || null,
        subject_id: form.subject_id === "none" ? null : form.subject_id,
        updated_at: new Date().toISOString(),
      },
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Summaries, formulas and revision points, searchable by keyword."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New note
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="pl-9"
            aria-label="Search notes"
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="sm:w-[200px]">
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
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorState message={error.message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title={(data?.length ?? 0) === 0 ? "No notes yet" : "No matching notes"}
          description={
            (data?.length ?? 0) === 0
              ? "Capture key points while they're fresh — future you will thank you."
              : "Try a different search term or subject."
          }
          action={
            (data?.length ?? 0) === 0 ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" /> New note
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((note) => {
            const subject = note.subject_id ? subjectMap.get(note.subject_id) : undefined;
            return (
              <article
                key={note.id}
                className="surface group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-semibold leading-snug">{note.title}</h2>
                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(note)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => setDeleteId(note.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                {note.content && (
                  <p className="mt-3 line-clamp-6 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                    {note.content}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                  {subject ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </span>
                  ) : (
                    <span>General</span>
                  )}
                  <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit note" : "New note"}</DialogTitle>
            <DialogDescription>Keep it short enough that you'll actually reread it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Graph traversal cheat sheet"
                maxLength={140}
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
                  <SelectItem value="none">General</SelectItem>
                  {(subjects.data ?? []).map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={10}
                maxLength={10000}
                placeholder="BFS uses a queue, DFS uses a stack…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Create note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!deleteId}
        onOpenChange={(value) => !value && setDeleteId(null)}
        title="Delete note?"
        description="This note will be permanently removed."
        onConfirm={() => {
          if (deleteId) remove.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
