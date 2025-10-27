import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { AstroCookies, CookieOptions } from "astro";

import type { Database } from "../db/database.types.ts";

const publicSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const publicSupabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_KEY;

const serverSupabaseUrl = import.meta.env.SUPABASE_URL;
const serverSupabaseKey = import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_KEY;

export const supabaseClient =
  typeof publicSupabaseUrl === "string" &&
  publicSupabaseUrl.length > 0 &&
  typeof publicSupabaseAnonKey === "string" &&
  publicSupabaseAnonKey.length > 0
    ? createClient<Database>(publicSupabaseUrl, publicSupabaseAnonKey)
    : null;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
};

const parseCookieHeader = (cookieHeader: string | null): { name: string; value: string }[] => {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader.split(";").flatMap((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (!name) {
      return [];
    }

    return {
      name,
      value: rest.join("="),
    };
  });
};

interface SupabaseServerContext {
  request: Request;
  cookies: AstroCookies;
  persistSession?: boolean;
}

export const createSupabaseServerClient = ({ request, cookies, persistSession = true }: SupabaseServerContext) => {
  if (!serverSupabaseUrl || !serverSupabaseKey) {
    throw new Error("Brak konfiguracji Supabase. Ustaw SUPABASE_URL oraz SUPABASE_ANON_KEY (lub SUPABASE_KEY).");
  }

  return createServerClient<Database>(serverSupabaseUrl, serverSupabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
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
