import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Moon, ShieldCheck, BookHeart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lunaria — Your cycle, with clarity and privacy" },
      { name: "description", content: "Private menstrual cycle tracker with phases, predictions and a symptom diary." },
      { property: "og:title", content: "Lunaria — Your cycle, with clarity and privacy" },
      { property: "og:description", content: "Private menstrual cycle tracker with phases, predictions and a symptom diary." },
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
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full gradient-primary shadow-soft">
            <Moon className="h-4 w-4" />
          </span>
          <span className="font-display text-xl">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link to="/auth">
            <Button variant="ghost" size="sm">{t("landing.cta.signin")}</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-20 md:pb-28 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3" /> {t("app.tagline")}
        </span>
        <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[1.05] tracking-tight">
          {t("app.name")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-muted-foreground">
          {t("app.tagline")}.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" }}>
            <Button size="lg" className="rounded-full px-6 gradient-primary shadow-soft">{t("landing.cta.signup")}</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="rounded-full px-6">{t("landing.cta.signin")}</Button>
          </Link>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3 text-left">
          {[
            { I: ShieldCheck, t: t("landing.feature.privacy.t"), d: t("landing.feature.privacy.d") },
            { I: Moon, t: t("landing.feature.phase.t"), d: t("landing.feature.phase.d") },
            { I: BookHeart, t: t("landing.feature.diary.t"), d: t("landing.feature.diary.d") },
          ].map((f) => (
            <div key={f.t} className="surface-card p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <f.I className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-16 max-w-xl text-xs text-muted-foreground">
          {t("disclaimer")}
        </p>
      </section>
    </main>
  );
}
