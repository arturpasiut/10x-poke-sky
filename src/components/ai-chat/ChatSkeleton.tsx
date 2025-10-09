import type { FC } from "react";

interface ChatSkeletonProps {
  variant: "initial" | "response";
}

const shimmerBase = "animate-pulse rounded-xl bg-[color:color-mix(in_srgb,var(--color-surface)_70%,transparent)]";

const ChatSkeleton: FC<ChatSkeletonProps> = ({ variant }) => {
  if (variant === "response") {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className={`${shimmerBase} h-4 w-32`} />
        <div className={`${shimmerBase} h-20 w-full`} />
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-hidden="true">
      <div className={`${shimmerBase} h-6 w-40`} />
      <div className={`${shimmerBase} h-28 w-full`} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${shimmerBase} h-32`} />
        <div className={`${shimmerBase} h-32 hidden sm:block`} />
      </div>
    </div>
  );
};

export default ChatSkeleton;
