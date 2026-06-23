/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'bg-surface': 'var(--bg-surface)',
        'bg-elevated': 'var(--bg-elevated)',
        'gold-primary': 'var(--gold-primary)',
        'gold-light': 'var(--gold-light)',
        'gold-dim': 'var(--gold-dim)',
        'teal-accent': 'var(--teal-accent)',
        'teal-deep': 'var(--teal-deep)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
      },
      fontFamily: {
        'display': ['Playfair Display', 'Noto Serif SC', 'serif'],
        'sans': ['DM Sans', 'Noto Serif SC', 'sans-serif'],
      },
      animation: {
        'orb-float-1': 'orbFloat1 20s ease-in-out infinite',
        'orb-float-2': 'orbFloat2 25s ease-in-out infinite',
        'orb-float-3': 'orbFloat3 18s ease-in-out infinite',
        'logo-pulse': 'logoPulse 3s ease-in-out infinite',
        'ring-rotate': 'ringRotate 30s linear infinite',
        'fade-in': 'fadeIn 1.2s 1s forwards',
        'fade-slide-up': 'fadeSlideUp 0.8s forwards',
      },
      keyframes: {
        orbFloat1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-80px, 60px) scale(1.1)' },
          '66%': { transform: 'translate(40px, -30px) scale(0.9)' },
        },
        orbFloat2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(60px, -80px) scale(1.15)' },
        },
        orbFloat3: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-50px, 40px)' },
        },
        logoPulse: {
          '0%, 100%': { transform: 'scale(0.6)', opacity: '0.3' },
          '50%': { transform: 'scale(1.2)', opacity: '0.1' },
        },
        ringRotate: {
          to: { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          to: { opacity: '1' },
        },
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
