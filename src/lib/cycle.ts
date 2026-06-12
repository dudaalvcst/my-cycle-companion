import { addDays, differenceInCalendarDays, format } from "date-fns";

export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface CycleSettings {
  last_period_start: string; // ISO date
  cycle_length: number;
  period_length: number;
}

export interface CycleInfo {
  cycleDay: number;
  phase: Phase;
  nextPeriodDate: Date;
  daysUntilNextPeriod: number;
  ovulationDate: Date;
  fertileStart: Date;
  fertileEnd: Date;
  daysUntilFertile: number; // negative if inside or past
}

export function computeCycle(s: CycleSettings, today = new Date()): CycleInfo {
  const start = new Date(s.last_period_start + "T00:00:00");
  const t = new Date(today.toISOString().slice(0, 10) + "T00:00:00");
  const diff = differenceInCalendarDays(t, start);
  // current cycle start: most recent past period start based on cycle_length
  const cyclesPassed = Math.floor(diff / s.cycle_length);
  const currentStart = addDays(start, cyclesPassed * s.cycle_length);
  const cycleDay = differenceInCalendarDays(t, currentStart) + 1;
  const nextPeriodDate = addDays(currentStart, s.cycle_length);
  const daysUntilNextPeriod = differenceInCalendarDays(nextPeriodDate, t);
  const ovulationDate = addDays(nextPeriodDate, -14);
  const fertileStart = addDays(ovulationDate, -3);
  const fertileEnd = addDays(ovulationDate, 1);
  const daysUntilFertile = differenceInCalendarDays(fertileStart, t);

  let phase: Phase;
  if (cycleDay <= s.period_length) phase = "menstrual";
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
  };
}

export function fmtDate(d: Date, locale: "pt" | "en") {
  return format(d, locale === "pt" ? "dd 'de' MMMM" : "MMM dd");
}

export function phaseForDate(s: CycleSettings, date: Date): Phase {
  const start = new Date(s.last_period_start + "T00:00:00");
  const t = new Date(date.toISOString().slice(0, 10) + "T00:00:00");
  const diff = differenceInCalendarDays(t, start);
  // Support dates before DUM by walking back full cycles
  const cyclesPassed = Math.floor(diff / s.cycle_length);
  const currentStart = addDays(start, cyclesPassed * s.cycle_length);
  const cycleDay = differenceInCalendarDays(t, currentStart) + 1;
  const nextPeriodDate = addDays(currentStart, s.cycle_length);
  const ovulationDate = addDays(nextPeriodDate, -14);
  const fertileStart = addDays(ovulationDate, -3);
  const fertileEnd = addDays(ovulationDate, 1);
  if (cycleDay <= s.period_length) return "menstrual";
  if (t >= fertileStart && t <= fertileEnd) return "ovulatory";
  if (t < fertileStart) return "follicular";
  return "luteal";
}


export const FLOWS = ["none", "spotting", "light", "moderate", "heavy"] as const;
export const SYMPTOMS = ["cramps", "headache", "breast", "acne", "bloating", "fatigue"] as const;
export const MOODS = ["calm", "happy", "sensitive", "irritated", "anxious", "down"] as const;
