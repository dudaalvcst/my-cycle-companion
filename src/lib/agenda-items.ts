export type AgendaEvent = { id: string; title: string; description: string | null; start_at: string; end_at: string | null; location: string | null };
export type AgendaTask = { id: string; title: string; description: string | null; due_date: string | null; priority: string; completed: boolean };
export type AgendaItem = { kind: "event"; date: string; record: AgendaEvent } | { kind: "task"; date: string; record: AgendaTask };
export function agendaItems(events: AgendaEvent[], tasks: AgendaTask[]): AgendaItem[] {
  const items: AgendaItem[] = [
    ...events.map((record): AgendaItem => ({ kind: "event", date: record.start_at.slice(0, 10), record })),
    ...tasks.map((record): AgendaItem => ({ kind: "task", date: record.due_date ?? "", record })),
  ];
  return items.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
}