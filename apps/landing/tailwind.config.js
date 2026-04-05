/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [
    require('@repo/config/tailwind.config.js')
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
