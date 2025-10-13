# Project Execution Plan: 10x-poke-sky

## Purpose
This roadmap explains how to implement the full 10x-poke-sky experience from the current Astro starter until all functional requirements in `project-prd-codex.md` are met. Each phase lists concrete ordered steps, expected outputs, and handoff criteria so that any engineer or AI agent can resume work midstream.

## Guiding Principles
1. Ship user-facing value iteratively while keeping the repo releasable.
2. Source of truth for product scope is the PRD; this plan decomposes it into actionable work.
3. Maintain parity between Supabase schema, TypeScript models, and UI contracts.
4. Guard performance, accessibility, and security requirements continuously instead of deferring.

## High-Level Milestones
| Phase | Focus | Complete When |
| --- | --- | --- |
| 0 | Environment and architecture scaffold | Supabase, env files, design system foundations ready |
| 1 | Layout, routing, shared UI | Astro routes, layouts, navigation, Zustand store in place |
| 2 | Data integration and cache | Supabase caches Pokemon data with refresh path validated |
| 3 | Pokemon discovery (US-001) | Search page with filters, tests, empty state |
| 4 | Pokemon details (US-002) | Detail view with stats, evolutions, moves, favorites CTA |
| 5 | Auth (US-005) | Login and register flows gated by Supabase policies |
| 6 | Favorites (US-003) | Add/remove favorites sync, gated routes, tests |
| 7 | Moves catalog (US-006) | Moves explorer with sorting, persisted filters |
| 8 | AI identification (US-004) | Gemini-backed chat suggesting Pokemon reliably |
| 9 | Quality and reliability | Performance, accessibility, security checks green |
| 10 | Release and handover | CI/CD, documentation, launch checklist signed |

## Phase 0 – Foundation Setup
1. [x] Audit existing repo (layouts, components, configs) and remove demo content while keeping useful utilities.
2. [x] Create `.env` and `.env.sample` with Supabase, PokeAPI, Gemini placeholders; implement runtime validation via `src/lib/env.ts`.
3. [x] Provision Supabase project, configure auth settings, and create tables `profiles`, `favorites`, `pokemon_cache`, `moves_cache`, `ai_queries` with RLS policies that restrict access to authenticated owners.
4. [x] Configure Supabase Edge Functions or REST endpoints for Pokemon data fetches and register them in `supabase/functions`.
5. [x] Install base tooling (Storybook optional) and align Tailwind config with design tokens delivered by the design team.
6. [x] Document local setup steps in README and verify `npm run dev` works with placeholder pages only.

## Phase 1 – Layout, Routing, Shared UI
1. [x] Define Astro layouts (`MainLayout`, `AuthLayout`) and wire them to routes `index`, `pokemon/[identifier]`, `moves`, `favorites`, `auth/login`, `auth/register`, `auth/forgot`.
2. [x] Implement global navigation bar, footer, and responsive grid primitives, using Tailwind classes aligned with design tokens.
3. [x] Introduce Zustand stores: `useSessionStore` for Supabase auth state and `useUiStore` for global UI flags.
4. [x] Create reusable UI components (buttons, cards, badges, tabs, modal shell) with stories or MDX docs if Storybook is available.
5. [x] Add automated lint and formatting scripts to Git hooks (Husky, lint-staged already present) and ensure `npm run lint` passes.
6. [-] Snapshot layout using Playwright visual regression or manual screenshots for design approval.

## Phase 2 – Data Integration and Cache Strategy
1. [x] Generate TypeScript types for PokeAPI responses using OpenAPI or manual typing stored in `src/lib/types/pokemon.ts`.
2. [x] Build HTTP client wrappers in `src/lib/api/pokeapi.ts` with retry logic, timeout, and error normalization.
3. [x] Implement Supabase edge function `fetch-pokemon-list` that checks `pokemon_cache`, refreshes entries older than 24h, and returns paginated results.
4. [x] Implement Supabase edge function `fetch-pokemon-details` pulling single Pokemon, moves, and evolution chain with identical caching.
5. [x] Create nightly Supabase cron job to refresh the most popular Pokemon IDs and moves (list maintained in a config table).
6. [x] Add local browser cache via IndexedDB or LocalStorage for the latest list response and wire hydration logic in a React hook.
7. [x] Write Vitest suites covering cache TTL logic and data transformers to guarantee schema parity.

## Phase 3 – Pokemon Discovery (US-001)
1. [x] Build the homepage list view consuming `fetch-pokemon-list`, showing pagination or infinite scroll according to design.
2. [x] Implement search input with debounce, hooking into query params for shareable URLs and reading filter data from Supabase meta tables.
3. [x] Render filter controls (type, generation, region) and ensure they update the list request payload.
4. [x] Handle empty and error states with messaging that suggests the AI chat when no match is found.
5. [x] Add Vitest + React Testing Library coverage for the search bar, filters reducer, and card rendering.
6. [x] Create Playwright scenario covering search, filter combination, and empty-state display.

## Phase 4 – Pokemon Details (US-002)
1. [x] Configure Astro dynamic route `pokemon/[identifier]` to fetch details server-side using the cache layer built in Phase 2.
2. [x] Build summary header (artwork, name, types) and include quick actions (favorite toggle CTA for logged users or login prompt).
3. [x] Implement stats section using either CSS bars or a React chart component; cross-verify values with PokeAPI schema.
4. [x] Render evolution chain timeline and moves list referencing cached move data for display efficiency.
5. [x] Provide navigation breadcrumbs or back button to return to the previous search context.
6. [x] Add unit tests for data transformation (stat normalization, evolution parsing) and Playwright coverage for hitting the detail page from search results.

## Phase 5 – Authentication (US-005)
1. Wire Supabase client in Astro server and React contexts, enabling SSR awareness of sessions.
2. Implement registration form using React Hook Form + Zod, with client-side and server-side validation.
3. Implement login form with remember-me option and secure redirect handling.
4. Provide sign-out flow accessible from the global nav with optimistic UI feedback.
5. Replace forgot-password flow with UX message explaining that the feature is unavailable yet and offer contact link if required by product.
6. Write Cypress or Playwright authentication scenario including register, login, logout, and guard checks for protected routes.

## Phase 6 – Favorites (US-003)
1. Ensure `favorites` table policies enforce user-level access; write SQL tests or manual verification in Supabase dashboard.
2. Build React hook `useFavorites` to list, add, and remove favorites with optimistic updates and fallback reconciliation from Supabase.
3. Attach favorite toggle button to Pokemon detail cards and list items; disable when unauthenticated and redirect to login on click.
4. Implement `/favorites` page showing saved Pokemon with sorting and filtering capabilities consistent with the search page.
5. Add server-side pagination for favorites and consider caching to reduce load for heavy users.
6. Cover the hook with Vitest (mock Supabase client) and add Playwright flow for adding and removing favorites.

## Phase 7 – Moves Catalog (US-006)
1. Extend Supabase cache to include move metadata, tying each move to type, region, and power metrics.
2. Create `/moves` page using a virtualized table or grid to handle large datasets efficiently.
3. Implement controls for sorting by type, region, power and persist selections in URL parameters and LocalStorage for returning users.
4. Provide quick link from each move to Pokemon detail pages that can learn it (MVP can show count and link to filtered search later).
5. Validate data accuracy against PokeAPI by sampling moves during QA.
6. Build unit tests for sorting logic and Playwright scenario for applying multiple filters.

## Phase 8 – AI Identification Chat (US-004)
1. Introduce AI client abstraction in `src/lib/ai/client.ts` with interface supporting Gemini now and OpenRouter later.
2. Implement Gemini API integration (API key in Supabase secrets, fetch wrapper with streaming support if available).
3. Design prompt template injecting user description plus structured Pokemon data context to improve match accuracy.
4. Build chat UI with history, loading indicators, retry button, and card-based suggestions linking to Pokemon details.
5. Add guardrails: deny prompts unrelated to Pokemon, enforce maximum tokens, and redact sensitive input if present.
6. Log each query in `ai_queries` with outcome, latency, and selected Pokemon; enforce per-user rate limits (for example 10 requests per minute) in the edge function.
7. Create Vitest tests for prompt builder and response parser and Playwright end-to-end test for a successful identification flow.

## Phase 9 – Quality, Performance, Accessibility, Security
1. Optimize asset delivery with Astro Image, Tailwind `@layer` pruning, and route-level code splitting where needed.
2. Run Lighthouse and WebPageTest, track metrics in the repo (JSON snapshots) and fix regressions to meet PRD SLAs.
3. Execute accessibility audits using axe DevTools and manual screen-reader checks; remediate focus traps and ARIA issues.
4. Implement security headers via Astro middleware, validate input sanitization, and review Supabase policies for leaks.
5. Establish monitoring and alerting: Supabase logs, Cloudflare Analytics, error tracking (Sentry if available), plus dashboard documenting key KPIs.
6. Update documentation with performance tuning notes and known limitations for future maintainers.

## Phase 10 – Release and Handover
1. Finalize GitHub Actions workflow running lint, unit tests, integration tests, and Playwright suites on PR and main branches.
2. Configure Cloudflare Pages deployment from the main branch with environment variables for production services.
3. Perform release candidate testing: smoke test critical flows, verify caching TTL jobs, and check AI quotas.
4. Draft release notes summarizing delivered features, limits, and next steps; obtain stakeholder sign-off.
5. Prepare operational runbook covering incident handling, Supabase backup strategy, and AI cost monitoring cadence.
6. Tag v1.0.0 release in git and transition to maintenance mode with backlog for post-launch improvements.

## Recommended Task Breakdown Workflow
1. Create GitHub issues for each numbered step; link to this document for context and assign owners.
2. Work phase-by-phase but keep at least one sprint buffer before AI features to stabilize core flows.
3. After each step, update a shared status board and ensure tests covering new functionality are merged before progressing.

## AI Handoff Notes
1. When starting a new session, identify the current phase and highest unfinished numbered step, then execute or assist with that item.
2. Always validate environment variables and Supabase connectivity before running scripts that depend on them.
3. For any uncertainty, consult `project-prd-codex.md` and this plan, then escalate clarifying questions to the product owner.
4. After completing a task, document outcomes in commit messages and update this plan if scope changes or new risks emerge.
