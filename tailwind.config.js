/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"EB Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: '#1A1A1A',
        paper: '#FFFFFF',
        mid: '#999999',
        lite: '#E8E8E8',
        faint: '#F5F5F5',
        accent: '#9B8EC4',
      }
    },
  },
  plugins: [],
};
