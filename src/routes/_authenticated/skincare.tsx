import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Sun, Moon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/skincare")({
  head: () => ({
    meta: [
      { title: "Skin Care — Lunaria" },
      { name: "description", content: "Monte sua rotina AM/PM e acompanhe seus check-ins diários." },
      { property: "og:title", content: "Skin Care — Lunaria" },
      { property: "og:description", content: "Monte sua rotina AM/PM e acompanhe seus check-ins diários." },
    ],
  }),
  component: SkincarePage,
});

type Step = {
  id: string;
  name: string;
  time_of_day: "am" | "pm";
  step_order: number;
  product: string | null;
};

type Checkin = {
  id: string;
  entry_date: string;
  am_done: boolean;
  pm_done: boolean;
};

function SkincarePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [steps, setSteps] = useState<Step[]>([]);
  const [today, setToday] = useState<Checkin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<"am" | "pm">("am");
  const [product, setProduct] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  async function load() {
    if (!user) return;
    const [s, c] = await Promise.all([
      supabase.from("skincare_steps").select("*").eq("user_id", user.id).order("time_of_day").order("step_order"),
      supabase.from("skincare_checkins").select("*").eq("user_id", user.id).eq("entry_date", todayStr).maybeSingle(),
    ]);
    setSteps((s.data ?? []) as Step[]);
    setToday((c.data as Checkin) ?? null);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name) return;
    const order = steps.filter((s) => s.time_of_day === timeOfDay).length;
    await supabase.from("skincare_steps").insert({
      user_id: user.id,
      name,
      time_of_day: timeOfDay,
      step_order: order,
      product: product || null,
    });
    setName("");
    setProduct("");
    setShowForm(false);
    load();
  }

  async function removeStep(id: string) {
    await supabase.from("skincare_steps").delete().eq("id", id);
    load();
  }

  async function toggleCheckin(kind: "am" | "pm") {
    if (!user) return;
    const current = today ?? { am_done: false, pm_done: false };
    const next = { ...current, [`${kind}_done`]: !(current as any)[`${kind}_done`] };
    await supabase.from("skincare_checkins").upsert(
      {
        user_id: user.id,
        entry_date: todayStr,
        am_done: next.am_done,
        pm_done: next.pm_done,
      },
      { onConflict: "user_id,entry_date" },
    );
    load();
  }

  const amSteps = steps.filter((s) => s.time_of_day === "am");
  const pmSteps = steps.filter((s) => s.time_of_day === "pm");

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{t("skincare.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("skincare.subtitle")}</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="rounded-full gradient-primary">
          <Plus className="h-4 w-4 mr-1" /> {t("skincare.new")}
        </Button>
      </header>

      {showForm && (
        <form onSubmit={addStep} className="surface-card p-6 space-y-4">
          <div>
            <Label>{t("skincare.step.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>{t("skincare.period")}</Label>
              <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="am">{t("skincare.am")}</SelectItem>
                  <SelectItem value="pm">{t("skincare.pm")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("skincare.product")}</Label>
              <Input value={product} onChange={(e) => setProduct(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="rounded-full gradient-primary">{t("common.save")}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>{t("common.cancel")}</Button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(["am", "pm"] as const).map((period) => {
          const list = period === "am" ? amSteps : pmSteps;
          const Icon = period === "am" ? Sun : Moon;
          const done = period === "am" ? today?.am_done : today?.pm_done;
          return (
            <section key={period} className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-xl">{t(`skincare.${period}`)}</h2>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox checked={!!done} onCheckedChange={() => toggleCheckin(period)} />
                  {t("skincare.done.today")}
                </label>
              </div>
              {list.length === 0 && <p className="text-muted-foreground text-sm">{t("skincare.empty")}</p>}
              <ol className="space-y-2">
                {list.map((step, i) => (
                  <li key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-accent/40">
                    <span className="font-display text-primary w-6">{i + 1}.</span>
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      {step.product && <div className="text-xs text-muted-foreground">{step.product}</div>}
                    </div>
                    <button onClick={() => removeStep(step.id)} className="text-muted-foreground hover:text-destructive transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
