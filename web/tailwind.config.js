module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    'bg-background', 'text-dark', 'bg-dark', 'text-background',
    'bg-primary', 'text-primary',
    'bg-accent', 'text-accent',
    'bg-secondary', 'text-secondary',
    'bg-warning', 'text-warning',
    'font-sans', 'font-heading',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // deep blue
        accent: '#38bdf8', // sky blue
        secondary: '#64748b', // slate
        background: '#0a0e1a', // near-black
        glass: 'rgba(255,255,255,0.08)',
        glow: '#38bdf8',
        card: 'rgba(255,255,255,0.10)',
        cardDark: 'rgba(30,41,59,0.7)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glass: '0 4px 32px 0 rgba(56,189,248,0.15)',
        glow: '0 0 16px 2px #38bdf8',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glass': 'linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(10,14,26,0.8) 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}; 