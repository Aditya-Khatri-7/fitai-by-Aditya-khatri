/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0E1A',
          card: '#111827',
          border: '#1E293B',
          hover: '#1F2937'
        },
        cyan: {
          accent: '#00D4FF',
          glow: 'rgba(0, 212, 255, 0.3)'
        },
        purple: {
          accent: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
