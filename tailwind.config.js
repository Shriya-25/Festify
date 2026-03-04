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
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-card': 'rgb(var(--color-surface-card) / <alpha-value>)',
        primary: {
          DEFAULT: '#3ABEFF',
          light: '#6FCFFF',
          hover: '#0088FF',
          end: '#0088FF', 
        },
        secondary: '#9BA3B4',
        accent: {
          purple: '#9D00FF',
          pink: '#FF007A',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted: '#94A3B8',
        },
        'fest-border': 'rgb(var(--color-border) / <alpha-value>)',
        // Old references kept for compatibility if needed, but updated to use vars
        'bg-base': 'rgb(var(--color-background) / <alpha-value>)',
        'surface-sidebar': 'rgb(var(--color-surface) / <alpha-value>)',
        
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)', // More generic glass
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'lg': '0.5rem', 
        'xl': '0.75rem', 
        '2xl': '1.25rem', 
        'full': '9999px'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 25px rgba(58, 190, 255, 0.45)',
        'glow-primary': '0 0 25px rgba(58, 190, 255, 0.45)',
        'glow-blue': '0 0 20px rgba(58, 190, 255, 0.4)',
        'glow-purple': '0 0 20px rgba(157, 0, 255, 0.4)',
        'glow-pink': '0 0 20px rgba(255, 0, 122, 0.4)',
        'card-main': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3ABEFF 0%, #0088FF 100%)',
        'gradient-hover': 'linear-gradient(135deg, #0088FF 0%, #3ABEFF 100%)',
        'gradient-dark': 'linear-gradient(to bottom, transparent, rgba(10, 15, 31, 0.9))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
