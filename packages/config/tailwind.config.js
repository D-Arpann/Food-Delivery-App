/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F8964F',
          'orange-light': '#FFF4EC',
          dark: '#1E1E1E',
          'dark-secondary': '#333232',
          'dark-muted': '#5E5E5E',
          cream: '#FFFCF9',
          'off-white': '#FCFAFA',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
}
