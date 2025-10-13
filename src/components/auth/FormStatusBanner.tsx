import clsx from "clsx";

export type StatusVariant = "info" | "success" | "error";

export interface StatusMessage {
  variant: StatusVariant;
  content: string;
}

interface FormStatusBannerProps {
  status: StatusMessage;
}

export function FormStatusBanner({ status }: FormStatusBannerProps) {
  const tone =
    status.variant === "success"
      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
      : status.variant === "error"
        ? "bg-red-500/10 border-red-500/40 text-red-200"
        : "bg-blue-500/10 border-blue-500/40 text-blue-200";

  return (
    <div role="status" className={clsx("rounded-xl border px-3 py-2 text-sm transition-colors", tone)}>
      {status.content}
    </div>
  );
}
