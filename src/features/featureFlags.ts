type EnvName = 'local' | 'integration' | 'prod';
type FeatureFlag = 'auth' | 'collections';

type FeatureFlagConfiguration = Record<EnvName, Record<FeatureFlag, boolean>>;
type FeatureFlagMap = Record<FeatureFlag, boolean>;

const featureFlagConfiguration: FeatureFlagConfiguration = {
  local: {
    auth: true,
    collections: true
  },
  integration: {
    auth: true,
    collections: true
  },
  prod: {
    auth: true,
    collections: true
  }
};

const FALLBACK_ENV: EnvName = 'local';
const FEATURE_FLAG_ENV_PREFIX = 'FEATURE_FLAG_';

const isEnvName = (value: string): value is EnvName =>
  value === 'local' || value === 'integration' || value === 'prod';

const readImportMetaEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined') {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    const value = env?.[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

const readProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
};

const readBooleanEnv = (key: string): boolean | undefined => {
  const raw = readImportMetaEnv(key) ?? readProcessEnv(key);
  if (typeof raw !== 'string') {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }

  return undefined;
};

export const getEnvName = (explicit?: string | null | undefined): EnvName => {
  const candidate =
    explicit ??
    readImportMetaEnv('ENV_NAME') ??
    readProcessEnv('ENV_NAME');

  if (typeof candidate === 'string' && isEnvName(candidate)) {
    return candidate;
  }

  return FALLBACK_ENV;
};

export const getFeatureFlags = (envName?: string | null | undefined): FeatureFlagMap => {
  const resolvedEnv = getEnvName(envName ?? undefined);
  const defaults = featureFlagConfiguration[resolvedEnv] ?? featureFlagConfiguration[FALLBACK_ENV];

  const merged = { ...defaults };

  (Object.keys(defaults) as FeatureFlag[]).forEach((flag) => {
    const overrideKey = `${FEATURE_FLAG_ENV_PREFIX}${flag.toUpperCase()}`;
    const overrideValue = readBooleanEnv(overrideKey);
    if (typeof overrideValue === 'boolean') {
      merged[flag] = overrideValue;
    }
  });

  return merged;
};

export const isFeatureEnabled = (
  flag: FeatureFlag,
  envName?: string | null | undefined
): boolean => {
  const flags = getFeatureFlags(envName);
  return flags[flag];
};

export const assertFeatureEnabled = (
  flag: FeatureFlag,
  envName?: string | null | undefined
): void => {
  if (!isFeatureEnabled(flag, envName)) {
    throw new Error(
      `Feature flag "${flag}" is disabled for environment "${getEnvName(envName)}".`
    );
  }
};

export type { EnvName, FeatureFlag, FeatureFlagMap };
