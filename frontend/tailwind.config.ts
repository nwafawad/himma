import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBF9F5",
        card: {
          DEFAULT: "#FFFFFF",
          muted: "#F7F5F0",
        },
        charcoal: {
          DEFAULT: "#18181B",
          muted: "#6B7280",
        },
        border: {
          light: "#E5E7EB",
          subtle: "#E4E4E7",
        },
        ai: {
          dark: "#181820",
          accent: "#818CF8",
          highlight: "#A5B4FC",
          badge: "#2D2B55",
        },
        badge: {
          trackBg: "#EEF2FF",
          trackText: "#4F46E5",
          driftBg: "#F4F4F5",
          driftText: "#52525B",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Instrument Serif", "Playfair Display", "serif"],
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
