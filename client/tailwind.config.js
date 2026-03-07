/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0d9488",
          light: "#14b8a6",
          dark: "#0f766e",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "Plus Jakarta Sans", "Segoe UI", "sans-serif"],
        display: ["Outfit", "DM Sans", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(2%, -2%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-up": "fade-in-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-down": "slide-down 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 14s ease-in-out infinite",
      },
      boxShadow: {
        "soft": "0 2px 15px -3px rgb(0 0 0 / 0.04), 0 4px 6px -4px rgb(0 0 0 / 0.02)",
        "glow-teal": "0 0 30px -5px rgb(13 148 136 / 0.25)",
      },
    },
  },
  plugins: [],
};
