import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarClock, MapPin, Trash2, Plus } from "lucide-react";
import { fmtDate } from "@/lib/cycle";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — Lunaria" },
      { name: "description", content: "Gerencie seus compromissos e eventos pessoais." },
      { property: "og:title", content: "Agenda — Lunaria" },
      { property: "og:description", content: "Gerencie seus compromissos e eventos pessoais." },
    ],
  }),
  component: AgendaPage,
});

type Ev = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
};

function AgendaPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [events, setEvents] = useState<Ev[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("agenda_events")
      .select("*")
      .eq("user_id", user.id)
      .order("start_at", { ascending: true });
    setEvents((data ?? []) as Ev[]);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title || !startAt) return;
    await supabase.from("agenda_events").insert({
      user_id: user.id,
      title,
      description: description || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      location: location || null,
    });
    setTitle("");
    setDescription("");
    setStartAt("");
    setEndAt("");
    setLocation("");
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("agenda_events").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("agenda.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("agenda.subtitle")}</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full gradient-primary"
        >
          <Plus className="h-4 w-4 mr-1" /> {t("agenda.new")}
        </Button>
      </header>

      {showForm && (
        <form onSubmit={save} className="surface-card p-6 space-y-4">
          <div>
            <Label>{t("agenda.title.field")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("agenda.start")}</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
            </div>
            <div>
              <Label>{t("agenda.end")}</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("agenda.location")}</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label>{t("agenda.description")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full gradient-primary">{t("common.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      <section className="space-y-3">
        {events.length === 0 && <p className="text-muted-foreground text-sm">{t("agenda.empty")}</p>}
        {events.map((ev) => {
          const start = new Date(ev.start_at);
          return (
            <div key={ev.id} className="surface-card p-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-display text-lg">{ev.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {fmtDate(start, locale)} · {start.toLocaleTimeString(locale === "pt" ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {ev.location && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5" /> {ev.location}
                  </div>
                )}
                {ev.description && <p className="text-sm mt-2 text-muted-foreground">{ev.description}</p>}
              </div>
              <button onClick={() => remove(ev.id)} className="text-muted-foreground hover:text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
