import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import ForgotPasswordForm from "../ForgotPasswordForm";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // Rendering tests
  it("should render forgot password form with email field", () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByRole("heading", { name: /Resetuj hasło/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wyślij link resetujący/i })).toBeInTheDocument();
  });

  it("should render back to login link", () => {
    render(<ForgotPasswordForm />);

    const loginLink = screen.getByRole("link", { name: /Wróć do logowania/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  it("should display info message when provided", () => {
    render(<ForgotPasswordForm message="Enter your email" />);

    expect(screen.getByText("Enter your email")).toBeInTheDocument();
  });

  // Input handling tests
  it("should update email field on change", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    await user.type(emailInput, "test@example.com");

    expect(emailInput).toHaveValue("test@example.com");
  });

  // Validation tests
  it("should show validation error for empty email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Upewnij się, że adres e-mail jest poprawny/i)).toBeInTheDocument();
    });
  });

  it("should show validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Upewnij się, że adres e-mail jest poprawny/i)).toBeInTheDocument();
    });
  });

  // Submit tests
  it("should disable submit button during submission", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({ message: "Success" }),
              } as Response),
            100
          )
        )
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Wysyłanie...");
  });

  it("should call API with correct email", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: "Success" }),
      } as Response)
    );
    global.fetch = mockFetch;

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/reset-password",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        })
      );
    });
  });

  it("should show success message after successful submission", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: "Email wysłany" }),
      } as Response)
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email wysłany")).toBeInTheDocument();
    });
  });

  it("should clear email field after successful submission", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: "Success" }),
      } as Response)
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue("");
    });
  });

  it("should show error banner on 422 validation error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Email jest nieprawidłowy",
        }),
      } as Response)
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email jest nieprawidłowy")).toBeInTheDocument();
    });
  });

  it("should show error message on server error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ message: "Server error" }),
      } as Response)
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  // Accessibility tests
  it("should have proper aria-invalid on email field with error", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("should link error message with field via aria-describedby when validation fails", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Wyślij link resetujący/i });

    await user.type(emailInput, "invalid");
    await user.click(submitButton);

    await waitFor(() => {
      const emailId = emailInput.id;
      expect(emailInput).toHaveAttribute("aria-describedby", `${emailId}-error`);
    });
  });

  it("should have proper autocomplete attribute", () => {
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    expect(emailInput).toHaveAttribute("autocomplete", "email");
  });
});
