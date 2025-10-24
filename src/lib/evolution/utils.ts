import { formatPokemonDisplayName } from "@/lib/pokemon/transformers";

const DEFAULT_POKEAPI_BASE_URL = "https://pokeapi.co/api/v2/";

export const getPokeapiBaseUrl = (): string => {
  const value = import.meta.env.POKEAPI_BASE_URL;
  if (!value) {
    return DEFAULT_POKEAPI_BASE_URL;
  }

  return value.endsWith("/") ? value : `${value}/`;
};

export const buildPokeapiUrl = (path: string): string => {
  const base = getPokeapiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path.replace(/^\//, ""), base).toString();
};

export const extractIdFromResourceUrl = (url: string | null | undefined): number | null => {
  if (!url) {
    return null;
  }
  const segments = url.split("/").filter(Boolean);
  const last = segments.pop();
  if (!last) {
    return null;
  }
  const id = Number.parseInt(last, 10);
  return Number.isFinite(id) ? id : null;
};

export const formatLabel = (value: string | null | undefined): string => {
  if (!value) {
    return "";
  }
  return formatPokemonDisplayName(value);
};

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "branch";
