/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        olive: {
          500: "#6B8E23",
          700: "#556B2F",
        },
      },
    },
  },
  plugins: [],
};
