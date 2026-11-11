// Runs before every test file. Provides the minimum env vars env.ts requires,
// so importing app code in tests doesn't call process.exit(1) on missing config.
// Individual test files (especially integration tests) should override
// DATABASE_URL via a real .env.test file rather than relying on this dummy value.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/ict_inventory_test';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_at_least_32_characters_long';
