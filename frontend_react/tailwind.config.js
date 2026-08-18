/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#14b8a6",
        secondary: "#334155",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
        dark: "#0f172a",
        card: "#1e293b"
      }
    },
  },
  plugins: [],
}
