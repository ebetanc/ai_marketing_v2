/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: colors.blue, // Alias brand to Tailwind's blue scale for now
      },
      borderRadius: {
        card: "1rem", // 16px card radius token
      },
    },
  },
  plugins: [],
};
