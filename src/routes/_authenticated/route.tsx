import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Locale } from "@/lib/i18n";
import { Moon, BookHeart, Settings, LogOut, LayoutDashboard, CalendarClock, CheckSquare, Scissors, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-border bg-card/60 p-0.5 text-xs">
      {(["pt", "en"] as Locale[]).map((l) => (
        <button key={l} onClick={() => setLocale(l)} className={`px-2.5 py-0.5 rounded-full transition ${locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

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
          {!isOnboarding && (
            <nav className="hidden lg:flex items-center gap-1 text-sm">
              <NavItem to="/dashboard" icon={LayoutDashboard} label={t("nav.dashboard")} />
              <NavItem to="/agenda" icon={CalendarClock} label={t("nav.agenda")} />
              <NavItem to="/tasks" icon={CheckSquare} label={t("nav.tasks")} />
              <NavItem to="/hair" icon={Scissors} label={t("nav.hair")} />
              <NavItem to="/skincare" icon={Sparkles} label={t("nav.skincare")} />
              <NavItem to="/diary" icon={BookHeart} label={t("nav.diary")} />
              <NavItem to="/settings" icon={Settings} label={t("nav.settings")} />
            </nav>
          )}
          <div className="flex items-center gap-2">
            <LangSwitch />
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition">
              <LogOut className="h-3.5 w-3.5" /> {t("nav.signout")}
            </button>
          </div>
        </div>
        {!isOnboarding && (
          <nav className="lg:hidden flex items-center justify-around gap-1 border-t border-border bg-background/70 text-[10px] overflow-x-auto px-2 py-1">
            <NavItem to="/dashboard" icon={LayoutDashboard} label={t("nav.dashboard")} compact />
            <NavItem to="/agenda" icon={CalendarClock} label={t("nav.agenda")} compact />
            <NavItem to="/tasks" icon={CheckSquare} label={t("nav.tasks")} compact />
            <NavItem to="/hair" icon={Scissors} label={t("nav.hair")} compact />
            <NavItem to="/skincare" icon={Sparkles} label={t("nav.skincare")} compact />
            <NavItem to="/diary" icon={BookHeart} label={t("nav.diary")} compact />
            <NavItem to="/settings" icon={Settings} label={t("nav.settings")} compact />
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, compact }: { to: string; icon: any; label: string; compact?: boolean }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary [&.active]:text-primary-foreground"
      activeProps={{ className: "active" }}
    >
      <Icon className={compact ? "h-4 w-4" : "h-3.5 w-3.5"} />
      <span>{label}</span>
    </Link>
  );
}
