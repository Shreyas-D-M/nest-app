import type { Metadata, Viewport } from 'next';
import type { ReactElement, ReactNode } from 'react';
import { createTranslator } from '@nest/i18n';
import { lightColors, radius, spacing } from '@nest/tokens';
import { QueryProvider } from '@/components/query-provider';
import { AdminHeader, Sidebar } from '@/components';
import './globals.css';

const t = createTranslator('en');

export const metadata: Metadata = {
  title: `${t('app.name')} Admin & Operations Console`,
  description: 'Hyperlocal service marketplace operations management console.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

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
        <QueryProvider>
          <div className="admin-layout">
            {/* Fixed Sidebar with clean vector icons */}
            <Sidebar />

            {/* Main Application Area */}
            <div className="admin-main-wrapper">
              <AdminHeader />
              <main className="admin-content">{children}</main>
            </div>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
