export const COLORS = {
  // Brand Colors
  actionOrange: "#F49620",
  dynamicHighlight: "#FF7200", 
  inactiveState: "#3E2E1B",

  // Background System
  baseDark: "#1E1E1E",
  gradientDark: "#2E2F2E",
};

export const COMPONENTS = {
  card: {
    base: "rounded-xl bg-gradient-to-b from-baseDark to-gradientDark p-4 transition-all duration-200",
    interactive: "hover:scale-102 cursor-pointer",
    elevated: "shadow-lg hover:shadow-xl"
  },
  button: {
    base: "rounded-lg px-4 py-2 font-medium transition-all duration-200",
    primary: "bg-actionOrange hover:bg-dynamicHighlight text-white",
    secondary: "border-2 border-actionOrange text-actionOrange hover:bg-actionOrange/10",
    ghost: "text-actionOrange hover:bg-actionOrange/10"
  }
};

export const EFFECTS = {
  glass: "backdrop-blur-md bg-baseDark/80",
  glow: "shadow-[0_0_15px_rgba(244,150,32,0.3)]",
  hover: "transition-transform hover:scale-102"
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