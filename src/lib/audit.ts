import { supabase } from "@/integrations/supabase/client";

export type AuditEvent =
  | "AUTH_ATTEMPT"
  | "HEALTH_DATA_VIEWED"
  | "HEALTH_DATA_MODIFIED"
  | "HEALTH_DATA_DELETED";

async function ipHash(): Promise<string | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) return null;
  // Best-effort opaque value (no real IP available on client).
  const seed = (navigator.userAgent || "") + "|" + (typeof screen !== "undefined" ? screen.width : "");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AuditPayload {
  event: AuditEvent;
  status?: "SUCCESS" | "FAILED";
  scope?: string;
  fields_changed?: string[];
  user_id?: string | null;
}

export async function logAudit(p: AuditPayload) {
  try {
    const ip_hash = await ipHash();
    // Console-only structured log for debugging visibility (no health data).
    // eslint-disable-next-line no-console
    console.info(
      JSON.stringify({
        event: p.event,
        status: p.status,
        scope: p.scope,
        fields_changed: p.fields_changed,
        ip_hash,
        timestamp: new Date().toISOString(),
      }),
    );
    let userId = p.user_id ?? null;
    if (userId === null && p.event !== "AUTH_ATTEMPT") {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }
    if (!userId) return; // skip DB write when not authenticated
    await supabase.from("audit_logs").insert({
      event: p.event,
      status: p.status ?? null,
      scope: p.scope ?? null,
      fields_changed: p.fields_changed ?? null,
      ip_hash,
      user_id: userId,
    });
  } catch {
    // never throw from audit
  }
}
