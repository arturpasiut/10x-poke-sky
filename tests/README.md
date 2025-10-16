# E2E Tests - Global Setup and Teardown

This directory contains E2E tests with global setup and teardown functionality.

## Overview

The test suite uses Playwright's Project Dependencies approach (recommended by Playwright docs) to implement global setup and teardown. This provides better integration with test reports, traces, and fixtures.

## Important: Sequential Execution

**Tests run SEQUENTIALLY (not in parallel)** to avoid race conditions. All tests share the same test user and Supabase database, so parallel execution causes conflicts when modifying the `favorites` table simultaneously.

Configuration:
- `fullyParallel: false`
- `workers: 1`

This ensures stable, predictable test execution.

## Architecture

```
┌─────────────────┐
│  global.setup   │  → Runs before all tests
└────────┬────────┘
         │ depends on
         ▼
┌─────────────────┐
│  chromium tests │  → Main test suite
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐
│ global.teardown │  → Runs after all tests
└─────────────────┘
```

## Files

- `global.setup.ts` - Global setup (currently a placeholder, can be extended)
- `global.teardown.ts` - Global teardown that cleans Supabase favorites table
- `playwright.config.ts` - Configuration with project dependencies

## Teardown Functionality

The global teardown (`global.teardown.ts`) performs the following cleanup:

1. Connects to Supabase using credentials from `.env.test`
2. Deletes all favorites for the test user (`E2E_USERNAME_ID`)
3. Logs the cleanup results

### Environment Variables Required

```env
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLIC_KEY=your_anon_key
E2E_USERNAME_ID=your_test_user_id
```

## Running Tests

```bash
# Run all tests (includes setup and teardown)
npm run test:e2e

# Run only favorites tests
npx playwright test tests/e2e/favorites/

# Run without dependencies (skip setup and teardown)
npx playwright test --no-deps

# List all tests including setup/teardown
npx playwright test --list
```

**Note:** Tests run sequentially (1 worker) to prevent database conflicts. Expect ~1 minute runtime for full suite.

## Test Execution Order

1. **Setup phase** (`global.setup.ts`)
   - Runs once before all tests
   - Shown as separate project in HTML report

2. **Test phase** (all chromium tests)
   - Runs in parallel (configured with `fullyParallel: true`)
   - Uses authenticated fixtures
   - Each test clears its own state before running

3. **Teardown phase** (`global.teardown.ts`)
   - Runs once after all tests complete
   - Cleans up Supabase favorites table
   - Ensures clean state for next test run

## Benefits of Project Dependencies Approach

✅ **HTML report visibility** - Setup/teardown shown as separate projects
✅ **Trace recording** - Full trace available for debugging
✅ **Playwright fixtures** - Can use all standard fixtures
✅ **Browser management** - Via standard `browser` fixture
✅ **Config inheritance** - All config options automatically applied

## Extending the Setup

To add global setup tasks, edit `tests/global.setup.ts`:

```typescript
setup("database seeding", async ({}) => {
  // Add your setup logic here
  // Example: seed database, prepare test data, etc.
});
```

## Troubleshooting

### Tests failing randomly / race conditions

**Solution:** Tests must run sequentially (already configured). Verify:
```bash
# Check config has workers: 1 and fullyParallel: false
grep -E "workers|fullyParallel" playwright.config.ts
```

### Teardown not running

- Ensure tests complete successfully
- Check that `.env.test` contains required variables
- Teardown runs even if tests fail (by design)

### Database not cleaned

- Verify `E2E_USERNAME_ID` matches the test user
- Check Supabase connection credentials
- Look at console output for error messages

### "Auth session missing" errors

- Ensure proper wait after login: `await page.waitForURL("/")`
- Add extra delay if needed: `await page.waitForTimeout(500)`

### Skip teardown during development

```bash
# Run tests without teardown
npx playwright test --no-deps
```

## References

- [Playwright Global Setup/Teardown Docs](https://playwright.dev/docs/test-global-setup-teardown)
- [Project Dependencies Guide](https://playwright.dev/docs/test-projects#dependencies)
