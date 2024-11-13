export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280
} as const;

export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile}px)`,
  tablet: `@media (min-width: ${breakpoints.mobile + 1}px) and (max-width: ${breakpoints.tablet}px)`,
  desktop: `@media (min-width: ${breakpoints.tablet + 1}px)`
} as const;

export const touchTargetSize = {
  min: 44, // Minimum size in pixels for touch targets (WCAG)
  spacing: 8 // Minimum spacing between touch targets
} as const; 