import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import RegisterForm from '../RegisterForm';

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  // Rendering tests
  it('should render register form with all fields', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('heading', { name: /Dołącz do drużyny!/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Adres e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Hasło$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Powtórz hasło/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Zarejestruj się/i })).toBeInTheDocument();
  });

  it('should display password guidelines', () => {
    render(<RegisterForm />);

    expect(screen.getByText(/Minimum 12 znaków/i)).toBeInTheDocument();
    expect(screen.getByText(/Przynajmniej jedna wielka i mała litera/i)).toBeInTheDocument();
    expect(screen.getByText(/Przynajmniej jedna cyfra oraz znak specjalny/i)).toBeInTheDocument();
  });

  it('should render login link', () => {
    render(<RegisterForm />);

    const loginLink = screen.getByRole('link', { name: /Zaloguj się/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/auth/login');
  });

  it('should display info message when provided', () => {
    render(<RegisterForm message="Welcome, please register" />);

    expect(screen.getByText('Welcome, please register')).toBeInTheDocument();
  });

  // Input handling tests
  it('should update email field on change', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should update password field on change', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    await user.type(passwordInput, 'SecurePass123!');

    expect(passwordInput).toHaveValue('SecurePass123!');
  });

  it('should update confirmPassword field on change', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    await user.type(confirmInput, 'SecurePass123!');

    expect(confirmInput).toHaveValue('SecurePass123!');
  });

  // Validation tests
  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sprawdź wymagania dotyczące hasła i popraw formularz/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sprawdź wymagania dotyczące hasła i popraw formularz/i)).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'DifferentPass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Sprawdź wymagania dotyczące hasła i popraw formularz/i)).toBeInTheDocument();
    });
  });

  // Submit tests
  it('should disable submit button during submission', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success' }),
      } as Response), 100))
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'SecurePass123!');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Rejestracja...');
  });

  it('should call API with correct data', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Success' }),
      } as Response)
    );
    global.fetch = mockFetch;

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'SecurePass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
        })
      );
    });
  });

  it('should show error message on 409 conflict (user exists)', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: async () => ({ message: 'Taki użytkownik już istnieje.' }),
      } as Response)
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'SecurePass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Taki użytkownik już istnieje/i)).toBeInTheDocument();
    });
  });

  it('should show error banner on 422 validation error', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Dane są nieprawidłowe',
        }),
      } as Response)
    );

    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'SecurePass123!');
    await user.type(confirmInput, 'SecurePass123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Dane są nieprawidłowe')).toBeInTheDocument();
    });
  });

  // Accessibility tests
  it('should have proper aria-invalid on fields with errors', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const submitButton = screen.getByRole('button', { name: /Zarejestruj się/i });

    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should link password field with guidelines via aria-describedby', () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const passwordId = passwordInput.id;

    expect(passwordInput).toHaveAttribute('aria-describedby', `${passwordId}-guidelines`);
  });

  it('should have proper autocomplete attributes', () => {
    render(<RegisterForm />);

    const emailInput = screen.getByLabelText(/Adres e-mail/i);
    const passwordInput = screen.getByLabelText(/^Hasło$/i);
    const confirmInput = screen.getByLabelText(/Powtórz hasło/i);

    expect(emailInput).toHaveAttribute('autocomplete', 'email');
    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmInput).toHaveAttribute('autocomplete', 'new-password');
  });
});
