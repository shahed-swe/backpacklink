import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a1f24',
        brand: {
          50: '#effdfb',
          100: '#c8fcf3',
          200: '#92f7e8',
          300: '#54ebd9',
          400: '#22d3c2',
          500: '#0bb7a8',
          600: '#039389',
          700: '#08746e',
          800: '#0c5c58',
          900: '#0f4c49',
          950: '#012b2b',
        },
        coral: {
          50: '#fff3f0',
          100: '#ffe4dd',
          200: '#ffcdc0',
          300: '#ffab94',
          400: '#ff7d5c',
          500: '#ff5a36',
          600: '#ed3d18',
          700: '#c82e10',
        },
        sand: { 50: '#fdfaf6', 100: '#faf3ea', 200: '#f3e6d3' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: { card: '0 10px 40px -12px rgba(3, 147, 137, 0.18)' },
      backgroundImage: { lagoon: 'linear-gradient(135deg, #039389 0%, #0bb7a8 60%, #22d3c2 100%)' },
    },
  },
  plugins: [],
};

export default config;
