/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solvari brand colors
        solvari: {
          primary: '#0066FF',
          secondary: '#00D4AA',
          dark: '#0A1628',
          light: '#F8FAFC',
        },
        // Ring colors
        ring: {
          1: '#EF4444', // Vakman - Red
          2: '#F97316', // ZZP - Orange
          3: '#EAB308', // Hobbyist - Yellow
          4: '#3B82F6', // Academy - Blue
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px #0066FF, 0 0 10px #0066FF' },
          '100%': { boxShadow: '0 0 20px #0066FF, 0 0 30px #00D4AA' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
}
