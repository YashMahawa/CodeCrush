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
        background: "#05050A", // Obsidian
        surface: "#0F111A",     // Deep Blue-Grey
        glass: {
          border: "rgba(255, 255, 255, 0.08)",
          highlight: "rgba(255, 255, 255, 0.15)",
          base: "rgba(10, 10, 18, 0.6)",
        },
        primary: {
          start: "#7928CA", // Deep Violet
          end: "#FF0080",   // Electric Pink
          cyan: "#00DFD8",  // Cyber Cyan
        },
        // Legacy support (mapped to new palette or kept for safety)
        neonCyan: "#00DFD8",
        neonMagenta: "#D946EF",
        neonLime: "#84CC16",
      },
      backdropBlur: {
        'xs': '2px',
        glass: "16px",
        deep: "40px",
      },
      animation: {
        pulse: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
