import { type PropsWithChildren, useCallback, useEffect, useRef } from "react";

import { createPortal } from "react-dom";

type MobileFilterDrawerProps = PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

export function MobileFilterDrawer({ open, onOpenChange, children }: MobileFilterDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const panel = panelRef.current;
    panel?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }

      if (event.key === "Tab" && panel) {
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const handleBodyScroll = () => {
      document.body.style.overflow = open ? "hidden" : "";
    };

    document.addEventListener("keydown", handleKeyDown);
    handleBodyScroll();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex h-full w-full origin-bottom bg-black/70 backdrop-blur-sm transition"
      role="dialog"
      aria-modal="true"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[#0d131c]"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
