import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tarefas — Lunaria" },
      { name: "description", content: "Organize suas tarefas com prioridade e prazo." },
      { property: "og:title", content: "Tarefas — Lunaria" },
      { property: "og:description", content: "Organize suas tarefas com prioridade e prazo." },
    ],
  }),
  component: TasksPage,
});

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  completed: boolean;
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-destructive",
};

function TasksPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data ?? []) as Task[]);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title) return;
    await supabase.from("tasks").insert({
      user_id: user.id,
      title,
      description: description || null,
      priority,
      due_date: dueDate || null,
    });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setShowForm(false);
    load();
  }

  async function toggle(task: Task) {
    await supabase
      .from("tasks")
      .update({ completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null })
      .eq("id", task.id);
    load();
  }

  async function remove(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("tasks.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("tasks.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="rounded-full gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> {t("tasks.new")}
        </Button>
      </header>

      {showForm && (
        <form onSubmit={save} className="surface-card p-6 space-y-4">
          <div>
            <Label>{t("tasks.title.field")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("tasks.priority")}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("tasks.priority.low")}</SelectItem>
                  <SelectItem value="medium">{t("tasks.priority.medium")}</SelectItem>
                  <SelectItem value="high">{t("tasks.priority.high")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("tasks.due")}</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("tasks.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full gradient-primary">{t("common.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      <section className="space-y-2">
        {tasks.length === 0 && <p className="text-muted-foreground text-sm">{t("tasks.empty")}</p>}
        {tasks.map((task) => (
          <div key={task.id} className="surface-card p-4 flex items-start gap-3">
            <Checkbox checked={task.completed} onCheckedChange={() => toggle(task)} className="mt-1" />
            <div className="flex-1">
              <div className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </div>
              <div className="text-xs mt-0.5 flex items-center gap-2">
                <span className={PRIORITY_COLOR[task.priority]}>● {t(`tasks.priority.${task.priority}`)}</span>
                {task.due_date && <span className="text-muted-foreground">· {task.due_date}</span>}
              </div>
              {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            </div>
            <button onClick={() => remove(task.id)} className="text-muted-foreground hover:text-destructive transition">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
