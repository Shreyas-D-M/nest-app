import type { Metadata, Viewport } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { createTranslator } from '@nest/i18n';
import { lightColors, radius, spacing } from '@nest/tokens';
import './globals.css';

const t = createTranslator('en');

export const metadata: Metadata = {
  title: `${t('app.name')} Admin`,
  description: t('foundation.body'),
  // The admin console must never be indexed.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * Exposes the design tokens to CSS as custom properties.
 *
 * This is the bridge that lets the admin app share NEST's colour and spacing
 * decisions with the React Native apps without importing React Native
 * components — the reason `@nest/tokens` is a separate package from `@nest/ui`.
 */
const tokenCssVariables = [
  ...Object.entries(lightColors).map(([name, value]) => `--color-${toKebabCase(name)}: ${value};`),
  ...Object.entries(spacing).map(([name, value]) => `--space-${name}: ${value}px;`),
  ...Object.entries(radius).map(([name, value]) => `--radius-${name}: ${value}px;`),
].join('\n  ');

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en">
      <body>
        <style>{`:root {\n  ${tokenCssVariables}\n}`}</style>
        {children}
      </body>
    </html>
  );
}
