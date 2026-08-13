import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0B0A09',
        'surface-secondary': '#121110',
        'surface-tertiary': '#171513',
        ink: '#F5F1EC',
        body: '#A8A29A',
        muted: '#6E675F',
        accent: '#FE5200',
        copper: '#A07563',
        'line': 'rgba(245, 241, 236, 0.10)',
      },
      fontFamily: {
        display: ['var(--font-barlow)', '"Barlow Condensed"', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        kicker: '0.34em',
        wide: '0.12em',
      },
    },
  },
  plugins: [],
};

export default config;
