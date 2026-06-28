import type { Config } from 'tailwindcss';

// BackpackLink — "modern travel / adventure" system.
// Deep teal brand + warm coral/amber accents, rounded & friendly.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a1f24', // near-black deep teal (text / dark sections)
        brand: {
          50: '#effdfb',
          100: '#c8fcf3',
          200: '#92f7e8',
          300: '#54ebd9',
          400: '#22d3c2',
          500: '#0bb7a8',
          600: '#039389', // primary deep teal
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
          500: '#ff5a36', // primary accent
          600: '#ed3d18',
          700: '#c82e10',
          800: '#a52914',
          900: '#882718',
        },
        sand: {
          50: '#fdfaf6',
          100: '#faf3ea',
          200: '#f3e6d3',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(3, 147, 137, 0.18)',
        glow: '0 12px 50px -10px rgba(255, 90, 54, 0.35)',
      },
      backgroundImage: {
        'sunset': 'linear-gradient(135deg, #ff7d5c 0%, #ff5a36 45%, #ed3d18 100%)',
        'lagoon': 'linear-gradient(135deg, #039389 0%, #0bb7a8 60%, #22d3c2 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
