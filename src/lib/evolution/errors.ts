export type EvolutionServiceErrorCode =
  | "INVALID_INPUT"
  | "POKEAPI_NOT_FOUND"
  | "POKEAPI_ERROR"
  | "POKEAPI_TIMEOUT"
  | "CACHE_WRITE_FAILED";

interface EvolutionServiceErrorOptions {
  code?: EvolutionServiceErrorCode;
  cause?: unknown;
}

export class EvolutionServiceError extends Error {
  readonly status: number;
  readonly code?: EvolutionServiceErrorCode;

  constructor(status: number, message: string, options: EvolutionServiceErrorOptions = {}) {
    super(message);
    this.name = "EvolutionServiceError";
    this.status = status;
    this.code = options.code;

    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}
