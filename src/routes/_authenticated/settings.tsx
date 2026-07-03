import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type Theme = "lilac" | "rose" | "ocean" | "forest" | "sunset";

const THEMES: { id: Theme; swatches: string[] }[] = [
  { id: "lilac", swatches: ["#c9b8e8", "#8b6fc9", "#5e3a9e", "#f0eaff"] },
  { id: "rose", swatches: ["#f5c9c0", "#e88a7c", "#c94a3a", "#fff0ec"] },
  { id: "ocean", swatches: ["#b8d4e8", "#6ba3c8", "#2e6b8a", "#e8f0f8"] },
  { id: "forest", swatches: ["#c0d8b0", "#7ba86a", "#3e6b34", "#eef5e8"] },
  { id: "sunset", swatches: ["#f5c99a", "#f0955a", "#c95a2e", "#fff2e5"] },
];

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  if (theme === "lilac") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", theme);
}

function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [theme, setTheme] = useState<Theme>("lilac");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "lilac";
    setTheme(stored);
  }, []);

  const pick = (id: Theme) => {
    setTheme(id);
    localStorage.setItem("theme", id);
    applyTheme(id);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-3xl">{t("settings.title")}</h1>

      <section className="surface-card p-6">
        <h2 className="font-display text-lg">{t("settings.language")}</h2>
        <div className="mt-3 inline-flex rounded-full border border-border bg-card p-0.5">
          {(["pt", "en"] as Locale[]).map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={`px-4 py-1.5 rounded-full text-sm transition ${locale === l ? "gradient-primary" : "text-muted-foreground"}`}>
              {l === "pt" ? "Português" : "English"}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <h2 className="font-display text-lg">{t("settings.theme")}</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((th) => (
            <button
              key={th.id}
              onClick={() => pick(th.id)}
              className={`rounded-2xl border p-3 text-left transition hover:scale-[1.02] ${theme === th.id ? "border-primary ring-2 ring-ring" : "border-border"}`}
            >
              <div className="flex gap-1">
                {th.swatches.map((c, i) => (
                  <span key={i} className="h-6 flex-1 rounded-md" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-2 text-sm">{t(`theme.${th.id}`)}</div>
            </button>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}
