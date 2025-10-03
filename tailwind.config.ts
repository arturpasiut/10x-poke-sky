import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}", "./public/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        surface: "var(--color-surface)",
        "surface-variant": "var(--color-surface-variant)",
        outline: "var(--color-outline)",
        border: "var(--color-border)",
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-on-primary)",
          300: "#F33736",
          400: "#CB290B",
          500: "#9C2221",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-on-secondary)",
          300: "#2EB688",
          400: "#145526",
          500: "#046D4A",
        },
        tertiary: {
          DEFAULT: "var(--color-tertiary)",
          foreground: "var(--color-on-tertiary)",
          300: "#54B1DF",
          400: "#4572E8",
          500: "#1E3DA8",
        },
        accent: {
          yellow: {
            300: "#F1A22C",
            400: "#FAAE41",
            500: "#CB5C0D",
          },
          gray: {
            400: "#595C61",
          },
        },
        neutral: {
          light: "#B8B6B3",
          DEFAULT: "#595C61",
          dark: "#3E4047",
        },
        pokemon: {
          bug: "#179A55",
          dark: "#040706",
          dragon: "#378A94",
          electric: "#E0E64B",
          fairy: "#9E1A44",
          fire: "#B22328",
          flying: "#90B1C5",
          ghost: "#363069",
          ice: "#7ECFF2",
          poison: "#642785",
          psychic: "#AC296B",
          rock: "#4B190E",
          steel: "#5C756D",
          water: "#2648DC",
          fighting: "#9F422A",
          grass: "#007C42",
          ground: "#AD7235",
        },
        region: {
          kanto: "#E74C3C",
          johto: "#9B59B6",
          hoenn: "#3498DB",
          sinnoh: "#E67E22",
          unova: "#2ECC71",
          kalos: "#F39C12",
          alola: "#1ABC9C",
          galar: "#34495E",
          paldea: "#E91E63",
        },
        activity: {
          walk: "#27AE60",
          surf: "#3498DB",
          fishing: "#8E44AD",
          rock: "#95A5A6",
          cave: "#34495E",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        floating: "0 20px 45px -25px rgba(4, 7, 6, 0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;
