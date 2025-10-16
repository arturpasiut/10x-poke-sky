import { test as base, expect, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Test credentials - should match .env.test
 */
export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || "test-user@example.com",
  password: process.env.TEST_USER_PASSWORD || "TestUser123!",
};

export const TEST_EMPTY_FAVS_CREDENTIALS = {
  email: process.env.TEST_USER_EMPTY_FAVS_EMAIL || "empty-favs@example.com",
  password: process.env.TEST_USER_EMPTY_FAVS_PASSWORD || "EmptyFavs123!",
};

/**
 * Custom fixtures for authentication
 */
interface AuthFixtures {
  authenticatedPage: Page;
  emptyFavsAuthenticatedPage: Page;
  loginPage: LoginPage;
}

/**
 * Extend Playwright test with custom fixtures
 * Note: The "use" parameter in fixtures is not a React hook, it's a Playwright fixture function
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<AuthFixtures>({
  /**
   * Fixture: authenticated page with regular test user
   * Automatically logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    // Small delay to avoid race conditions between parallel tests
    await page.waitForTimeout(Math.random() * 100);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);

    // Wait for successful login (redirect to home page)
    await expect(page).toHaveURL("/", { timeout: 10000 });

    // Extra wait to ensure session is fully established
    await page.waitForTimeout(300);

    // Use the authenticated page
    await use(page);

    // Cleanup: logout after test (optional)
    // Note: We skip cleanup to allow faster test execution
  },

  /**
   * Fixture: authenticated page with empty favorites user
   * Useful for testing empty states
   */
  emptyFavsAuthenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_EMPTY_FAVS_CREDENTIALS.email, TEST_EMPTY_FAVS_CREDENTIALS.password);

    // Wait for successful login
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await use(page);
  },

  /**
   * Fixture: LoginPage instance
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

// Re-export expect
export { expect };
