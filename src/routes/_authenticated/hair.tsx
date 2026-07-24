import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Droplets, Leaf, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hair")({
  head: () => ({
    meta: [
      { title: "Cronograma Capilar — Lunaria" },
      { name: "description", content: "Registre hidratação, nutrição e reconstrução do seu cabelo." },
      { property: "og:title", content: "Cronograma Capilar — Lunaria" },
      { property: "og:description", content: "Registre hidratação, nutrição e reconstrução do seu cabelo." },
    ],
  }),
  component: HairPage,
});

type Log = {
  id: string;
  entry_date: string;
  treatment_type: "hydration" | "nutrition" | "reconstruction";
  product: string | null;
  notes: string | null;
};

const ORDER: Array<Log["treatment_type"]> = ["hydration", "nutrition", "reconstruction"];

function HairPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [logs, setLogs] = useState<Log[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [treatmentType, setTreatmentType] = useState<Log["treatment_type"]>("hydration");
  const [product, setProduct] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("hair_care_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false })
      .limit(50);
    setLogs((data ?? []) as Log[]);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    await supabase.from("hair_care_logs").insert({
      user_id: user.id,
      entry_date: entryDate,
      treatment_type: treatmentType,
      product: product || null,
      notes: notes || null,
    });
    setProduct("");
    setNotes("");
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("hair_care_logs").delete().eq("id", id);
    load();
  }

  // Compute next recommended step
  const last = logs[0]?.treatment_type;
  const nextIdx = last ? (ORDER.indexOf(last) + 1) % ORDER.length : 0;
  const nextStep = ORDER[nextIdx];

  const ICON: Record<Log["treatment_type"], any> = {
    hydration: Droplets,
    nutrition: Leaf,
    reconstruction: Wrench,
  };
  const NextIcon = ICON[nextStep];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("hair.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("hair.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="rounded-full gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> {t("hair.new")}
        </Button>
      </header>

      <section className="surface-card p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
            <NextIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("hair.next")}</p>
            <p className="font-display text-xl">{t(`hair.type.${nextStep}`)}</p>
          </div>
        </div>
      </section>

      {showForm && (
        <form onSubmit={save} className="surface-card p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("hair.date")}</Label>
              <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required />
            </div>
            <div>
              <Label>{t("hair.type")}</Label>
              <Select value={treatmentType} onValueChange={(v) => setTreatmentType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydration">{t("hair.type.hydration")}</SelectItem>
                  <SelectItem value="nutrition">{t("hair.type.nutrition")}</SelectItem>
                  <SelectItem value="reconstruction">{t("hair.type.reconstruction")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("hair.product")}</Label>
            <Input value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div>
            <Label>{t("hair.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full gradient-primary">{t("common.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      <section className="space-y-2">
        {logs.length === 0 && <p className="text-muted-foreground text-sm">{t("hair.empty")}</p>}
        {logs.map((log) => {
          const Icon = ICON[log.treatment_type];
          return (
            <div key={log.id} className="surface-card p-4 flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="font-medium">{t(`hair.type.${log.treatment_type}`)}</div>
                <div className="text-xs text-muted-foreground">{log.entry_date}{log.product ? ` · ${log.product}` : ""}</div>
                {log.notes && <p className="text-sm mt-1 text-muted-foreground">{log.notes}</p>}
              </div>
              <button onClick={() => remove(log.id)} className="text-muted-foreground hover:text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
