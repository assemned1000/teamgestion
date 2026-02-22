/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#0F1115',
        'base-alt': '#12141A',
        'surface': '#1A1D24',
        'elevated': '#12141A',
        'elevated-from': '#1E212A',
        'elevated-to': '#181B22',
      },
      backgroundColor: {
        'base': '#0F1115',
        'base-alt': '#12141A',
        'surface': '#1A1D24',
        'elevated': '#12141A',
      }
    },
  },
  plugins: [],
}
