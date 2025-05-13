module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF0066',
        secondary: '#C0C0C0',
        dark: '#333333',
        'dark-light': '#666666',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 