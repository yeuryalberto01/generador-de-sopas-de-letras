/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "../index.html",
    "../puzzle_generator_starter/index.html",
    "../puzzle_generator_starter/src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
    "../**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}