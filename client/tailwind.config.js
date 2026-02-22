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
        sans: ['"Plus Jakarta Sans"', "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
  // Preflight off so MUI and Tailwind can coexist; use Tailwind for new components or utilities
  corePlugins: {
    preflight: false,
  },
};
