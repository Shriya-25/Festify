/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F97316', // Orange accent
        secondary: '#FB923C',
        dark: {
          100: '#1E293B',
          200: '#0F172A',
          300: '#334155',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'card': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
