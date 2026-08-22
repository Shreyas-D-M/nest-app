/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  roots: ['<rootDir>/test'],
  testRegex: '.*\\.integration-spec\\.ts$',
  globalSetup: '<rootDir>/test/integration/global-setup.ts',
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // Suites share one database, so they must not interleave.
  maxWorkers: 1,
  // A real database and HTTP stack are slower than mocked unit tests.
  testTimeout: 30_000,
  clearMocks: true,
  restoreMocks: true,
};
