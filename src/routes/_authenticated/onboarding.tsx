import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dum, setDum] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cycle, setCycle] = useState(28);
  const [period, setPeriod] = useState(5);
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("cycle_settings").upsert({
      user_id: user.id,
      last_period_start: dum,
      cycle_length: cycle,
      period_length: period,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAudit({
      event: "HEALTH_DATA_MODIFIED",
      user_id: user.id,
      fields_changed: ["last_period_start", "cycle_length", "period_length"],
      scope: "ONBOARDING",
    });
    window.location.assign("/dashboard");
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="surface-card p-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("onboarding.title")}</p>
        <h1 className="mt-2 font-display text-3xl">{t("onboarding.subtitle")}</h1>

        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {step === 0 && (
            <div>
              <Label htmlFor="dum">{t("onboarding.dum")}</Label>
              <Input id="dum" type="date" value={dum} max={format(new Date(), "yyyy-MM-dd")} onChange={(e) => setDum(e.target.value)} className="mt-1 rounded-xl" />
            </div>
          )}
          {step === 1 && (
            <div>
              <Label htmlFor="cycle">{t("onboarding.cycle")}</Label>
              <Input id="cycle" type="number" min={20} max={45} value={cycle} onChange={(e) => setCycle(parseInt(e.target.value) || 28)} className="mt-1 rounded-xl" />
              <p className="mt-1 text-xs text-muted-foreground">{t("onboarding.cycle.hint")}</p>
            </div>
          )}
          {step === 2 && (
            <div>
              <Label htmlFor="period">{t("onboarding.period")}</Label>
              <Input id="period" type="number" min={1} max={10} value={period} onChange={(e) => setPeriod(parseInt(e.target.value) || 5)} className="mt-1 rounded-xl" />
              <p className="mt-1 text-xs text-muted-foreground">{t("onboarding.period.hint")}</p>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            {t("onboarding.back")}
          </Button>
          {step < 2 ? (
            <Button onClick={() => setStep((s) => s + 1)} className="rounded-full gradient-primary">
              {t("onboarding.next")}
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving} className="rounded-full gradient-primary">
              {t("onboarding.finish")}
            </Button>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </div>
  );
}
