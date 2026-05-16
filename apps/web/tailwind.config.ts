import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#112031',
        mist: '#edf4f7',
        sea: '#0f766e',
        amber: '#c2410c',
        blush: '#991b1b'
      },
      boxShadow: {
        panel: '0 20px 40px rgba(17, 32, 49, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
