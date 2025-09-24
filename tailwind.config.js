/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0b1220",
          card: "#111827",
          accent: "#7c3aed"
        }
      }
    }
  },
  plugins: []
};
