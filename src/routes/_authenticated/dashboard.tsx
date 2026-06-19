import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { computeCycle, fmtDate, type CycleSettings, type Phase, type PeriodLog } from "@/lib/cycle";
import { logAudit } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Droplet, Sparkles, Flower2, Moon as MoonIcon } from "lucide-react";
import { CycleCalendar } from "@/components/cycle-calendar";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const PHASE_META: Record<Phase, { icon: any; tokenClass: string; key: string }> = {
  menstrual: { icon: Droplet, tokenClass: "phase-menstrual", key: "phase.menstrual" },
  follicular: { icon: Flower2, tokenClass: "phase-follicular", key: "phase.follicular" },
  ovulatory: { icon: Sparkles, tokenClass: "phase-ovulatory", key: "phase.ovulatory" },
  luteal: { icon: MoonIcon, tokenClass: "phase-ovulatory", key: "phase.ovulatory" },
};

// fix the luteal token
PHASE_META.luteal = { icon: MoonIcon, tokenClass: "phase-luteal", key: "phase.luteal" };

function Dashboard() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [displayName, setDisplayName] = useState<string>("");

  async function reloadLogs(uid: string) {
    const { data } = await supabase
      .from("period_logs")
      .select("start_date, end_date")
      .eq("user_id", uid)
      .order("start_date", { ascending: true });
    setLogs((data ?? []) as PeriodLog[]);
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [s, p, l] = await Promise.all([
        supabase.from("cycle_settings").select("last_period_start, cycle_length, period_length").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("period_logs").select("start_date, end_date").eq("user_id", user.id).order("start_date", { ascending: true }),
      ]);
      if (s.data) setSettings(s.data as CycleSettings);
      setLogs((l.data ?? []) as PeriodLog[]);
      setDisplayName(p.data?.display_name ?? user.email?.split("@")[0] ?? "");
      logAudit({ event: "HEALTH_DATA_VIEWED", user_id: user.id, scope: "DASHBOARD" });
    })();
  }, [user]);

  if (!settings) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  const c = computeCycle(logs, settings);
  const meta = PHASE_META[c.phase];
  const Icon = meta.icon;

  const fertileText =
    c.daysUntilFertile > 0
      ? t("dashboard.starts.in", { n: c.daysUntilFertile })
      : c.daysUntilFertile <= 0 && new Date() <= c.fertileEnd
      ? `${fmtDate(c.fertileStart, locale)} → ${fmtDate(c.fertileEnd, locale)}`
      : t("dashboard.in.days", { n: Math.max(0, c.daysUntilNextPeriod - 14 - 3 + c.effectiveCycleLength) });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{t("dashboard.hello")},</p>
        <h1 className="font-display text-3xl">{displayName}</h1>
      </header>

      <section
        className="surface-card overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, color-mix(in oklch, var(--color-${meta.tokenClass}) 18%, var(--card)) 0%, var(--card) 70%)` }}
      >
        <div className="p-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Icon className="h-3.5 w-3.5" style={{ color: `var(--color-${meta.tokenClass})` }} />
            <span>{t(meta.key)}</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-6xl tracking-tight">{c.cycleDay}</span>
            <span className="text-sm text-muted-foreground">{t("dashboard.of.cycle")}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t(`${meta.key}.desc`)}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-border bg-card/60 backdrop-blur">
          <div className="p-5 border-r border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.next.period")}</p>
            <p className="mt-1 font-display text-lg">{fmtDate(c.nextPeriodDate, locale)}</p>
            <p className="text-xs text-muted-foreground">{t("dashboard.in.days", { n: Math.max(0, c.daysUntilNextPeriod) })}</p>
          </div>
          <div className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.fertile.window")}</p>
            <p className="mt-1 font-display text-lg">{fmtDate(c.fertileStart, locale)} → {fmtDate(c.fertileEnd, locale)}</p>
            <p className="text-xs text-muted-foreground">{fertileText}</p>
          </div>
        </div>
      </section>
      <CycleCalendar
        settings={settings}
        logs={logs}
        onLogStart={async (date) => {
          if (!user) return;
          const { error } = await supabase
            .from("period_logs")
            .upsert({ user_id: user.id, start_date: date }, { onConflict: "user_id,start_date" });
          if (error) return;
          // Keep cycle_settings.last_period_start in sync with the most recent log
          const allStarts = [...logs.map((l) => l.start_date), date].sort();
          const newest = allStarts[allStarts.length - 1];
          if (newest !== settings.last_period_start) {
            await supabase.from("cycle_settings").update({ last_period_start: newest }).eq("user_id", user.id);
            setSettings({ ...settings, last_period_start: newest });
          }
          await reloadLogs(user.id);
          logAudit({
            event: "HEALTH_DATA_MODIFIED",
            user_id: user.id,
            scope: "PERIOD_LOG",
            fields_changed: ["start_date"],
          });
        }}
        onLogEnd={async (startDate, endDate) => {
          if (!user) return;
          const { error } = await supabase
            .from("period_logs")
            .update({ end_date: endDate })
            .eq("user_id", user.id)
            .eq("start_date", startDate);
          if (error) return;
          await reloadLogs(user.id);
          logAudit({
            event: "HEALTH_DATA_MODIFIED",
            user_id: user.id,
            scope: "PERIOD_LOG",
            fields_changed: ["end_date"],
          });
        }}
        onRemoveLog={async (startDate) => {
          if (!user) return;
          const { error } = await supabase
            .from("period_logs")
            .delete()
            .eq("user_id", user.id)
            .eq("start_date", startDate);
          if (error) return;
          await reloadLogs(user.id);
          logAudit({
            event: "HEALTH_DATA_MODIFIED",
            user_id: user.id,
            scope: "PERIOD_LOG",
            fields_changed: ["deleted"],
          });
        }}
      />


      <section className="surface-card p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-lg">{t("dashboard.log.today")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("disclaimer")}</p>
        </div>
        <Link to="/diary">
          <Button className="rounded-full gradient-primary shrink-0">{t("dashboard.log.cta")}</Button>
        </Link>
      </section>
    </div>
  );
}
