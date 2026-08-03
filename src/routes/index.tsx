import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Moon, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunaria — Sua rotina em harmonia" },
      {
        name: "description",
        content:
          "Ciclo menstrual, agenda, tarefas, cronograma capilar e skin care em um só app privado.",
      },
      { property: "og:title", content: "Lunaria — Sua rotina em harmonia" },
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* glow decorativo */}
      <div
        aria-hidden
        className="builder="pointer-events-none absolute inset-x-0 -top-40 h-[420px] opacity-70 blur-3xl"
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
        <LangSwitch />
      </header>

      <section className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pt-10 pb-16 text-center md:pt-20">
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

        <p className="mt-5 max-w-md text-sm sm:text-base text-muted-foreground">
          {t("landing.hero.sub")}
        </p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="w-full rounded-full px-7 gradient-primary shadow-soft">
              {t("landing.cta.signup")} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="w-full rounded-full px-7">
              {t("landing.cta.signin")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
