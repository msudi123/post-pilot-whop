import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#080808',
        surface: '#111111',
        card: '#161616',
        border: '#222222',
        primary: '#FF5C1A',
        accent: '#F59E0B',
        success: '#22C55E',
        textPrimary: '#F0F0F0',
        textDim: '#777777',
      },
    },
  },
  plugins: [],
};

export default config;
