process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long';
process.env.COOKIE_SECRET = 'test_cookie_secret_at_least_32_characters_long';
process.env.CLERK_SECRET_KEY = 'sk_test_placeholder_for_tests';
process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_placeholder_for_tests';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
// REDIS_DB 1 keeps test data isolated from a developer's local dev Redis (db 0)
process.env.REDIS_DB = process.env.REDIS_DB || '1';
