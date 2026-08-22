import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { baseConfig } from './base.js';

/**
 * Configuration for React surfaces — React Native (Expo) and Next.js.
 *
 * Rules are declared explicitly rather than via the plugin's bundled preset so
 * that the config does not break when the plugin reshapes its exported presets.
 */
export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2023 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Design system rule: strings must stay externalisable for localisation
      // (04_DESIGN_SYSTEM.md). Enforced by review in Phase 0; a jsx-no-literals
      // style rule can be added once packages/i18n is wired into screens.
    },
  },
];
