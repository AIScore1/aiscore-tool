import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#29a871',
          black: '#1d1d1f',
          blue: '#0071e3',
          white: '#fbfbfd',
          'gray-light': '#f5f5f7',
          'gray-dark': '#6e6e73',
        },
        score: {
          critical: '#E24B4A',
          poor: '#EF9F27',
          fair: '#BA7517',
          good: '#29a871',
          excellent: '#1D9E75',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
