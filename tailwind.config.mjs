/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: '#FF6B9D',
        'brand-hover': '#e85a8a',
        'brand-light': '#FFE4F0',
        dark: '#0D0D0D',
      },
    },
  },
}
