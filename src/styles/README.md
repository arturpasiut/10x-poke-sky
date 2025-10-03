# Styling and Design Tokens

The Tailwind setup is driven by CSS custom properties defined in `global.css` so the web app stays in sync with the mobile palette provided by design.

## Color Tokens

| Token | Light | Dark | Notes |
| --- | --- | --- | --- |
| `background` | `#FFFFFF` | `#090F0B` | App shell background |
| `surface` | `#B8B6B3` | `#3E4047` | Cards, panels |
| `surface-variant` | `#595C61` | `#595C61` | Muted surfaces |
| `primary` | `#CB290B` | – | Brand red used in CTA states |
| `secondary` | `#145526` | – | Accent green |
| `tertiary` | `#4572E8` | – | Accent blue |
| `outline` | `#B8B6B3` | `#B8B6B3` | Strokes, separators |

Additional palette entries for Pokémon types, regions, and activities are exposed under `pokemon.*`, `region.*`, and `activity.*` in Tailwind.

## Usage

```tsx
<div className="bg-surface text-foreground rounded-xl shadow-floating">
  <h2 className="text-2xl font-semibold text-primary-foreground bg-primary px-4 py-2 rounded-lg">
    Jakiego Pokémona szukasz?
  </h2>
</div>
```

## Dark Mode

The app uses the `class` strategy. Wrap the document with `.dark` (Astro layout will do this once we wire the theme toggle). All color tokens automatically swap values.

---

Keep new components aligned by using the semantic colors (e.g. `bg-background`, `bg-surface`, `text-foreground`) and the extended palette for type/regional badges.
