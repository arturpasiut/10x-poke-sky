import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PromptInputHandle {
  focus: () => void;
}

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  minLength: number;
  maxLength: number;
  isRateLimited?: boolean;
  rateLimitSeconds?: number;
  validationMessage?: string;
}

const PromptInput = forwardRef<PromptInputHandle, PromptInputProps>(
  (
    {
      value,
      onChange,
      onSubmit,
      onCancel,
      isSubmitting,
      disabled,
      minLength,
      maxLength,
      isRateLimited,
      rateLimitSeconds,
      validationMessage,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          textareaRef.current?.focus();
        },
      }),
      []
    );

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
      },
      [onChange]
    );

    const handleSubmit = useCallback(
      async (event?: FormEvent) => {
        event?.preventDefault();

        if (isSubmitting || disabled || isRateLimited) {
          return;
        }

        await onSubmit();
      },
      [disabled, isRateLimited, isSubmitting, onSubmit]
    );

    const handleKeyDown = useCallback(
      async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !isComposing) {
          event.preventDefault();
          await handleSubmit();
          return;
        }

        if (event.key === "Escape" && onCancel) {
          event.preventDefault();
          onCancel();
        }
      },
      [handleSubmit, isComposing, onCancel]
    );

    const characters = value.length;
    const remaining = maxLength - characters;

    const canSubmit = useMemo(() => {
      if (isSubmitting || disabled || isRateLimited) {
        return false;
      }

      const trimmedLength = value.trim().length;
      return trimmedLength >= minLength && trimmedLength <= maxLength;
    }, [disabled, isRateLimited, isSubmitting, maxLength, minLength, value]);

    const rateLimitMessage = isRateLimited
      ? `Osiągnięto limit zapytań. Poczekaj ${rateLimitSeconds ?? 0}s przed kolejnym opisem.`
      : undefined;

    useEffect(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.style.height = "auto";
      const nextHeight = Math.min(textarea.scrollHeight, 240);
      textarea.style.height = `${nextHeight}px`;
    }, [value]);

    return (
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-4 w-full rounded-3xl border border-border/40 bg-[color:color-mix(in_srgb,var(--color-surface)_80%,transparent)] p-4 shadow-lg backdrop-blur"
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="ai-chat-prompt" className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Opisz Pokémona
          </label>
          <textarea
            id="ai-chat-prompt"
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            rows={3}
            minLength={minLength}
            maxLength={maxLength}
            aria-invalid={Boolean(validationMessage)}
            aria-describedby="ai-chat-prompt-hint ai-chat-prompt-counter"
            placeholder="Np. Wodny Pokémon z płetwami, świecącym ogonem i dużymi oczami..."
            className={cn(
              "w-full resize-none rounded-2xl border border-border/40 bg-background/80 px-4 py-3 text-sm leading-relaxed text-foreground shadow-inner transition focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              validationMessage && "border-destructive",
              isFocused && "border-primary"
            )}
            disabled={disabled}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <div id="ai-chat-prompt-hint">
              {validationMessage ? (
                <p className="text-destructive">{validationMessage}</p>
              ) : rateLimitMessage ? (
                <p className="text-amber-600">{rateLimitMessage}</p>
              ) : (
                <p>Wciśnij Enter, aby wysłać. Shift + Enter tworzy nową linię.</p>
              )}
            </div>
            <p
              id="ai-chat-prompt-counter"
              className={cn("tabular-nums", remaining < 0 || remaining < 20 ? "text-destructive" : undefined)}
            >
              {characters} / {maxLength}
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} className="gap-2">
              {isSubmitting ? "Analizuję..." : "Wyślij opis"}
            </Button>
          </div>
        </div>
      </form>
    );
  }
);

PromptInput.displayName = "PromptInput";

export default PromptInput;
