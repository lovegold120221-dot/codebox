/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        codebox: {
          bg: '#111113',
          sidebar: '#161618',
          input: '#1e1e21',
          card: '#1a1a1d',
          border: '#27272b',
          primary: '#f4f4f6',
          secondary: '#8e8e93',
          muted: '#5c5c61',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
          cyan: '#06b6d4',
          pink: '#ec4899',
          code: '#151518',
          accent: '#6366f1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
