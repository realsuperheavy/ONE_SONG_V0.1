export const COLORS = {
  // Brand Colors
  brand: {
    primary: {
      base: "#F49620",
      hover: "#FF7200",
      active: "#E08010",
      disabled: "#3E2E1B",
    },
    accent: {
      base: "#FF7200",
      hover: "#FF8533",
      active: "#E65A00",
      disabled: "#3E2E1B",
    }
  },

  // Background System
  background: {
    base: "#1E1E1E",
    elevated: "#2E2F2E",
    gradient: {
      start: "#1E1E1E",
      end: "#2E2F2E",
    },
    overlay: "rgba(30, 30, 30, 0.8)",
  },

  // State Colors
  state: {
    success: {
      base: "#22C55E",
      hover: "#16A34A",
      background: "rgba(34, 197, 94, 0.1)",
    },
    error: {
      base: "#EF4444",
      hover: "#DC2626",
      background: "rgba(239, 68, 68, 0.1)",
    },
    warning: {
      base: "#F49620",
      hover: "#FF7200",
      background: "rgba(244, 150, 32, 0.1)",
    },
    info: {
      base: "#3B82F6",
      hover: "#2563EB",
      background: "rgba(59, 130, 246, 0.1)",
    },
  },

  // Text Colors
  text: {
    primary: "rgba(255, 255, 255, 0.9)",
    secondary: "rgba(255, 255, 255, 0.6)",
    disabled: "rgba(255, 255, 255, 0.38)",
    brand: "#F49620",
    inverse: "#1E1E1E",
  },

  // Border Colors
  border: {
    default: "rgba(255, 255, 255, 0.12)",
    hover: "rgba(255, 255, 255, 0.2)",
    active: "#F49620",
    focus: "#FF7200",
  },
};

export const COMPONENTS = {
  button: {
    base: "rounded-lg px-4 py-2 font-medium transition-all duration-200",
    primary: "bg-brand-primary-base hover:bg-brand-primary-hover active:bg-brand-primary-active disabled:bg-brand-primary-disabled text-white",
    secondary: "border-2 border-brand-primary-base text-brand-primary-base hover:bg-brand-primary-base/10 active:bg-brand-primary-base/20 disabled:border-brand-primary-disabled disabled:text-brand-primary-disabled",
    ghost: "text-brand-primary-base hover:bg-brand-primary-base/10 active:bg-brand-primary-base/20 disabled:text-brand-primary-disabled",
  },
  card: {
    base: "bg-gradient-to-b from-background-gradient-start to-background-gradient-end rounded-xl p-4 transition-all duration-200",
    interactive: "hover:scale-102 cursor-pointer",
    elevated: "shadow-lg hover:shadow-xl",
    border: "border border-border-default hover:border-border-hover focus:border-border-focus",
  },
  input: {
    base: "bg-background-base border border-border-default rounded-lg px-4 py-2 transition-all duration-200",
    focus: "focus:border-brand-primary-base focus:ring-2 focus:ring-brand-primary-base/20",
    error: "border-state-error-base focus:border-state-error-base focus:ring-2 focus:ring-state-error-base/20",
    disabled: "bg-background-base/50 border-border-default cursor-not-allowed",
  }
};

export const EFFECTS = {
  glass: "backdrop-blur-md bg-background-overlay",
  glow: {
    brand: "shadow-[0_0_15px_rgba(244,150,32,0.3)]",
    success: "shadow-[0_0_15px_rgba(34,197,94,0.3)]",
    error: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
  },
  hover: "transition-transform hover:scale-102",
};

export const INTERACTIONS = {
  hover: {
    scale: "hover:scale-102 active:scale-98 transition-transform duration-200"
  }
};

export const TYPOGRAPHY = {
  headings: {
    h1: "font-inter font-bold text-[48px] leading-[1.2] tracking-[-0.02em] text-white",
    h2: "font-inter font-bold text-[32px] leading-[1.2] tracking-[-0.02em] text-white",
    h3: "font-inter font-bold text-[24px] leading-[1.2] tracking-[-0.02em] text-white",
    h4: "font-inter font-bold text-[20px] leading-[1.2] tracking-[-0.02em] text-white",
  },
  body: {
    base: "font-inter text-[16px] leading-[1.5] text-white/90",
    large: "font-inter text-[18px] leading-[1.5] text-white/90",
    small: "font-inter text-[14px] leading-[1.5] text-white/90",
  },
  spacing: {
    paragraph: "space-y-[1.5em]",
  }
};

export const ANIMATIONS = {
  transitions: {
    base: "transition-all duration-200 ease-in-out",
    page: "transition-all duration-300 ease-in-out",
    color: "transition-colors duration-300",
    transform: "transition-transform duration-400",
  },
  hover: {
    scale: "hover:scale-102 active:scale-98",
    lift: "hover:-translate-y-1",
    glow: "hover:shadow-glow",
  },
  loading: {
    spin: "animate-spin text-actionOrange",
    pulse: "animate-pulse",
    shimmer: "animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent",
  },
  keyframes: {
    fadeIn: "fade-in 200ms ease-out",
    fadeOut: "fade-out 150ms ease-in",
    slideIn: "slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slideOut: "slide-out 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    scaleIn: "scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)",
    scaleOut: "scale-out 150ms cubic-bezier(0.4, 0, 0.2, 1)",
  },
  skeleton: {
    base: "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
    text: "h-4 w-3/4 mb-2",
    circle: "h-12 w-12 rounded-full",
    rectangle: "h-24 w-full",
  }
};

export const RESPONSIVE = {
  container: {
    mobile: "w-full px-4",
    tablet: "max-w-[768px] mx-auto px-6",
    desktop: "max-w-[1280px] mx-auto px-8",
  },
  grid: {
    mobile: "grid grid-cols-1 gap-4",
    tablet: "grid grid-cols-2 gap-6",
    desktop: "grid grid-cols-3 gap-8",
  },
  navigation: {
    mobile: "fixed bottom-0 w-full bg-baseDark border-t border-white/10",
    tablet: "sticky top-0 w-full bg-baseDark/80 backdrop-blur-md",
    desktop: "sticky top-0 w-full bg-baseDark/80 backdrop-blur-md",
  }
};

export const LAYOUT = {
  spacing: {
    xs: "0.25rem",    // 4px
    sm: "0.5rem",     // 8px
    md: "1rem",       // 16px
    lg: "1.5rem",     // 24px
    xl: "2rem",       // 32px
    xxl: "3rem",      // 48px
  },
  sidebar: {
    width: "280px",
    collapsed: "60px",
  },
  header: {
    height: "60px",
  },
  zIndex: {
    modal: "50",
    overlay: "40",
    dropdown: "30",
    sticky: "20",
    base: "1",
  },
  maxWidth: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    xxl: "1536px",
  }
};

export const SHADOWS = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  brand: "0 0 15px rgba(244, 150, 32, 0.3)",
  none: "none"
};

export const MOTION = {
  duration: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "400ms",
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  },
  transition: {
    base: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
    smooth: "all 300ms cubic-bezier(0, 0, 0.2, 1)",
    bounce: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  }
};

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  xxl: "1536px"
};

export const ACCESSIBILITY = {
  focus: {
    outline: "2px solid #F49620",
    outlineOffset: "2px",
    ring: "0 0 0 2px rgba(244, 150, 32, 0.3)",
  },
  srOnly: "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
  clickable: "cursor-pointer select-none",
  interactive: {
    base: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-base",
    negative: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-error-base",
  }
};

export const UI_PATTERNS = {
  navigation: {
    top: {
      base: "fixed top-0 w-full z-sticky backdrop-blur-md",
      active: "border-b-2 border-brand-primary-base",
      glass: "bg-background-base/80",
    },
    tabs: {
      list: "flex space-x-2 p-1 bg-background-elevated rounded-lg",
      tab: "px-4 py-2 rounded-md transition-all duration-200",
      active: "bg-brand-primary-base text-white",
      inactive: "text-text-secondary hover:text-text-primary hover:bg-background-base/50",
    }
  },
  modal: {
    overlay: "fixed inset-0 bg-background-overlay backdrop-blur-md z-modal",
    content: {
      base: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-modal",
      mobile: "bottom-0 left-0 right-0 translate-y-0 rounded-t-xl",
      animation: "animate-modal-enter",
    },
    payment: {
      badge: "flex items-center space-x-2 text-state-success-base bg-state-success-background px-3 py-1 rounded-full",
    }
  }
};

export const FORM_PATTERNS = {
  input: {
    wrapper: "relative",
    field: "w-full bg-background-base border border-border-default rounded-lg px-4 py-2 transition-all duration-200",
    label: "absolute -top-2 left-2 px-1 text-sm bg-background-base text-text-secondary",
    focus: "focus:border-brand-primary-base focus:ring-2 focus:ring-brand-primary-base/20",
    error: "border-state-error-base focus:border-state-error-base focus:ring-state-error-base/20",
    disabled: "opacity-50 cursor-not-allowed",
  },
  validation: {
    error: "text-sm text-state-error-base mt-1",
    success: "text-sm text-state-success-base mt-1",
    helper: "text-sm text-text-secondary mt-1",
  }
};

export const LOADING_PATTERNS = {
  skeleton: {
    base: "animate-pulse bg-background-elevated rounded",
    text: "h-4 w-3/4",
    circle: "rounded-full",
    card: "w-full h-32",
  },
  spinner: {
    base: "animate-spin",
    sizes: {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
    },
    colors: {
      brand: "text-brand-primary-base",
      white: "text-white",
    }
  },
  progress: {
    base: "relative h-2 bg-background-elevated rounded-full overflow-hidden",
    bar: "absolute left-0 top-0 h-full bg-brand-primary-base transition-all duration-200",
    indeterminate: "animate-progress-indeterminate",
  }
};

export const MEDIA_PATTERNS = {
  image: {
    base: "object-cover",
    rounded: "rounded-lg",
    aspect: {
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
    },
    loading: "animate-pulse bg-background-elevated",
  },
  avatar: {
    base: "rounded-full overflow-hidden",
    sizes: {
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-16 h-16",
    },
    group: "flex -space-x-2",
  }
};

export const STATUS_INDICATORS = {
  badge: {
    base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    success: "bg-state-success-background text-state-success-base",
    error: "bg-state-error-background text-state-error-base",
    warning: "bg-state-warning-background text-state-warning-base",
    info: "bg-state-info-background text-state-info-base",
  },
  dot: {
    base: "relative flex h-3 w-3",
    pulse: "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
    colors: {
      success: "bg-state-success-base",
      error: "bg-state-error-base",
      warning: "bg-state-warning-base",
      info: "bg-state-info-base",
    }
  }
};