/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./*.html",
    "./*.js",
    "./src/**/*.js",
    "./api/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        kino: {
          base: '#08080d',
          surface: '#111118',
          card: 'rgba(255, 255, 255, 0.025)',
          elevated: 'rgba(255, 255, 255, 0.05)',
          input: 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.06)',
          'border-accent': 'rgba(124, 58, 237, 0.5)',
          text: '#eeeef0',
          secondary: '#8888a0',
          muted: '#55556a',
          accent: '#7c3aed',
          'accent-hover': '#6d28d9',
          'accent-light': '#a78bfa',
          'accent-soft': 'rgba(124, 58, 237, 0.1)',
        },
        score: {
          high: '#22c55e',
          'high-bg': 'rgba(34, 197, 94, 0.1)',
          mid: '#f59e0b',
          'mid-bg': 'rgba(245, 158, 11, 0.1)',
          low: '#ef4444',
          'low-bg': 'rgba(239, 68, 68, 0.1)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'kino-sm': '8px',
        'kino': '14px',
        'kino-lg': '20px',
      },
      boxShadow: {
        'glow-accent': '0 8px 30px rgba(124, 58, 237, 0.15)',
        'glow-card': '0 4px 20px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out forwards',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
