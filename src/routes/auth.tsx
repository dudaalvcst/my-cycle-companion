import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
  const mode = search.mode ?? "signin";
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
          const msg = /weak|pwned|password/i.test(error.message)
            ? t("auth.error.weak.pwned")
            : /registered|exists/i.test(error.message)
            ? t("auth.error.exists")
            : error.message;
          toast.error(msg);
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
          <h1 className="font-display text-2xl">{mode === "signup" ? t("auth.signup") : t("auth.signin")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className="mt-1 rounded-xl" />
              {mode === "signup" && <p className="mt-1 text-xs text-muted-foreground">{t("auth.hint.password")}</p>}
            </div>
            <Button type="submit" disabled={submitting} className="w-full rounded-full gradient-primary">
              {mode === "signup" ? t("auth.signup") : t("auth.signin")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </main>
  );
}
