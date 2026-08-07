/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        relief: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#3b82f6',
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#22c55e',
        }
      }
    },
  },
  plugins: [],
}
