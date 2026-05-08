import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#B8922A',
        'gold-light': '#D4A843',
        cream: '#F5F0E8',
        xinao: {
          black: '#0A0A0A',
          red: '#E51E21',
          n100: '#F0EBE3',
          n200: '#DDD8CF',
          n400: '#A09890',
          n600: '#5C5650',
          n800: '#2A2520',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
