const shimmerClass = "animate-pulse bg-gradient-to-r from-white/10 via-white/5 to-white/10";

export function MoveListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <article
          key={index}
          className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0b1119]/80 p-6 shadow-[0_30px_80px_-50px_rgba(20,175,255,0.55)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
          <div className="relative z-10 flex flex-col gap-6">
            <header className="space-y-3">
              <div className={`h-3 w-16 rounded-full ${shimmerClass}`} />
              <div className={`h-7 w-40 rounded-full ${shimmerClass}`} />
            </header>

            <dl className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((__, statIndex) => (
                <div key={statIndex} className="space-y-2 rounded-2xl border border-white/5 bg-black/10 p-3">
                  <div className={`h-2 w-12 rounded-full ${shimmerClass}`} />
                  <div className={`h-4 w-16 rounded-full ${shimmerClass}`} />
                </div>
              ))}
            </dl>

            <div className={`h-2 w-32 rounded-full ${shimmerClass}`} />
          </div>
        </article>
      ))}
    </div>
  );
}
