/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 护眼低饱和度配色
        'paper': '#faf8f3',
        'paper-dark': '#f0ede5',
        'ink': '#2c2825',
        'ink-light': '#5c5650',
        'ink-soft': '#8a847d',
        'accent': '#7c9885',
        'accent-dark': '#5e7a67',
        'accent-light': '#a8c0af',
        'warn': '#c9a96e',
        'error': '#c47b6b',
        'line': '#d8d3c8',
        'line-soft': '#e8e4da',
        'grid': '#c5bda8',
      },
      fontFamily: {
        'sans': ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        'serif': ['"Noto Serif SC"', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'hand-cn': ['"Ma Shan Zheng"', 'cursive'],
        'hand-en': ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(44, 40, 37, 0.06)',
        'medium': '0 4px 16px rgba(44, 40, 37, 0.1)',
        'float': '0 8px 24px rgba(44, 40, 37, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
