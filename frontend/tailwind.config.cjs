/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './frontend/index.html',
    './frontend/src/**/*.{js,jsx,ts,tsx}',

    './frontend/src/components/**/*.{js,jsx,ts,tsx}',
    './frontend/src/context/**/*.{js,jsx,ts,tsx}',
    './frontend/src/hooks/**/*.{js,jsx,ts,tsx}',
    './frontend/src/pages/**/*.{js,jsx,ts,tsx}',
    './frontend/src/layouts/**/*.{js,jsx,ts,tsx}',
    './frontend/src/utils/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {},
  },

  plugins: [],
};
