import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { FLOWS, SYMPTOMS, MOODS, fmtDate } from "@/lib/cycle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/diary")({
  component: Diary,
});

interface Entry {
  id: string;
  entry_date: string;
  flow: string | null;
  symptoms: string[];
  moods: string[];
  notes: string | null;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${active ? "gradient-primary border-transparent shadow-soft" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function Diary() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [flow, setFlow] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_entries")
      .select("id, entry_date, flow, symptoms, moods, notes")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(10);
    if (data) setHistory(data as Entry[]);
  };

  useEffect(() => {
    loadHistory();
    if (user) logAudit({ event: "HEALTH_DATA_VIEWED", user_id: user.id, scope: "DIARY" });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("daily_entries")
        .select("flow, symptoms, moods, notes")
        .eq("user_id", user.id)
        .eq("entry_date", date)
        .maybeSingle();
      if (data) {
        setFlow(data.flow ?? "");
        setSymptoms(data.symptoms ?? []);
        setMoods(data.moods ?? []);
        setNotes(data.notes ?? "");
      } else {
        setFlow(""); setSymptoms([]); setMoods([]); setNotes("");
      }
    })();
  }, [date, user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("daily_entries").upsert(
      { user_id: user.id, entry_date: date, flow: flow || null, symptoms, moods, notes: notes || null },
      { onConflict: "user_id,entry_date" },
    );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("diary.saved"));
    await logAudit({ event: "HEALTH_DATA_MODIFIED", user_id: user.id, scope: "DIARY", fields_changed: ["entry_date", "flow", "symptoms", "moods", "notes"] });
    loadHistory();
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="surface-card p-7">
        <h1 className="font-display text-2xl">{t("diary.title")}</h1>

        <div className="mt-6 space-y-6">
          <div>
            <Label htmlFor="d">{t("diary.date")}</Label>
            <Input id="d" type="date" value={date} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDate(e.target.value)} className="mt-1 rounded-xl max-w-xs" />
          </div>

          <div>
            <Label>{t("diary.flow")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLOWS.map((f) => (
                <Chip key={f} active={flow === f} onClick={() => setFlow(flow === f ? "" : f)}>{t(`flow.${f}`)}</Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>{t("diary.symptoms")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <Chip key={s} active={symptoms.includes(s)} onClick={() => toggle(symptoms, s, setSymptoms)}>{t(`symptom.${s}`)}</Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>{t("diary.moods")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <Chip key={m} active={moods.includes(m)} onClick={() => toggle(moods, m, setMoods)}>{t(`mood.${m}`)}</Chip>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">{t("diary.notes")}</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-1 rounded-xl" />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="rounded-full gradient-primary">{t("diary.save")}</Button>
          </div>

          <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
        </div>
      </div>

      <aside className="surface-card p-6 h-fit">
        <h2 className="font-display text-lg">{t("diary.history")}</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("diary.empty")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.map((e) => (
              <li key={e.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{fmtDate(new Date(e.entry_date + "T00:00:00"), locale)}</p>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  {e.flow && <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{t(`flow.${e.flow}`)}</span>}
                  {e.symptoms.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-muted px-2 py-0.5">{t(`symptom.${s}`)}</span>)}
                  {e.moods.slice(0, 2).map((m) => <span key={m} className="rounded-full bg-muted px-2 py-0.5">{t(`mood.${m}`)}</span>)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
