import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./emails/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F4A68",
          hover: "#163650",
          light: "#E8F1F7",
        },
        accent: {
          DEFAULT: "#C25C15",
          hover: "#9E4A0F",
          light: "#FDEEE0",
        },
        dune: {
          50: "#FFF9F0",
          100: "#FDEEE0",
          200: "#FBDAB8",
          300: "#F8C88F",
          400: "#F5AD5E",
          500: "#F07D2D",
          600: "#C25C15",
          700: "#9E4A0F",
        },
        sky: {
          50: "#F0F7FB",
          100: "#E8F1F7",
          200: "#C9E1EF",
          300: "#A3CEDD",
          400: "#87C0DD",
          500: "#5B9DC5",
          600: "#397CAC",
          700: "#2A5D82",
          800: "#1F4A68",
          900: "#163650",
        },
        surface: "#FFFFFF",
        background: "#F7FAFC",
        border: "#E1E8ED",
        "text-primary": "#152430",
        "text-secondary": "#4B6373",
        "text-muted": "#8098A8",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#397CAC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
