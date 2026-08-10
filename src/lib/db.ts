import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  faculty: string | null;
  credits: number;
  color: string;
  notes: string | null;
  created_at: string;
};

export type ClassItem = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  faculty: string | null;
  room: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type TaskStatus = "pending" | "in_progress" | "completed";
export type Priority = "low" | "medium" | "high";

export type Task = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
};

export type DeadlineType = "exam" | "assignment" | "project" | "other";

export type Deadline = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  type: DeadlineType;
  description: string | null;
  due_date: string;
  status: "upcoming" | "completed";
};

export type Note = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  content: string | null;
  updated_at: string;
};

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SUBJECT_COLORS = [
  "#4f6bed",
  "#0e9f6e",
  "#e3a008",
  "#e02424",
  "#7e3af2",
  "#0694a2",
  "#d61f69",
  "#5850ec",
];

type TableName = "subjects" | "classes" | "tasks" | "deadlines" | "notes";

function useList<T>(table: TableName, orderBy: string, ascending = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [table, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderBy, { ascending, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export const useSubjects = () => useList<Subject>("subjects", "name");
export const useClasses = () => useList<ClassItem>("classes", "start_time");
export const useTasks = () => useList<Task>("tasks", "due_date");
export const useDeadlines = () => useList<Deadline>("deadlines", "due_date");
export const useNotes = () => useList<Note>("notes", "updated_at", false);

export function useSaveRecord(table: TableName, label: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Record<string, unknown> }) => {
      if (id) {
        const { error } = await supabase.from(table).update(values).eq("id", id);
        if (error) throw error;
        return "updated";
      }
      const { error } = await supabase.from(table).insert({ ...values, user_id: user!.id } as never);
      if (error) throw error;
      return "created";
    },
    onSuccess: (mode) => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} ${mode === "created" ? "created" : "updated"}`);
    },
    onError: (error: Error) => toast.error(error.message || `Could not save ${label.toLowerCase()}`),
  });
}

export function useDeleteRecord(table: TableName, label: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      toast.success(`${label} deleted`);
    },
    onError: (error: Error) =>
      toast.error(error.message || `Could not delete ${label.toLowerCase()}`),
  });
}

export function formatTime(value: string) {
  const [h, m] = value.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86400000);
}
