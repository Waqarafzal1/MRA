import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        urdu: ['Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Arial Unicode MS', 'serif'],
      },
      colors: {
        brand: '#0f6e56',
        'wa-green': '#25d366',
      },
    },
  },
  plugins: [],
};

export default config;
