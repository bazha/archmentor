/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#0f172a', raised: '#1e293b', muted: '#334155' },
        accent: { DEFAULT: '#6366f1', soft: '#818cf8' },
      },
    },
  },
  plugins: [],
};
