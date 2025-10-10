import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveEffectiveTheme, useUiStore } from "@/lib/stores";

const updateRootThemeClass = (theme: "light" | "dark") => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.setProperty("color-scheme", theme);
};

export const ThemeToggle: React.FC = () => {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [systemPrefersDark, setSystemPrefersDark] = React.useState<boolean>(() =>
    typeof window === "undefined" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);

    setSystemPrefersDark(query.matches);

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  React.useEffect(() => {
    updateRootThemeClass(resolveEffectiveTheme(theme, systemPrefersDark));
  }, [theme, systemPrefersDark]);

  const effectiveTheme = resolveEffectiveTheme(theme, systemPrefersDark);

  const handleToggle = () => {
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const Icon = effectiveTheme === "dark" ? Sun : Moon;
  const label = effectiveTheme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny";

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleToggle}
      aria-label={label}
      className="gap-2 rounded-full bg-background/80 backdrop-blur dark:bg-muted/20"
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline-flex">{effectiveTheme === "dark" ? "Light mode" : "Dark mode"}</span>
    </Button>
  );
};

export default ThemeToggle;
