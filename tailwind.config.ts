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
        background: "#101015",
        panel: "rgba(20, 20, 25, 0.6)",
        neonCyan: "#00FFFF",
        neonMagenta: "#FF00FF",
        neonLime: "#39FF14",
        brightRed: "#FF1744",
      },
      backdropBlur: {
        glass: "12px",
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glitch: "glitch 0.5s ease-in-out",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
