import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Moon, Settings, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});


function AuthedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("cycle_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setNeedsOnboarding(!data);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || needsOnboarding === null) return;
    if (needsOnboarding && path !== "/onboarding") navigate({ to: "/onboarding" });
  }, [needsOnboarding, user, path, navigate]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("common.loading")}</div>;
  }

  const isOnboarding = path === "/onboarding";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur bg-background/70 border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full gradient-primary">
              <Moon className="h-3.5 w-3.5" />
            </span>
            <span className="font-display text-lg">{t("app.name")}</span>
          </Link>
          <div className="flex items-center gap-2">
            {!isOnboarding && (
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition [&.active]:bg-primary [&.active]:text-primary-foreground"
                activeProps={{ className: "active" }}
              >
                <Settings className="h-3.5 w-3.5" /> {t("nav.settings")}
              </Link>
            )}
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
              <LogOut className="h-3.5 w-3.5" /> {t("nav.signout")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
