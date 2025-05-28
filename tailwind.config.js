/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx,html}", // Ruta a tus archivos React
  ],
  theme: {
    extend: {
      // Aquí puedes añadir tus personalizaciones de tema más adelante,
      // como las que te sugerí para borderRadius y colors.
      // Por ahora, lo dejamos así para empezar.
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
        '5xl': '3rem',
      },
      colors: {
        'brand-primary': '#3b82f6',
        'brand-secondary': '#10b981',
        'brand-accent': '#f59e0b',
        'brand-light': '#e2e8f0',
        'brand-dark': '#1a202c',
        'brand-surface': '#2d3748',
        'brand-muted': '#4a5568',
      }
    },
  },
  plugins: [],
}