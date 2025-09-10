/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2A9D8F',
        secondary: '#E9C46A',
        accent: '#E76F51',
        background: '#F8F9FA',
        text: '#264653',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      height: {
        screen: '100vh',
        '90vh': '90vh',
      },
    },
  },
  plugins: [],
}
