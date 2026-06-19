import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleSettings {
  last_period_start: string; // ISO date — fallback / seed only
  cycle_length: number;
  period_length: number;
}

export interface PeriodLog {
  start_date: string; // ISO date
  end_date: string | null;
}

export interface CycleInfo {
  cycleDay: number;
  phase: Phase;
  nextPeriodDate: Date;
  daysUntilNextPeriod: number;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  daysUntilFertile: number;
  effectiveCycleLength: number;
  effectivePeriodLength: number;
}

function isoToDate(s: string) {
  return startOfDay(new Date(s + "T00:00:00"));
}

function sortedStarts(logs: PeriodLog[]): PeriodLog[] {
  return [...logs].sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/**
 * Returns the effective cycle/period lengths learned from history.
 * - cycle_length = gap between two most recent logged starts (when available)
 * - period_length = length of the most recent logged period with end_date
 */
export function learnedLengths(
  logs: PeriodLog[],
  fallback: { cycle_length: number; period_length: number },
) {
  const sorted = sortedStarts(logs);
  let cycle_length = fallback.cycle_length;
  let period_length = fallback.period_length;
  if (sorted.length >= 2) {
    const a = isoToDate(sorted[sorted.length - 2].start_date);
    const b = isoToDate(sorted[sorted.length - 1].start_date);
    const gap = differenceInCalendarDays(b, a);
    if (gap >= 18 && gap <= 60) cycle_length = gap;
  }
  for (let i = sorted.length - 1; i >= 0; i--) {
    const l = sorted[i];
    if (l.end_date) {
      const len = differenceInCalendarDays(isoToDate(l.end_date), isoToDate(l.start_date)) + 1;
      if (len >= 1 && len <= 14) {
        period_length = len;
        break;
      }
    }
  }
  return { cycle_length, period_length };
}

/**
 * Resolves, for a given date, which cycle window it belongs to.
 * Past cycles use the actual gap between logged starts (immutable history).
 * The latest logged cycle and any future date use the learned length.
 * Dates before the earliest log are extrapolated backwards from it.
 */
export interface CycleWindow {
  start: Date;
  cycleLength: number;
  periodLength: number;
  isPrediction: boolean; // true when this window has no logged start
}

export function windowForDate(
  logs: PeriodLog[],
  settings: CycleSettings,
  date: Date,
): CycleWindow {
  const sorted = sortedStarts(logs);
  const learned = learnedLengths(logs, settings);
  const target = startOfDay(date);

  if (sorted.length === 0) {
    // Fully predicted — anchor on settings.last_period_start
    const anchor = isoToDate(settings.last_period_start);
    const diff = differenceInCalendarDays(target, anchor);
    const cycles = Math.floor(diff / learned.cycle_length);
    return {
      start: addDays(anchor, cycles * learned.cycle_length),
      cycleLength: learned.cycle_length,
      periodLength: learned.period_length,
      isPrediction: true,
    };
  }

  const firstStart = isoToDate(sorted[0].start_date);
  // Date before earliest log → extrapolate back
  if (target < firstStart) {
    const diff = differenceInCalendarDays(target, firstStart); // negative
    const cyclesBack = Math.ceil(-diff / learned.cycle_length);
    return {
      start: addDays(firstStart, -cyclesBack * learned.cycle_length),
      cycleLength: learned.cycle_length,
      periodLength: learned.period_length,
      isPrediction: true,
    };
  }

  // Find latest logged start <= target
  let idx = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (isoToDate(sorted[i].start_date) <= target) {
      idx = i;
      break;
    }
  }
  const currentLog = sorted[idx];
  const currentStart = isoToDate(currentLog.start_date);
  const nextLog = sorted[idx + 1];

  if (nextLog) {
    // Past cycle: bounded by actual next logged start (immutable)
    const nextStart = isoToDate(nextLog.start_date);
    const cycleLength = differenceInCalendarDays(nextStart, currentStart);
    let periodLength = settings.period_length;
    if (currentLog.end_date) {
      const len = differenceInCalendarDays(isoToDate(currentLog.end_date), currentStart) + 1;
      if (len >= 1 && len <= 14) periodLength = len;
    }
    return { start: currentStart, cycleLength, periodLength, isPrediction: false };
  }

  // Latest logged cycle → only the days up to today count as actual.
  // Anything beyond today (even inside the same cycle window) is a prediction.
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(target, currentStart);
  const cycles = Math.floor(diff / learned.cycle_length);
  const start = addDays(currentStart, cycles * learned.cycle_length);
  const isLatestActual = cycles === 0;
  let periodLength = learned.period_length;
  if (isLatestActual && currentLog.end_date) {
    const len = differenceInCalendarDays(isoToDate(currentLog.end_date), currentStart) + 1;
    if (len >= 1 && len <= 14) periodLength = len;
  }
  return {
    start,
    cycleLength: learned.cycle_length,
    periodLength,
    isPrediction: !isLatestActual || target > today,
  };
}


export function phaseForDate(logs: PeriodLog[], settings: CycleSettings, date: Date): Phase {
  const w = windowForDate(logs, settings, date);
  const target = startOfDay(date);
  const cycleDay = differenceInCalendarDays(target, w.start) + 1;
  const nextStart = addDays(w.start, w.cycleLength);
  const ovulation = addDays(nextStart, -14);
  const fertileStart = addDays(ovulation, -3);
  const fertileEnd = addDays(ovulation, 1);
  if (cycleDay <= w.periodLength) return "menstrual";
  if (target >= fertileStart && target <= fertileEnd) return "ovulatory";
  if (target < fertileStart) return "follicular";
  return "luteal";
}

export function isOvulationDay(logs: PeriodLog[], settings: CycleSettings, date: Date): boolean {
  const w = windowForDate(logs, settings, date);
  const nextStart = addDays(w.start, w.cycleLength);
  const ovulation = addDays(nextStart, -14);
  return differenceInCalendarDays(startOfDay(date), ovulation) === 0;
}

export function isPredictedDate(logs: PeriodLog[], settings: CycleSettings, date: Date): boolean {
  return windowForDate(logs, settings, date).isPrediction;
}

export function computeCycle(
  logs: PeriodLog[],
  settings: CycleSettings,
  today = new Date(),
): CycleInfo {
  const t = startOfDay(today);
  const w = windowForDate(logs, settings, t);
  const cycleDay = differenceInCalendarDays(t, w.start) + 1;
  const nextPeriodDate = addDays(w.start, w.cycleLength);
  const daysUntilNextPeriod = differenceInCalendarDays(nextPeriodDate, t);
  const ovulationDate = addDays(nextPeriodDate, -14);
  const fertileStart = addDays(ovulationDate, -3);
  const fertileEnd = addDays(ovulationDate, 1);
  const daysUntilFertile = differenceInCalendarDays(fertileStart, t);

  let phase: Phase;
  if (cycleDay <= w.periodLength) phase = "menstrual";
  else if (t >= fertileStart && t <= fertileEnd) phase = "ovulatory";
  else if (t < fertileStart) phase = "follicular";
  else phase = "luteal";

  return {
    cycleDay,
    phase,
    nextPeriodDate,
    daysUntilNextPeriod,
    ovulationDate,
    fertileStart,
    fertileEnd,
    daysUntilFertile,
    effectiveCycleLength: w.cycleLength,
    effectivePeriodLength: w.periodLength,
  };
}

export function fmtDate(d: Date, locale: "pt" | "en") {
  return format(d, locale === "pt" ? "dd 'de' MMMM" : "MMM dd", {
    locale: locale === "pt" ? ptBR : enUS,
  });
}

export const FLOWS = ["none", "spotting", "light", "moderate", "heavy"] as const;
export const SYMPTOMS = ["cramps", "headache", "breast", "acne", "bloating", "fatigue"] as const;
export const MOODS = ["calm", "happy", "sensitive", "irritated", "anxious", "down"] as const;
