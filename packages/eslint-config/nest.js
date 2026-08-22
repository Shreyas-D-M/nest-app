import { baseConfig } from './base.js';

/**
 * Configuration for the NestJS API.
 *
 * NestJS relies on decorators and on classes that are intentionally empty
 * (`@Module()` classes), so the rules that penalise those patterns are relaxed
 * here rather than globally.
 */
export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      // Nest resolves providers by type metadata; empty interfaces are used as
      // injection tokens in some places.
      '@typescript-eslint/no-empty-object-type': 'off',

      // MUST stay off for NestJS.
      //
      // The rule sees a class imported solely for a constructor parameter type
      // and suggests `import type`. That erases the class from the emitted
      // JavaScript, so `emitDecoratorMetadata` writes `Object` into
      // `design:paramtypes` and Nest can no longer resolve the provider — the
      // app compiles cleanly and then fails at runtime with an unresolved
      // dependency. Autofixing this rule would silently break DI.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    // Test files may use non-null assertions freely for fixture setup.
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
