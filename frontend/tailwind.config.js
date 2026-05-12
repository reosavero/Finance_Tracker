/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4361EE',
        secondary: '#FFD60A',
        cream: '#E8E4DE',
        navy: '#1A1A2E',
        income: '#06D6A0',
        expense: '#EF476F',
        warning: '#F77F00',
        lavender: '#7209B7',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px #1A1A2E',
        'brutal-sm': '2px 2px 0px #1A1A2E',
        'brutal-lg': '6px 6px 0px #1A1A2E',
        'brutal-primary': '4px 4px 0px #4361EE',
        'brutal-income': '4px 4px 0px #06D6A0',
        'brutal-expense': '4px 4px 0px #EF476F',
        'brutal-none': '0px 0px 0px #1A1A2E',
      },
      borderRadius: {
        'brutal': '12px',
        'brutal-lg': '16px',
      },
      animation: {
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pop': 'pop 0.2s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
// Trigger rebuild

