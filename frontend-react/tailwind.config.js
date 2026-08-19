/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07090f',
        'bg-card': '#10141f',
        'bg-card2': '#161b2a',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-cyan': 'rgba(0, 212, 255, 0.25)',
        text: '#f0f4f8',
        text2: '#94a3b8',
        text3: '#64748b',
        cyan: '#00d4ff',
        purple: '#8b5cf6',
        red: '#ff3d5a',
        orange: '#ff6b35',
        yellow: '#fbbf24',
        green: '#10d48e',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
