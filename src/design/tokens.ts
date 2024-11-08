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