import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies, CookieOptions } from "astro";
import { SUPABASE_ANON_KEY, SUPABASE_KEY, SUPABASE_URL } from "astro:env/server";

import type { Database } from "../db/database.types.ts";

const serverSupabaseKey = SUPABASE_ANON_KEY ?? SUPABASE_KEY;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

type SupabaseServerContext = {
  headers: Headers;
  cookies: AstroCookies;
  persistSession?: boolean;
};

export const createSupabaseServerClient = ({ headers, cookies, persistSession = true }: SupabaseServerContext) => {
  if (!SUPABASE_URL || !serverSupabaseKey) {
    throw new Error("Brak konfiguracji Supabase. Ustaw SUPABASE_URL oraz SUPABASE_ANON_KEY (lub SUPABASE_KEY).");
  }

  return createServerClient<Database>(SUPABASE_URL, serverSupabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(headers.get("cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const normalizedOptions: CookieOptions = {
            ...(options ?? {}),
            sameSite: options?.sameSite ?? "lax",
          };

          if (!persistSession) {
            normalizedOptions.maxAge = undefined;
            normalizedOptions.expires = undefined;
          }

          cookies.set(name, value, normalizedOptions);
        });
      },
    },
  });
};
