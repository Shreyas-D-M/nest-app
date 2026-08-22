import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import {
  colorSchemes,
  duration,
  radius,
  spacing,
  typography,
  type ColorScheme,
  type ColorSchemeName,
} from '@nest/tokens';

/**
 * Theme plumbing.
 *
 * Components read tokens from here rather than importing the palette directly,
 * which is what lets the palette change without touching components.
 */

export interface Theme {
  scheme: ColorSchemeName;
  colors: ColorScheme;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  duration: typeof duration;
}

function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: colorSchemes[scheme],
    spacing,
    radius,
    typography,
    duration,
  };
}

const defaultTheme = buildTheme('light');

const ThemeContext = createContext<Theme>(defaultTheme);

export interface ThemeProviderProps {
  /** Only `light` exists today; a dark scheme is a pending design deliverable. */
  scheme?: ColorSchemeName;
}

export function ThemeProvider({
  scheme = 'light',
  children,
}: PropsWithChildren<ThemeProviderProps>): ReactElement {
  const value = useMemo(() => buildTheme(scheme), [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
