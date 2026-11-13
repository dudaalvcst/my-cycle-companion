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
import { Trash2, Plus, Droplets, Leaf, Wrench, Scissors } from "lucide-react";
import { toast } from "sonner";
import { isStandardProcess, nextHairProcess, savedHairProcess, type HairProcess } from "@/lib/hair-process";

export const Route = createFileRoute("/_authenticated/hair")({
  head: () => ({
    meta: [
      { title: "Cronograma Capilar — Três Marias" },
      { name: "description", content: "Registre hidratação, nutrição e reconstrução do seu cabelo." },
      { property: "og:title", content: "Cronograma Capilar — Três Marias" },
      { property: "og:description", content: "Registre hidratação, nutrição e reconstrução do seu cabelo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HairPage,
});

type Log = {
  id: string;
  entry_date: string;
  treatment_type: string;
  product: string | null;
  notes: string | null;
};

function HairPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [logs, setLogs] = useState<Log[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [treatmentType, setTreatmentType] = useState<HairProcess>("hydration");
  const [processMode, setProcessMode] = useState<"select" | "write">("select");
  const [writtenProcess, setWrittenProcess] = useState("");
  const [saving, setSaving] = useState(false);
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
    const process = savedHairProcess(processMode, treatmentType, writtenProcess);
    if (!process) return;
    setSaving(true);
    const { error } = await supabase.from("hair_care_logs").insert({
      user_id: user.id,
      entry_date: entryDate,
      treatment_type: process,
      product: product || null,
      notes: notes || null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setWrittenProcess("");
    setProduct("");
    setNotes("");
    setShowForm(true);
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("hair_care_logs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  // Compute next recommended step
  const nextStep = nextHairProcess(logs);

  const ICON = {
    hydration: Droplets,
    nutrition: Leaf,
    reconstruction: Wrench,
  };
  const NextIcon = ICON[nextStep];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
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
              <Label htmlFor="hair-process">{t("hair.type")}</Label>
              <div className="flex gap-2 my-2" role="group" aria-label={t("hair.type")}>
                <Button type="button" size="sm" variant={processMode === "select" ? "default" : "outline"} aria-pressed={processMode === "select"} onClick={() => setProcessMode("select")}>{t("hair.select")}</Button>
                <Button type="button" size="sm" variant={processMode === "write" ? "default" : "outline"} aria-pressed={processMode === "write"} onClick={() => setProcessMode("write")}>{t("hair.write")}</Button>
              </div>
              {processMode === "write" ? (
                <Input id="hair-process" value={writtenProcess} onChange={(e) => setWrittenProcess(e.target.value)} required />
              ) : (
              <Select value={treatmentType} onValueChange={(v) => { if (isStandardProcess(v)) setTreatmentType(v); }}>
                <SelectTrigger id="hair-process"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hydration">{t("hair.type.hydration")}</SelectItem>
                  <SelectItem value="nutrition">{t("hair.type.nutrition")}</SelectItem>
                  <SelectItem value="reconstruction">{t("hair.type.reconstruction")}</SelectItem>
                </SelectContent>
              </Select>
              )}
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
            <Button type="submit" disabled={saving} className="rounded-full gradient-primary">{t("common.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      <section className="space-y-2">
        {logs.length === 0 && <p className="text-muted-foreground text-sm">{t("hair.empty")}</p>}
        {logs.map((log) => {
          const standard = isStandardProcess(log.treatment_type);
          const Icon = isStandardProcess(log.treatment_type) ? ICON[log.treatment_type] : Scissors;
          return (
            <div key={log.id} className="surface-card p-4 flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent shrink-0">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 break-words">
                <div className="font-medium">{standard ? t(`hair.type.${log.treatment_type}`) : log.treatment_type}</div>
                <div className="text-xs text-muted-foreground">{log.entry_date}{log.product ? ` · ${log.product}` : ""}</div>
                {log.notes && <p className="text-sm mt-1 text-muted-foreground">{log.notes}</p>}
              </div>
              <Button variant="ghost" size="icon" aria-label={`${t("common.delete")} ${standard ? t(`hair.type.${log.treatment_type}`) : log.treatment_type}`} title={t("common.delete")} onClick={() => remove(log.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
