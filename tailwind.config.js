/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx,html}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
        secondary: '#95a5a6',
        danger: '#e74c3c',
        dark: '#2c3e50'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif']
      }
    }
  },
  plugins: []
}