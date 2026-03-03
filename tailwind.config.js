/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0F1F',
        surface: '#121A2F',
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
          primary: '#F4F7FA',
          secondary: '#9BA3B4',
          muted: '#4A5568',
        },
        // New colors from reference
        'electric-blue': '#3ABEFF',
        'royal-purple': '#9D00FF',
        'neon-pink': '#FF007A',
        'bg-base': '#0A0F1F',
        'surface-card': 'rgba(15, 25, 45, 0.8)',
        'surface-sidebar': '#070C18',
        
        glass: {
          DEFAULT: 'rgba(24, 34, 58, 0.6)',
          border: 'rgba(255, 255, 255, 0.06)',
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
