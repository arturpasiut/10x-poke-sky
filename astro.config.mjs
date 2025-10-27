// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  env: {
    schema: {
      PUBLIC_ENV_NAME: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_ANON_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_SUPABASE_KEY: envField.string({ context: "client", access: "public", optional: true }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: "client", access: "public", optional: true }),
      POKEAPI_BASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      GEMINI_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
});
