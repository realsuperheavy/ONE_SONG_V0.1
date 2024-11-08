export const COLORS = {
  brand: {
    actionOrange: "#F49620",
    dynamicHighlight: "#FF7200",
    inactiveState: "#3E2E1B"
  },
  background: {
    baseDark: "#1E1E1E",
    gradientDark: "#2E2F2E"
  }
};

export const LAYOUT = {
  navigation: {
    height: "60px",
    sidebar: {
      width: "280px",
      mobileCollapsed: "0px"
    },
    gutter: "24px"
  }
};

export const TYPOGRAPHY = {
  fontFamily: {
    heading: "Inter",
    body: "Inter"
  },
  fontSize: {
    h1: "48px",
    h2: "32px",
    h3: "24px",
    h4: "20px",
    body: "16px"
  },
  lineHeight: {
    heading: "1.2",
    body: "1.5"
  },
  letterSpacing: {
    heading: "-0.02em"
  }
};

export const ANIMATION = {
  duration: {
    fast: "200ms",
    normal: "300ms",
    slow: "400ms"
  },
  timing: "ease-in-out",
  scale: {
    hover: "1.02",
    click: "0.98"
  }
};

export const BREAKPOINTS = {
  mobile: "768px",
  tablet: "1024px",
  desktop: "1280px"
};

export const COMPONENTS = {
  button: {
    base: "rounded-lg transition-all duration-200",
    primary: "bg-actionOrange hover:bg-dynamicHighlight text-white",
    secondary: "border-2 border-actionOrange text-actionOrange",
    disabled: "bg-inactiveState cursor-not-allowed"
  },
  card: {
    base: "bg-baseDark rounded-xl p-4",
    hover: "hover:shadow-lg transition-shadow duration-200",
    gradient: "bg-gradient-to-b from-baseDark to-gradientDark"
  },
  input: {
    base: "bg-baseDark border-2 rounded-lg p-2",
    focus: "focus:border-actionOrange focus:ring-1 focus:ring-actionOrange",
    error: "border-red-500 focus:border-red-500"
  }
}; 