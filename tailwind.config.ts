import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "Assistant", "Rubik", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          DEFAULT: "#0d9488",
          light: "#5eead4",
          dark: "#0f766e"
        }
      }
    }
  },
  plugins: []
};

export default config;
