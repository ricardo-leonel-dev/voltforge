import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: {
          DEFAULT: '#1E293B',
          hover: '#263548',
        },
        primary: {
          DEFAULT: '#0EA5E9',
          hover: '#38BDF8',
          foreground: '#0F172A',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover: '#FCD34D',
          foreground: '#0F172A',
        },
        muted: {
          DEFAULT: '#334155',
          foreground: '#94A3B8',
        },
        border: '#334155',
        input: '#1E293B',
        ring: '#0EA5E9',
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FAFAFA',
        },
        foreground: '#F1F5F9',
        card: {
          DEFAULT: '#1E293B',
          foreground: '#F1F5F9',
        },
        popover: {
          DEFAULT: '#1E293B',
          foreground: '#F1F5F9',
        },
        secondary: {
          DEFAULT: '#334155',
          foreground: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
