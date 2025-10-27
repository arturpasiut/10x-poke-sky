import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import type { AiChatMessage } from "@/features/ai-chat";
import { cn } from "@/lib/utils";

interface ChatTranscriptProps {
  messages: AiChatMessage[];
  isLoading: boolean;
  onRetry?: () => void;
}

const ChatTranscript = ({ messages, isLoading, onRetry }: ChatTranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hasContent = messages.length > 0;
  const lastUserMessageErrored = useMemo(() => {
    const reversed = [...messages].reverse();
    const lastUser = reversed.find((message) => message.role === "user");
    return lastUser?.status === "error";
  }, [messages]);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <section aria-live="polite" aria-busy={isLoading} className="space-y-3">
      <div
        ref={scrollRef}
        role="log"
        aria-atomic="false"
        aria-relevant="additions text"
        className={cn(
          "max-h-[480px] overflow-y-auto rounded-3xl border border-border/30 bg-[color:color-mix(in_srgb,var(--color-surface)_50%,transparent)] p-6 shadow-inner",
          !hasContent && "flex items-center justify-center text-center text-muted-foreground"
        )}
      >
        {hasContent ? (
          <ul className="flex flex-col gap-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <article
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-[color:color-mix(in_srgb,var(--color-surface)_80%,transparent)] text-foreground",
                    message.status === "error" && "border border-destructive text-destructive bg-destructive/10"
                  )}
                  aria-label={message.role === "user" ? "Wiadomość użytkownika" : "Wiadomość asystenta"}
                >
                  <p className="whitespace-pre-line">{message.content}</p>
                  {message.caution === "off-domain" ? (
                    <p className="mt-2 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
                      Odpowiedź może wychodzić poza świat Pokémon. Skupmy się na Pokédexie!
                    </p>
                  ) : null}
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Zadaj pytanie asystentowi AI</h2>
            <p className="text-sm text-muted-foreground">
              Opisz Pokémona, którego szukasz. Możesz wspomnieć o kolorze, typie, regionie lub unikalnych cechach.
            </p>
          </div>
        )}
      </div>

      {lastUserMessageErrored && onRetry ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RotateCcw className="size-4" aria-hidden="true" />
            Spróbuj ponownie
          </Button>
        </div>
      ) : null}
    </section>
  );
};

export default ChatTranscript;
