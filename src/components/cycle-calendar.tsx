import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { phaseForDate, isOvulationDay, type CycleSettings, type Phase } from "@/lib/cycle";
import { useI18n } from "@/lib/i18n";

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

export function CycleCalendar({ settings }: { settings: CycleSettings }) {
  const { t, locale } = useI18n();
  const dfLocale = locale === "pt" ? ptBR : enUS;
  const today = new Date();
  const [cursor, setCursor] = useState(() => startOfMonth(today));

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
          const phase = phaseForDate(settings, day);
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          const isOvu = isOvulationDay(settings, day);
          const color = PHASE_TOKENS[phase];
          const ovuColor = PHASE_TOKENS.ovulatory;
          const label = `${format(day, "PP", { locale: dfLocale })} — ${t(PHASE_KEYS[phase])}${isOvu ? ` · ${t("calendar.ovulation")}` : ""}`;
          return (
            <div
              key={day.toISOString()}
              className="aspect-square flex items-center justify-center"
              title={label}
            >
              <div
                className="relative flex h-full w-full items-center justify-center rounded-xl text-sm transition"
                style={{
                  background: isOvu
                    ? `radial-gradient(circle at center, ${ovuColor} 0%, ${ovuColor} 55%, color-mix(in oklch, ${color} 30%, transparent) 100%)`
                    : inMonth
                    ? `color-mix(in oklch, ${color} 22%, transparent)`
                    : `color-mix(in oklch, ${color} 8%, transparent)`,
                  color: isOvu
                    ? "var(--primary-foreground)"
                    : inMonth
                    ? undefined
                    : "var(--muted-foreground)",
                  boxShadow: isToday
                    ? `inset 0 0 0 2px var(--foreground)`
                    : isOvu
                    ? `0 4px 14px color-mix(in oklch, ${ovuColor} 45%, transparent)`
                    : undefined,
                  fontWeight: isToday || isOvu ? 600 : 400,
                  opacity: inMonth ? 1 : 0.55,
                }}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs">
        {(Object.keys(PHASE_TOKENS) as Phase[]).map((p) => (
          <div key={p} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: PHASE_TOKENS[p] }}
              aria-hidden
            />
            <span className="text-muted-foreground">{t(PHASE_KEYS[p])}</span>
          </div>
        ))}
        <div className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: PHASE_TOKENS.ovulatory, boxShadow: `inset 0 0 0 1.5px ${PHASE_TOKENS.ovulatory}` }}
            aria-hidden
          />
          <span className="text-muted-foreground">{t("calendar.ovulation")}</span>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{t("disclaimer")}</p>
    </section>
  );
}
