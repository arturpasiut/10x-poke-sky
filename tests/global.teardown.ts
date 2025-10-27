import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

/**
 * Global Teardown
 * Cleans up Supabase favorites table after all E2E tests complete
 *
 * Based on Playwright docs: https://playwright.dev/docs/test-global-setup-teardown
 * Using Option 1: Project Dependencies (recommended approach)
 */

teardown("cleanup favorites table in Supabase", async () => {
  // eslint-disable-next-line no-console
  console.log("Starting global teardown: cleaning favorites table...");

  // Get credentials from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY ?? process.env.SUPABASE_KEY;
  const testUserId = process.env.E2E_USERNAME_ID;

  // Validate environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in environment variables");
    throw new Error("SUPABASE_URL and SUPABASE_PUBLIC_KEY (or SUPABASE_KEY) must be set");
  }

  if (!testUserId) {
    console.warn("E2E_USERNAME_ID not set - will skip user-specific cleanup");
  }

  // Create Supabase client
  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  try {
    // Delete all favorites for the test user
    if (testUserId) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", testUserId);

      if (error) {
        console.error("Error deleting favorites:", error);
        throw error;
      }

      // eslint-disable-next-line no-console
      console.log(`Successfully deleted favorites for user: ${testUserId}`);
    }

    // Optional: Delete all favorites if you want complete cleanup
    // Uncomment below if you want to clean ALL test data
    /*
    const { error: deleteAllError } = await supabase
      .from("favorites")
      .delete()
      .neq("user_id", "00000000-0000-0000-0000-000000000000"); // Delete all real records

    if (deleteAllError) {
      console.error("Error deleting all favorites:", deleteAllError);
      throw deleteAllError;
    }

    console.log("Successfully deleted all favorites");
    */

    // eslint-disable-next-line no-console
    console.log("Global teardown completed successfully");
  } catch (error) {
    console.error("Global teardown failed:", error);
    // Don't throw - we don't want teardown failures to fail the test run
    // Just log the error for debugging
  }
});
