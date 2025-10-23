import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "10x-theme";
type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isExplicitPreference, setIsExplicitPreference] = useState<boolean>(false);
  const [hasResolvedPreference, setHasResolvedPreference] = useState<boolean>(false);
  const explicitPreferenceRef = useRef(isExplicitPreference);

  useEffect(() => {
    explicitPreferenceRef.current = isExplicitPreference;
  }, [isExplicitPreference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage?.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      setIsExplicitPreference(true);
      setHasResolvedPreference(true);
      return;
    }

    if (!window.matchMedia) {
      setTheme("light");
      setHasResolvedPreference(true);
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyMediaPreference = (matches: boolean) => {
      if (explicitPreferenceRef.current) {
        return;
      }
      setTheme(matches ? "dark" : "light");
    };

    applyMediaPreference(mediaQuery.matches);
    setHasResolvedPreference(true);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMediaPreference(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!hasResolvedPreference || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;

    if (typeof window !== "undefined" && window.localStorage) {
      if (isExplicitPreference) {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [theme, isExplicitPreference, hasResolvedPreference]);

  const handleToggle = () => {
    setIsExplicitPreference(true);
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const label = theme === "dark" ? "Przełącz na jasny motyw" : "Przełącz na ciemny motyw";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={theme === "dark"}
      onClick={handleToggle}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-[color:color-mix(in_srgb,var(--color-muted)_60%,transparent)] text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:color-mix(in_srgb,var(--color-primary)_35%,transparent)] focus-visible:ring-offset-background hover:border-border/80 hover:bg-[color:color-mix(in_srgb,var(--color-muted)_75%,transparent)]"
    >
      <Sun
        aria-hidden="true"
        className={`h-4 w-4 transition-all duration-200 ease-out ${
          theme === "dark" ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
          theme === "dark" ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
