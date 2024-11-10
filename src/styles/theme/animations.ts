export const animations = {
  transition: {
    default: '200ms ease-in-out',
    fast: '150ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  scale: {
    hover: 1.02,
    active: 0.98,
  },
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideIn: {
      from: { transform: 'translateY(10px)', opacity: 0 },
      to: { transform: 'translateY(0)', opacity: 1 },
    },
  }
}; 