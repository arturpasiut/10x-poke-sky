type ListSkeletonProps = {
  count?: number;
};

export function ListSkeleton({ count = 6 }: ListSkeletonProps) {
  const items = Array.from({ length: count });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-live="polite">
      {items.map((_, index) => (
        <div key={index} className="relative h-72 overflow-hidden rounded-3xl border border-white/5 bg-[#101722]">
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1f2a3b]/60 to-[#0a101b]/60" />
          <div className="absolute inset-x-0 top-10 mx-auto h-44 w-44 rounded-full bg-white/5" />
          <div className="absolute inset-x-6 bottom-16 h-5 rounded bg-white/5" />
          <div className="absolute inset-x-6 bottom-8 h-4 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
