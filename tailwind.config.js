/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb", // Blue used in screenshots
        danger: "#dc2626",
      },
    },
  },
  plugins: [],
};
