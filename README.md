# 10x Astro Starter

A modern, opinionated starter template for building fast, accessible, and AI-friendly web applications.

## Tech Stack

- [Astro](https://astro.build/) v5.5.5 - Modern web framework for building fast, content-focused websites
- [React](https://react.dev/) v19.0.0 - UI library for building interactive components
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4.0.17 - Utility-first CSS framework

### Testing

- **Unit & Integration Tests**: [Vitest](https://vitest.dev/) v3.2.4 with [React Testing Library](https://testing-library.com/react) v16.3.0
  - @testing-library/dom - Testing static Astro components
  - @testing-library/jest-dom v6.9.1 - Additional matchers
  - @testing-library/user-event v14.6.1 - User interaction simulation
  - jsdom v22.1.0 - DOM environment for tests
  - MSW (Mock Service Worker) - API mocking

- **End-to-End Tests**: [Playwright](https://playwright.dev/) v1.56.0
  - Multi-browser testing (Chromium, Firefox, WebKit)
  - Accessibility testing (axe-core integration)

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm (comes with Node.js)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/przeprogramowani/10x-astro-starter.git
cd 10x-astro-starter
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and adjust values if needed:

```bash
cp .env.sample .env
```

- `SUPABASE_URL` / `SUPABASE_KEY` – keep fake credentials locally until Supabase is provisioned.
- `POKEAPI_BASE_URL` – defaults to the public PokeAPI (`https://pokeapi.co/api/v2`).
- `USE_POKEAPI_MOCK` – `false` by default; set to `true` only when you want to exercise the edge functions against local fixtures.
- `OPENROUTER_API_KEY` / `GEMINI_API_KEY` – optional for now; AI features remain mocked without real keys.

4. Run the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run test` - Uruchom testy jednostkowe (Vitest + RTL)
- `npm run test:coverage` - Raport pokrycia kodu
- `npm run test:e2e` - Testy Playwright (wymaga działającego `npm run dev` oraz `npx playwright install`)

## Project Structure

```md
.
├── src/
│ ├── layouts/ # Astro layouts
│ ├── pages/ # Astro pages
│ │ └── api/ # API endpoints
│ ├── components/ # UI components (Astro & React)
│ ├── styles/ # Tailwind entrypoint + design-token notes
│ └── assets/ # Static assets
├── public/ # Public assets
```

## Local Development

1. **Node version** – repo contains `.nvmrc` (`22.14.0`). Run `nvm use` (or switch manually) before installing dependencies.
2. **Install packages** – `npm install`.
3. **Configure environment** – `cp .env.sample .env` and tweak values as needed (see notes above). For live data keep `USE_POKEAPI_MOCK=false`.
4. **Start Supabase (optional for Phase 0)** – follow `supabase/README.md` if you want the local Postgres/auth stack running.
5. **Run the dev server** – `npm run dev`. You should see the placeholder homepage with the new design tokens applied.

Useful checks:

- `npm run lint` – verifies code style/ESLint.
- `npm run test` – runs component/hook tests (jsdom).
- `npm run test:e2e` – runs Playwright smoke test against `http://localhost:4321`.
- `supabase functions serve pokemon-list --env-file .env` – smoke test the edge function against either mock fixtures or the live PokeAPI (toggle via `USE_POKEAPI_MOCK`).

## Widok Pokédex

- `/pokemon` udostępnia interaktywną listę Pokémonów z wyszukiwarką, filtrami (typ, generacja, region) i sortowaniem.
- Stan widoku synchronizuje się z parametrami URL, co umożliwia udostępnianie linków z aktywnymi filtrami.
- Obsługiwane są skeletony, komunikaty błędów, puste stany oraz paginacja.
- Testy jednostkowe pokrywają krytyczne komponenty (`SearchHeader`, `FilterSidePanel`, `PokemonGrid`) i hook `usePokemonListQuery`; smoke test Playwright weryfikuje montaż widoku.

## AI Development Support

This project is configured with AI development tools to enhance the development experience, providing guidelines for:

- Project structure
- Coding practices
- Frontend development
- Styling with Tailwind
- Accessibility best practices
- Astro and React guidelines

### Cursor IDE

The project includes AI rules in `.cursor/rules/` directory that help Cursor IDE understand the project structure and provide better code suggestions.

### GitHub Copilot

AI instructions for GitHub Copilot are available in `.github/copilot-instructions.md`

### Windsurf

The `.windsurfrules` file contains AI configuration for Windsurf.

## Contributing

Please follow the AI guidelines and coding practices defined in the AI configuration files when contributing to this project.

## License

MIT
