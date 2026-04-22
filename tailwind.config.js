/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'system-ui', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
      },
      colors: {
        void:    '#07070f',
        deep:    '#0d0d1a',
        accent:  '#7c3aed',
        cyan:    '#06b6d4',
      },
    },
  },
  plugins: [],
};
