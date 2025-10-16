import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Login Page (/auth/login)
 */
export class LoginPage extends BasePage {
  // Form elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;

  // Links
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  // Messages
  readonly statusBanner: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);

    // Form elements
    this.emailInput = this.page.getByRole("textbox", { name: /adres e-mail/i });
    this.passwordInput = this.page.getByLabel(/hasło/i, { exact: true });
    this.rememberMeCheckbox = this.page.getByRole("checkbox", { name: /zapamiętaj mnie/i });
    this.submitButton = this.page.getByRole("button", { name: /zaloguj się/i });

    // Links
    this.forgotPasswordLink = this.page.getByRole("link", { name: /zapomniałem hasła/i });
    this.registerLink = this.page.getByRole("link", { name: /zarejestruj się/i });

    // Messages
    this.statusBanner = this.page.locator('[role="alert"]').first();
    this.heading = this.page.getByRole("heading", { name: /witaj ponownie/i });
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto("/auth/login");
    await this.waitForPageLoad();
  }

  /**
   * Fill in login form and submit
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }

    await this.submitButton.click();

    // Wait for navigation or error
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await expect(this.page).toHaveURL("/auth/forgot");
  }

  /**
   * Click register link
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
    await expect(this.page).toHaveURL("/auth/register");
  }

  // ===== ASSERTIONS =====

  /**
   * Assert login was successful (redirected to target page)
   */
  async expectLoginSuccess(expectedUrl = "/"): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl, { timeout: 10000 });
  }

  /**
   * Assert login error is displayed
   */
  async expectLoginError(message: string | RegExp): Promise<void> {
    await expect(this.statusBanner).toBeVisible();
    await expect(this.statusBanner).toContainText(message);
  }

  /**
   * Assert page is loaded
   */
  async expectPageLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
