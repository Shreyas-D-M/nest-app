import { Logger } from '@nestjs/common';

/**
 * Silences Nest's logger during tests.
 *
 * Several suites deliberately exercise failure paths that log warnings and errors
 * — refresh-token replay, a missing Redis, a rate-limiter outage. Those lines are
 * expected, and printing them buries the actual test results.
 *
 * Logging behaviour itself is asserted where it matters (redaction is configured
 * in logger.options.ts), so suppressing output here loses no coverage.
 */
Logger.overrideLogger(false);
