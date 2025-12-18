import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#aa9550',
          light: '#c5b57a',
          dark: '#8a7a40',
        },
        base: {
          DEFAULT: '#000000',
        },
        accent: {
          DEFAULT: '#aa9550',
        },
        background: '#000000',
        foreground: '#ffffff',
      },
      fontFamily: {
        sans: ['var(--font-gotham)', 'system-ui', 'sans-serif'],
        gotham: ['var(--font-gotham)', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}
export default config
