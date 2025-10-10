import { Check, Heart } from "lucide-react";
import type { FC } from "react";

import { Button } from "@/components/ui/button";

interface FavoritePromptCTAProps {
  isAuthenticated: boolean;
  status: "idle" | "saving" | "saved" | "error";
  onToggle?: () => void;
  onLoginRedirect?: () => void;
  disabled?: boolean;
}

const FavoritePromptCTA: FC<FavoritePromptCTAProps> = ({
  isAuthenticated,
  status,
  onToggle,
  onLoginRedirect,
  disabled,
}) => {
  if (!isAuthenticated) {
    return (
      <Button type="button" variant="ghost" size="sm" className="gap-2 text-primary" onClick={onLoginRedirect}>
        <Heart className="size-4" aria-hidden="true" />
        Zaloguj się, aby zapisać
      </Button>
    );
  }

  if (status === "saved") {
    return (
      <Button type="button" variant="secondary" size="sm" className="gap-2" disabled>
        <Check className="size-4" aria-hidden="true" />
        Zapisano w ulubionych
      </Button>
    );
  }

  const isSaving = status === "saving";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={onToggle}
      disabled={disabled || isSaving}
      aria-busy={isSaving}
    >
      <Heart className="size-4" aria-hidden="true" />
      {isSaving ? "Zapisywanie..." : "Dodaj do ulubionych"}
    </Button>
  );
};

export default FavoritePromptCTA;
