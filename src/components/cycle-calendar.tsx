import { useMemo, useState } from "react";
import {
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  phaseForDate,
  isOvulationDay,
  isPredictedDate,
  type CycleSettings,
  type Phase,
  type PeriodLog,
} from "@/lib/cycle";
import { useI18n } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PHASE_TOKENS: Record<Phase, string> = {
  menstrual: "var(--color-phase-menstrual)",
  follicular: "var(--color-phase-follicular)",
  ovulatory: "var(--color-phase-ovulatory)",
  luteal: "var(--color-phase-luteal)",
};

const PHASE_KEYS: Record<Phase, string> = {
  menstrual: "phase.menstrual",
  follicular: "phase.follicular",
  ovulatory: "phase.ovulatory",
  luteal: "phase.luteal",
};

export interface CycleCalendarProps {
  settings: CycleSettings;
  logs: PeriodLog[];
  onLogStart?: (date: string) => Promise<void> | void;
  onLogEnd?: (startDate: string, endDate: string) => Promise<void> | void;
  onRemoveLog?: (startDate: string) => Promise<void> | void;
}

export function CycleCalendar({
  settings,
  logs,
  onLogStart,
  onLogEnd,
  onRemoveLog,
}: CycleCalendarProps) {
  const { t, locale } = useI18n();
  const dfLocale = locale === "pt" ? ptBR : enUS;
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => startOfMonth(today));
  const [selected, setSelected] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { locale: dfLocale });
    const gridEnd = endOfWeek(monthEnd, { locale: dfLocale });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor, dfLocale]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date(), { locale: dfLocale });
    return Array.from({ length: 7 }, (_, i) =>
      format(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), "EEEEEE", { locale: dfLocale }),
    );
  }, [dfLocale]);

  const startsSet = useMemo(() => new Set(logs.map((l) => l.start_date)), [logs]);

  const periodRanges = useMemo(
    () =>
      logs.map((l) => {
        const s = startOfDay(new Date(l.start_date + "T00:00:00"));
        const e = l.end_date ? startOfDay(new Date(l.end_date + "T00:00:00")) : s;
        return { start: s, end: e };
      }),
    [logs],
  );

  // Find the most recent logged start <= selected (the cycle that contains selected)
  const owningStart = useMemo(() => {
    if (!selected) return null;
    const iso = format(selected, "yyyy-MM-dd");
    const sorted = [...logs].sort((a, b) => a.start_date.localeCompare(b.start_date));
    let owner: string | null = null;
    for (const l of sorted) if (l.start_date <= iso) owner = l.start_date;
    return owner;
  }, [selected, logs]);

  async function handleSetStart() {
    if (!selected || !onLogStart) return;
    setSaving(true);
    try {
      await onLogStart(format(selected, "yyyy-MM-dd"));
      toast.success(t("calendar.saved"));
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleSetEnd() {
    if (!selected || !owningStart || !onLogEnd) return;
    const startD = startOfDay(new Date(owningStart + "T00:00:00"));
    const len = differenceInCalendarDays(selected, startD) + 1;
    if (len < 1 || len > 14) {
      toast.error(t("calendar.end.invalid"));
      return;
    }
    setSaving(true);
    try {
      await onLogEnd(owningStart, format(selected, "yyyy-MM-dd"));
      toast.success(t("calendar.saved"));
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!selected || !onRemoveLog) return;
    const iso = format(selected, "yyyy-MM-dd");
    if (!startsSet.has(iso)) return;
    setSaving(true);
    try {
      await onRemoveLog(iso);
      toast.success(t("calendar.removed"));
      setSelected(null);
    } finally {
      setSaving(false);
    }
  }

  const selectedIso = selected ? format(selected, "yyyy-MM-dd") : null;
  const selectedIsLoggedStart = !!selectedIso && startsSet.has(selectedIso);
  const canEndForSelected = useMemo(() => {
    if (!selected || !owningStart) return false;
    const startD = startOfDay(new Date(owningStart + "T00:00:00"));
    const len = differenceInCalendarDays(selected, startD) + 1;
    return len >= 1 && len <= 14;
  }, [selected, owningStart]);

  return (
    <section className="surface-card p-5 sm:p-6">
      <header className="flex items-center justify-between">
        <h2 className="font-display text-lg capitalize">
          {format(cursor, "LLLL yyyy", { locale: dfLocale })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t("calendar.prev")}
            onClick={() => setCursor((c) => subMonths(c, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            {t("calendar.today")}
          </button>
          <button
            type="button"
            aria-label={t("calendar.next")}
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
        {weekDays.map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const phase = phaseForDate(logs, settings, day);
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          const isOvu = isOvulationDay(logs, settings, day);
          const predicted = isPredictedDate(logs, settings, day);
          const isFuture = isAfter(startOfDay(day), today);
          const showAsPrediction = predicted && isFuture;
          const dayStart = startOfDay(day);
          const inPeriod = periodRanges.some((r) => dayStart >= r.start && dayStart <= r.end);
          const color = PHASE_TOKENS[phase];
          const ovuColor = PHASE_TOKENS.ovulatory;
          const label = `${format(day, "PP", { locale: dfLocale })} — ${t(PHASE_KEYS[phase])}${isOvu ? ` · ${t("calendar.ovulation")}` : ""}${inPeriod ? ` · ${t("calendar.periodDay")}` : ""}${showAsPrediction ? ` · ${t("calendar.prediction")}` : ""}`;
          const baseBg = isOvu
            ? `radial-gradient(circle at center, ${ovuColor} 0%, ${ovuColor} 55%, color-mix(in oklch, ${color} 30%, transparent) 100%)`
            : inMonth
            ? `color-mix(in oklch, ${color} ${inPeriod ? 55 : showAsPrediction ? 12 : 22}%, transparent)`
            : `color-mix(in oklch, ${color} ${inPeriod ? 30 : 8}%, transparent)`;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              className="aspect-square flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              title={label}
              aria-label={label}
            >
              <div
                className="relative flex h-full w-full items-center justify-center rounded-xl text-sm transition hover:scale-[1.04]"
                style={{
                  background: baseBg,
                  color: isOvu
                    ? "var(--primary-foreground)"
                    : inMonth
                    ? undefined
                    : "var(--muted-foreground)",
                  boxShadow: isToday
                    ? `inset 0 0 0 2px var(--foreground)`
                    : isOvu
                    ? `0 4px 14px color-mix(in oklch, ${ovuColor} 45%, transparent)`
                    : inPeriod
                    ? `inset 0 0 0 2px ${PHASE_TOKENS.menstrual}`
                    : undefined,
                  outline: showAsPrediction && !isOvu ? `1px dashed color-mix(in oklch, ${color} 70%, transparent)` : undefined,
                  outlineOffset: showAsPrediction && !isOvu ? "-3px" : undefined,
                  fontWeight: isToday || isOvu || inPeriod ? 600 : 400,
                  opacity: inMonth ? 1 : 0.55,
                }}
              >
                {format(day, "d")}
                {inPeriod && (
                  <span
                    className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                    style={{
                      background: PHASE_TOKENS.menstrual,
                      boxShadow: `0 0 0 1.5px var(--color-background)`,
                    }}
                    aria-hidden
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {(Object.keys(PHASE_TOKENS) as Phase[]).map((p) => (
          <div key={p} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: `color-mix(in oklch, ${PHASE_TOKENS[p]} 25%, transparent)` }}
              aria-hidden
            />
            <span className="text-muted-foreground">{t(PHASE_KEYS[p])}</span>
          </div>
        ))}
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              background: `color-mix(in oklch, ${PHASE_TOKENS.ovulatory} 40%, transparent)`,
              boxShadow: `inset 0 0 0 1.5px ${PHASE_TOKENS.ovulatory}`,
            }}
            aria-hidden
          />
          <span className="text-muted-foreground">{t("calendar.ovulation")}</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full bg-transparent"
            style={{ outline: `1px dashed color-mix(in oklch, ${PHASE_TOKENS.menstrual} 70%, transparent)`, outlineOffset: "-1px" }}
            aria-hidden
          />
          <span className="text-muted-foreground">{t("calendar.prediction")}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{t("disclaimer")}</p>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("calendar.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("calendar.edit.desc", { date: selected ? format(selected, "PP", { locale: dfLocale }) : "" })}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="rounded-full gradient-primary"
              disabled={saving}
              onClick={handleSetStart}
            >
              {t("calendar.set.start")}
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={saving || !canEndForSelected}
              onClick={handleSetEnd}
            >
              {t("calendar.set.end")}
            </Button>
            {selectedIsLoggedStart && (
              <Button
                variant="ghost"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={saving}
                onClick={handleRemove}
              >
                {t("calendar.remove")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
