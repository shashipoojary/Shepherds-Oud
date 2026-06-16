import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          amber: "#C07A4A",
          "amber-mid": "#A86235",
          "amber-dark": "#8B4E25",
          "green-dark": "#404D3C",
          "green-mid": "#6C7C5C",
          "green-light": "#8D9C6B",
          "green-pale": "#B5C18B",
          "beige-dark": "#A08090",
          "beige-mid": "#B09AA8",
          "beige-light": "#D8C1C8",
          cream: "#F7F4F0",
          "service-pale": "#EAF0E4"
        },
        sage: {
          50: "#F7F4F0",
          100: "#B5C18B",
          200: "#8D9C6B",
          600: "#404D3C",
          700: "#6C7C5C"
        },
        cream: "#F7F4F0",
        ink: "#2A2A2A"
      },
      fontFamily: {
        brand: ["var(--font-brand)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "12px",
        chip: "32px"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(64, 77, 60, 0.08)",
        panel: "0 10px 28px rgba(64, 77, 60, 0.1)",
        "card-hover": "0 8px 24px rgba(64, 77, 60, 0.12)"
      },
      fontSize: {
        hero: ["clamp(2.5rem,4vw,3.5rem)", { lineHeight: "1.2" }],
        h2: ["1.75rem", { lineHeight: "1.2" }],
        h3: ["1.25rem", { lineHeight: "1.2" }],
        body: ["0.9375rem", { lineHeight: "1.7" }],
        caption: ["0.8rem", { lineHeight: "1.5" }]
      }
    }
  },
  plugins: []
};

export default config;
