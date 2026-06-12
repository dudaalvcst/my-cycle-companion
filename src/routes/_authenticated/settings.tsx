import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const [dum, setDum] = useState("");
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("cycle_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setDum(data.last_period_start);
        setCycle(data.cycle_length);
        setPeriod(data.period_length);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("cycle_settings").upsert({
      user_id: user.id,
      last_period_start: dum,
      cycle_length: cycle,
      period_length: period,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await logAudit({ event: "HEALTH_DATA_MODIFIED", user_id: user.id, fields_changed: ["last_period_start", "cycle_length", "period_length"], scope: "SETTINGS" });
    toast.success("✓");
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-3xl">{t("settings.title")}</h1>

      <section className="surface-card p-6">
        <h2 className="font-display text-lg">{t("settings.language")}</h2>
        <div className="mt-3 inline-flex rounded-full border border-border bg-card p-0.5">
          {(["pt", "en"] as Locale[]).map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={`px-4 py-1.5 rounded-full text-sm transition ${locale === l ? "gradient-primary" : "text-muted-foreground"}`}>
              {l === "pt" ? "Português" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-6 space-y-4">
        <h2 className="font-display text-lg">{t("settings.cycle")}</h2>
        <div>
          <Label htmlFor="dum">{t("onboarding.dum")}</Label>
          <Input id="dum" type="date" value={dum} onChange={(e) => setDum(e.target.value)} className="mt-1 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cl">{t("onboarding.cycle")}</Label>
            <Input id="cl" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(parseInt(e.target.value) || 28)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="pl">{t("onboarding.period")}</Label>
            <Input id="pl" type="number" min={1} max={10} value={period} onChange={(e) => setPeriod(parseInt(e.target.value) || 5)} className="mt-1 rounded-xl" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="rounded-full gradient-primary">{t("settings.update")}</Button>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
