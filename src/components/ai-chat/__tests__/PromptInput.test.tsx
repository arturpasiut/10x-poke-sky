import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PromptInput from "../PromptInput";

const setup = (overrideProps: Partial<React.ComponentProps<typeof PromptInput>> = {}) => {
  const onChange = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  const props: React.ComponentProps<typeof PromptInput> = {
    value: "",
    onChange,
    onSubmit,
    onCancel,
    isSubmitting: false,
    minLength: 10,
    maxLength: 50,
    isRateLimited: false,
    rateLimitSeconds: undefined,
    validationMessage: undefined,
    disabled: false,
  };

  render(<PromptInput {...props} {...overrideProps} />);

  const textarea = screen.getByLabelText(/Opisz Pokémona/i);
  const submitButton = screen.getByRole("button", { name: /Wyślij opis/i });

  return { textarea, submitButton, onChange, onSubmit, onCancel };
};

describe("PromptInput", () => {
  it("calls onSubmit when Enter is pressed without Shift", async () => {
    const user = userEvent.setup();
    const { textarea, onSubmit } = setup({ value: "Żółty Pokémon z błyskami i długim ogonem." });

    await user.type(textarea, "{Enter}");

    expect(onSubmit).toHaveBeenCalled();
  });

  it("shows validation message and disables submit button", () => {
    const { submitButton } = setup({
      value: "za krótko",
      validationMessage: "Opis musi mieć co najmniej 10 znaków.",
    });

    expect(screen.getByText(/co najmniej 10 znaków/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("renders rate limit helper message", () => {
    setup({
      value: "Czekam na reset limitu",
      isRateLimited: true,
      rateLimitSeconds: 8,
    });

    expect(screen.getByText(/Poczekaj 8s przed kolejnym opisem/i)).toBeInTheDocument();
  });
});
