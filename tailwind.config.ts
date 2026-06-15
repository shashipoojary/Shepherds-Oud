import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#eef8f3",
          100: "#d8f3dc",
          600: "#2d6a4f",
          700: "#214f3a"
        },
        cream: "#f9f6f1",
        ink: "#1a1a1a"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.06)",
        panel: "0 10px 28px rgba(26,26,26,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
