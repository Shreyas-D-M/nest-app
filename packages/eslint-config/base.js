import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Base ESLint configuration shared by every NEST workspace package.
 *
 * Phase 0 deliberately uses the non-type-checked `recommended` preset. Full
 * type-aware linting (`recommendedTypeChecked`) requires per-package project
 * service wiring and produces significant noise against the Nest/Next/Expo
 * dependency graph; it can be layered on once the surface stabilises.
 *
 * `no-explicit-any` is an error rather than a warning because CLAUDE.md forbids
 * `any` unless explicitly justified. A justified use must carry an inline
 * eslint-disable with a reason comment, which makes the exception reviewable.
 */
export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2023 },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Monetary values must never be floats — see CLAUDE.md and 05_DATABASE.md.
      // parseFloat/Number on money strings is a common source of rounding bugs.
      'no-restricted-globals': [
        'error',
        { name: 'parseFloat', message: 'Money must use integer minor units. Do not parse floats.' },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    // Tooling config files that must stay CommonJS because the tool loading them
    // requires it — Metro and Jest both read their config through `require`.
    // These are build-time files, not application code.
    files: ['**/*.config.js', '**/*.config.cjs', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettier,
);

export default baseConfig;
