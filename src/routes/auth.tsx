import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Moon } from "lucide-react";
import { logAudit } from "@/lib/audit";

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

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

  const signInWithGoogle = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      await logAudit({ event: "AUTH_ATTEMPT", status: "FAILED" });
      toast.error(error.message);
    }
    setSubmitting(false);
  };

  const toggleMode = () => {
    navigate({ to: "/auth", search: { mode: mode === "signin" ? "signup" : "signin" } });
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

          <div className="relative my-5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">{t("auth.or")}</span>
          </div>

          <Button variant="outline" disabled={submitting} onClick={signInWithGoogle} className="w-full rounded-full">
            <GoogleIcon /> <span className="ml-2">{t("auth.google")}</span>
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
            <button type="button" onClick={toggleMode} className="text-primary hover:underline">
              {mode === "signin" ? t("auth.signup") : t("auth.signin")}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </main>
  );
}
