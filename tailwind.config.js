const { 
  COLORS,
  TYPOGRAPHY,
  ANIMATIONS,
  BREAKPOINTS,
  SHADOWS,
  MOTION,
  LAYOUT
} = require('./src/design/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: LAYOUT.spacing.md,
      screens: LAYOUT.maxWidth,
    },
    extend: {
      colors: COLORS,
      typography: TYPOGRAPHY,
      animation: ANIMATIONS?.loading || {},
      transitionProperty: {
        ...MOTION.transition
      },
      transitionDuration: MOTION.duration,
      transitionTimingFunction: MOTION.easing,
      boxShadow: SHADOWS,
      spacing: LAYOUT.spacing,
      zIndex: LAYOUT.zIndex,
      maxWidth: LAYOUT.maxWidth,
      screens: BREAKPOINTS,
    },
  },
  plugins: [
    function({ addBase, addComponents, theme }) {
      addBase({
        'html': {
          '--primary': COLORS.brand.primary.base,
          '--primary-hover': COLORS.brand.primary.hover,
          '--primary-active': COLORS.brand.primary.active,
          '--background': COLORS.background.base,
          '--foreground': COLORS.text.primary,
          '--muted': COLORS.text.secondary,
          '--border': COLORS.border.default,
        }
      });

      addComponents({
        '.text-gradient-primary': {
          'background': `linear-gradient(to right, ${theme('colors.primary')}, ${theme('colors.primary-hover')})`,
          'background-clip': 'text',
          'color': 'transparent',
        },
      });
    },
  ],
} 