import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import ChatTranscript from "../ChatTranscript";
import type { AiChatMessage } from "@/features/ai-chat";

const baseMessages: AiChatMessage[] = [
  {
    id: "user-1",
    role: "user",
    content: "Opisz żółtego elektrycznego Pokémona.",
    createdAt: new Date().toISOString(),
    status: "delivered",
  },
  {
    id: "assistant-1",
    role: "assistant",
    content: "To prawdopodobnie Pikachu.",
    createdAt: new Date().toISOString(),
    status: "delivered",
  },
];

describe("ChatTranscript", () => {
  beforeAll(() => {
    if (!Element.prototype.scrollTo) {
      // @ts-expect-error jsdom missing scrollTo
      Element.prototype.scrollTo = vi.fn();
    }
  });

  it("renders empty state copy when no messages", () => {
    render(<ChatTranscript messages={[]} isLoading={false} />);
    expect(screen.getByText(/Zadaj pytanie asystentowi AI/i)).toBeInTheDocument();
  });

  it("shows caution banner for off-domain responses", () => {
    const messages: AiChatMessage[] = [
      baseMessages[0],
      {
        ...baseMessages[1],
        caution: "off-domain",
      },
    ];

    render(<ChatTranscript messages={messages} isLoading={false} />);

    expect(screen.getByText(/Odpowiedź może wychodzić poza świat Pokémon/i)).toBeInTheDocument();
  });

  it("exposes retry button when last user message failed", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    const messages: AiChatMessage[] = [
      {
        ...baseMessages[0],
        status: "error",
      },
    ];

    render(<ChatTranscript messages={messages} isLoading={false} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /Spróbuj ponownie/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });
});
