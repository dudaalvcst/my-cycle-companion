import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Moon,
  ShieldCheck,
  Sparkles,
  CalendarClock,
  CheckSquare,
  Scissors,
  CalendarHeart,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunaria — Sua rotina feminina em harmonia" },
      {
        name: "description",
        content:
          "Ciclo menstrual, agenda, tarefas, cronograma capilar e skin care em um só app privado.",
      },
      { property: "og:title", content: "Lunaria — Sua rotina feminina em harmonia" },
      {
        property: "og:description",
        content:
          "Ciclo menstrual, agenda, tarefas, cronograma capilar e skin care em um só app privado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function LangSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="inline-flex rounded-full border border-border bg-card/60 backdrop-blur p-0.5 text-xs">
      {(["pt", "en"] as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`px-3 py-1 rounded-full transition ${locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Landing() {
  const { t } = useI18n();

  const modules = [
    { I: CalendarHeart, k: "cycle", token: "phase-menstrual" },
    { I: CalendarClock, k: "agenda", token: "phase-follicular" },
    { I: CheckSquare, k: "tasks", token: "phase-ovulatory" },
    { I: Scissors, k: "hair", token: "phase-luteal" },
    { I: Sparkles, k: "skincare", token: "phase-ovulatory" },
    { I: ShieldCheck, k: "privacy", token: "phase-follicular" },
  ];

  const steps = ["step1", "step2", "step3"];

  return (
    <main className="min-h-screen overflow-hidden">
      {/* glow decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(40% 60% at 30% 50%, color-mix(in oklch, var(--color-phase-ovulatory) 35%, transparent), transparent), radial-gradient(40% 60% at 70% 40%, color-mix(in oklch, var(--color-phase-luteal) 25%, transparent), transparent)",
        }}
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full gradient-primary shadow-soft">
            <Moon className="h-4 w-4" />
          </span>
          <span className="font-display text-xl">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LangSwitch />
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              {t("landing.cta.signin")}
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-5 pt-8 pb-16 md:pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3" /> {t("landing.hero.badge")}
        </span>
        <h1 className="mt-6 font-display text-4xl sm:text-6xl md:text-7xl leading-[1.03] tracking-tight">
          {t("landing.hero.title1")}
          <br />
          <span className="bg-gradient-to-r from-primary to-[var(--color-phase-ovulatory)] bg-clip-text text-transparent">
            {t("landing.hero.title2")}
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm sm:text-base text-muted-foreground">
          {t("landing.hero.sub")}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="w-full sm:w-auto rounded-full px-7 gradient-primary shadow-soft">
              {t("landing.cta.signup")} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-7">
              {t("landing.cta.signin")}
            </Button>
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
          {modules.map(({ I, k, token }) => (
            <div
              key={k}
              className="surface-card p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklch, var(--color-${token}) 18%, var(--card)) 0%, var(--card) 70%)`,
              }}
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: `color-mix(in oklch, var(--color-${token}) 30%, var(--card))` }}
              >
                <I className="h-5 w-5" style={{ color: `var(--color-${token})` }} />
              </span>
              <h3 className="mt-4 font-display text-lg">{t(`landing.mod.${k}.t`)}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t(`landing.mod.${k}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl px-5 pb-20">
        <h2 className="text-center font-display text-2xl sm:text-3xl">{t("landing.steps.title")}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s} className="surface-card p-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-display text-sm">
                {i + 1}
              </span>
              <p className="mt-3 font-display text-base">{t(`landing.${s}.t`)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(`landing.${s}.d`)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative mx-auto max-w-3xl px-5 pb-24 text-center">
        <div
          className="surface-card px-6 py-10"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklch, var(--primary) 14%, var(--card)) 0%, var(--card) 75%)",
          }}
        >
          <h2 className="font-display text-2xl sm:text-3xl">{t("landing.final.title")}</h2>
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="mt-6 rounded-full px-7 gradient-primary shadow-soft">
              {t("landing.cta.signup")}
            </Button>
          </Link>
          <p className="mx-auto mt-8 max-w-lg text-xs text-muted-foreground">{t("disclaimer")}</p>
        </div>
      </section>
    </main>
  );
}
