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
        // Deep crimson AI theme — a serious, premium red rather than an
        // "alert" red, since this is an exam brand, not a warning system.
        primary: {
          DEFAULT: "#9F1239",
          hover: "#7F0F2E",
          light: "#FCE7EC",
        },
        accent: {
          DEFAULT: "#9F1239",
          hover: "#7F0F2E",
          light: "#FCE7EC",
          dark: "#7F0F2E",
        },
        dune: {
          50: "#FFF5F7",
          100: "#FCE7EC",
          200: "#F8C9D4",
          300: "#F3A3B5",
          400: "#E85C7B",
          500: "#C81E4C",
          600: "#9F1239",
          700: "#7F0F2E",
        },
        sky: {
          50: "#FFF5F7",
          100: "#FCE7EC",
          200: "#F8C9D4",
          300: "#F3A3B5",
          400: "#E85C7B",
          500: "#C81E4C",
          600: "#B21642",
          700: "#9F1239",
          800: "#7F0F2E",
          900: "#5C0B22",
        },
        surface: "#FFFFFF",
        background: "#FFF9FA",
        border: "#F1DCE1",
        "text-primary": "#241016",
        "text-secondary": "#6B4652",
        "text-muted": "#9E7C86",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#9F1239",
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
