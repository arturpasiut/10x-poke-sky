import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import LoginForm from "../LoginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // Rendering tests
  it("should render login form with all fields", () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { name: /Witaj ponownie!/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hasło$/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Zapamiętaj mnie/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Zaloguj się/i })).toBeInTheDocument();
  });

  it("should render forgot password link", () => {
    render(<LoginForm />);

    const forgotLink = screen.getByRole("link", { name: /Zapomniałem hasła/i });
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute("href", "/auth/forgot");
  });

  it("should render register link", () => {
    render(<LoginForm />);

    const registerLink = screen.getByRole("link", { name: /Zarejestruj się/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/auth/register");
  });

  it("should display redirect hint when redirectTo is provided", () => {
    render(<LoginForm redirectTo="/favorites" />);

    expect(screen.getByText(/Po zalogowaniu wrócisz do: \/favorites/i)).toBeInTheDocument();
  });

  it("should display info message when provided", () => {
    render(<LoginForm message="Please login to continue" />);

    expect(screen.getByText("Please login to continue")).toBeInTheDocument();
  });

  // Input handling tests
  it("should update email field on change", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    await user.type(emailInput, "test@example.com");

    expect(emailInput).toHaveValue("test@example.com");
  });

  it("should update password field on change", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    await user.type(passwordInput, "password123");

    expect(passwordInput).toHaveValue("password123");
  });

  it("should toggle rememberMe checkbox", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const checkbox = screen.getByRole("checkbox", { name: /Zapamiętaj mnie/i });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  // Validation tests
  it("should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Popraw zaznaczone pola i spróbuj ponownie/i)).toBeInTheDocument();
    });
  });

  it("should show validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Popraw zaznaczone pola i spróbuj ponownie/i)).toBeInTheDocument();
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

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "ValidPassword123!");
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Logowanie...");
  });

  it("should call API with correct credentials", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: "Success" }),
      } as Response)
    );
    global.fetch = mockFetch;

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "ValidPassword123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        })
      );
    });
  });

  it("should show error message on 401 unauthorized", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({ message: "Nieprawidłowy adres e-mail lub hasło." }),
      } as Response)
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "WrongPassword123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Nieprawidłowy adres e-mail lub hasło/i)).toBeInTheDocument();
    });
  });

  it("should show error banner on 422 validation error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Dane logowania są nieprawidłowe",
        }),
      } as Response)
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "ValidPass123!");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Dane logowania są nieprawidłowe")).toBeInTheDocument();
    });
  });

  // Accessibility tests
  it("should have proper aria-invalid on fields with errors", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("should link error messages with fields via aria-describedby", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({
          fieldErrors: {
            email: "Email jest wymagany",
          },
        }),
      } as Response)
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole("button", { name: /Zaloguj się/i });

    await user.type(emailInput, "invalid");
    await user.click(submitButton);

    await waitFor(() => {
      const emailId = emailInput.id;
      expect(emailInput).toHaveAttribute("aria-describedby", `${emailId}-error`);
    });
  });

  it("should have proper autocomplete attributes", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);

    expect(emailInput).toHaveAttribute("autocomplete", "email");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });
});
