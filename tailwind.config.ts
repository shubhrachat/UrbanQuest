import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          DEFAULT: "#4a5d23",
          dark: "#2d3a14",
          light: "#6b7f3a",
        },
        amber: {
          war: "#c47a2c",
          glow: "#e8a84a",
        },
        brass: "#b8956a",
        gunmetal: {
          DEFAULT: "#2a2f33",
          dark: "#1a1d20",
          light: "#3d4449",
        },
        parchment: "#d4c4a8",
        severity: {
          low: "#4a7c59",
          mid: "#c47a2c",
          high: "#8b2e2e",
        },
      },
      fontFamily: {
        stencil: ["var(--font-bebas)", "sans-serif"],
        ops: ["var(--font-black-ops)", "sans-serif"],
        mono: ["var(--font-share-tech)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        "pulse-fast": "pulse-fast 0.8s ease-in-out infinite",
        ticker: "ticker 40s linear infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "pin-drop": "pin-drop 0.6s ease-out forwards",
        flicker: "flicker 3s linear infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.85" },
        },
        "pulse-fast": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.25)", opacity: "0.7" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(196, 122, 44, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(196, 122, 44, 0.8)" },
        },
        "pin-drop": {
          "0%": { transform: "translateY(-120px) scale(0.5)", opacity: "0" },
          "60%": { transform: "translateY(8px) scale(1.1)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "93%": { opacity: "0.8" },
          "94%": { opacity: "1" },
          "96%": { opacity: "0.9" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
