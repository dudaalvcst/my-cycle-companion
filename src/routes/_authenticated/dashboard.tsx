import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { CalendarHeart, CalendarClock, CheckSquare, Scissors, Sparkles, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Home,
});

type Tile = {
  to: string;
  icon: any;
  labelKey: string;
  descKey: string;
  token: string;
};

const TILES: Tile[] = [
  { to: "/cycle", icon: CalendarHeart, labelKey: "home.cycle", descKey: "home.cycle.desc", token: "phase-menstrual" },
  { to: "/agenda", icon: CalendarClock, labelKey: "nav.agenda", descKey: "agenda.subtitle", token: "phase-follicular" },
  { to: "/tasks", icon: CheckSquare, labelKey: "nav.tasks", descKey: "tasks.subtitle", token: "phase-ovulatory" },
  { to: "/hair", icon: Scissors, labelKey: "nav.hair", descKey: "hair.subtitle", token: "phase-luteal" },
  { to: "/skincare", icon: Sparkles, labelKey: "nav.skincare", descKey: "skincare.subtitle", token: "phase-ovulatory" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings", descKey: "home.settings.desc", token: "phase-follicular" },
];

function Home() {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-display text-3xl">{t("home.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("home.subtitle")}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className="surface-card group relative overflow-hidden p-6 text-left transition hover:shadow-soft hover:-translate-y-0.5"
              style={{ background: `linear-gradient(135deg, color-mix(in oklch, var(--color-${tile.token}) 22%, var(--card)) 0%, var(--card) 75%)` }}
            >
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                style={{ background: `color-mix(in oklch, var(--color-${tile.token}) 30%, var(--card))` }}
              >
                <Icon className="h-5 w-5" style={{ color: `var(--color-${tile.token})` }} />
              </div>
              <p className="mt-4 font-display text-lg">{t(tile.labelKey)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(tile.descKey)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
