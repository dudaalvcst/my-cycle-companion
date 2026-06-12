import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon } from "lucide-react";
import { logAudit } from "@/lib/audit";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lunaria — Sign in" },
      { name: "description", content: "Sign in to your private cycle tracker." },
    ],
  }),
  component: AuthPage,
});

const PWD = /^.{6,}$/;

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!PWD.test(password)) {
          toast.error(t("auth.error.weak"));
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) {
          await logAudit({ event: "AUTH_ATTEMPT", status: "FAILED" });
          toast.error(t("auth.error.invalid"));
        } else {
          await logAudit({ event: "AUTH_ATTEMPT", status: "SUCCESS" });
          toast.success("✓");
          navigate({ to: "/dashboard" });
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await logAudit({ event: "AUTH_ATTEMPT", status: "FAILED" });
          toast.error(t("auth.error.invalid"));
        } else {
          await logAudit({ event: "AUTH_ATTEMPT", status: "SUCCESS", user_id: data.user?.id });
          navigate({ to: "/dashboard" });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) {
      await logAudit({ event: "AUTH_ATTEMPT", status: "FAILED" });
      toast.error(t("auth.error.invalid"));
      return;
    }
    if (res.redirected) return;
    await logAudit({ event: "AUTH_ATTEMPT", status: "SUCCESS" });
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full gradient-primary">
            <Moon className="h-4 w-4" />
          </span>
          <span className="font-display text-xl">{t("app.name")}</span>
        </Link>

        <div className="surface-card p-7">
          <h1 className="font-display text-2xl">{t("auth.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          <Button onClick={onGoogle} type="button" variant="outline" className="mt-6 w-full rounded-full">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.75 3.28-8.07z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#fbbc05" d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.96l3.66-2.84z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {t("auth.google")}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("auth.divider")} <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 rounded-xl" />
              {mode === "signup" && <p className="mt-1 text-xs text-muted-foreground">{t("auth.error.weak")}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full gradient-primary">
              {mode === "signup" ? t("auth.signup") : t("auth.signin")}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            className="mt-5 w-full text-center text-sm text-primary hover:underline"
          >
            {mode === "signin" ? t("auth.toggle.signup") : t("auth.toggle.signin")}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </main>
  );
}
