import type { Page } from "@playwright/test";

/**
 * Base Page Object class
 * All page objects should extend this class
 */
export class BasePage {
  constructor(public page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for a specific API request to complete
   */
  async waitForAPIRequest(apiPath: string): Promise<void> {
    await this.page.waitForResponse((resp) => resp.url().includes(apiPath) && resp.status() === 200);
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }
}
