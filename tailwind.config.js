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
          DEFAULT: '#FF7A18',
          light: '#FF9A3C',
          hover: '#FF8F3A',
        },
        secondary: '#3ABEFF',
        accent: {
          purple: '#6B5CFF',
          pink: '#FF6A3D', // Using this for sports as requested
        },
        text: {
          primary: '#F4F7FA',
          secondary: '#9BA3B4',
          muted: '#6B7280',
        },
        glass: {
          DEFAULT: 'rgba(24, 34, 58, 0.6)',
          border: 'rgba(255, 255, 255, 0.06)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow': '0 0 25px rgba(255, 122, 24, 0.35)',
        'glow-tech': '0 0 20px rgba(58, 190, 255, 0.3)',
        'glow-culture': '0 0 20px rgba(107, 92, 255, 0.3)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF7A18 0%, #FF9A3C 100%)',
        'gradient-hover': 'linear-gradient(135deg, #FF8F3A 0%, #FFB066 100%)',
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
