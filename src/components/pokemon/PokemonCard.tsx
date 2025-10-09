import { memo } from "react"

import clsx from "clsx"

import type { PokemonSummaryViewModel } from "@/lib/pokemon/types"

type PokemonCardProps = {
  pokemon: PokemonSummaryViewModel
}

const fallbackSprite =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-labelledby="title"><title>Brak obrazka Pokémona</title><rect width="160" height="160" rx="24" ry="24" fill="#0f172a"/><path d="M80 18a62 62 0 1062 62A62.07 62.07 0 0080 18zm0 12a50 50 0 0148.8 40H96a16 16 0 10-32 0H31.2A50 50 0 0180 30zm0 100a50 50 0 01-48.8-40H64a16 16 0 0032 0h32.8A50 50 0 0180 130z" fill="#1e293b"/></svg>`,
  )

function Component({ pokemon }: PokemonCardProps) {
  const { spriteUrl, spriteAlt, displayName, routeHref, dexNumber, typeBadges, cardGradientClass } = pokemon

  return (
    <a
      href={routeHref}
      className={clsx(
        "group relative flex h-72 overflow-hidden rounded-3xl border border-white/5 bg-[#0f151c] transition-transform",
        "shadow-card hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible-outline",
      )}
      aria-label={`${displayName} ${dexNumber}`}
    >
      <article
        className={clsx(
          "relative flex w-full flex-col justify-end overflow-hidden p-6 text-white",
          cardGradientClass,
        )}
      >
        <div className="absolute inset-x-6 top-6 flex items-center justify-between text-sm text-white/70">
          <span>{dexNumber}</span>
          <div className="flex gap-2">
            {typeBadges.map((type) => (
              <span
                key={type.value}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide shadow-sm",
                  type.className,
                )}
              >
                {type.label}
              </span>
            ))}
          </div>
        </div>

        <div className="absolute inset-x-0 top-10 flex justify-center">
          <div className="relative h-44 w-44 overflow-visible">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl transition duration-500 group-hover:scale-105" />
            <img
              src={spriteUrl ?? fallbackSprite}
              alt={spriteAlt}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_25px_30px_rgba(15,13,28,0.45)] transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>

        <div className="relative mt-auto space-y-2 pt-40">
          <h3 className="text-2xl font-semibold capitalize tracking-wide">{displayName}</h3>
          <p className="text-sm text-white/80">Zobacz szczegóły →</p>
        </div>
      </article>
    </a>
  )
}

export const PokemonCard = memo(Component)
