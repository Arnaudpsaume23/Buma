import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gabon: {
          green: "#009e60",
          yellow: "#fcd116",
          blue: "#3a75c4",
        },
        market: {
          orange: "#ff6b00",
          gold: "#ffb703",
          cream: "#fff7e6",
          red: "#d62828",
        },
      },
      boxShadow: {
        giant: "0 8px 0 0 #0b3d2e",
        card: "0 10px 30px rgba(11, 61, 46, 0.12)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
