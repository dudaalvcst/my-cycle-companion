export const HAIR_PROCESSES = ["hydration", "nutrition", "reconstruction"] as const;
export type HairProcess = (typeof HAIR_PROCESSES)[number];

export function isStandardProcess(value: string): value is HairProcess {
  return HAIR_PROCESSES.some((process) => process === value);
}

export function nextHairProcess(logs: { treatment_type: string }[]): HairProcess {
  const last = logs.find((log) => isStandardProcess(log.treatment_type));
  const index = last ? HAIR_PROCESSES.findIndex((process) => process === last.treatment_type) : -1;
  return HAIR_PROCESSES[(index + 1) % HAIR_PROCESSES.length] ?? "hydration";
}

export function savedHairProcess(mode: "select" | "write", selected: HairProcess, written: string): string {
  return mode === "write" ? written.trim() : selected;
}