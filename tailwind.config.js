/** @type {import('tailwindcss').Config} */
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

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
      fontFamily: {
        // Prefer Geist, fall back to Tailwind's default stacks
        sans: ["Geist Sans", ...defaultTheme.fontFamily.sans],
        mono: ["Geist Mono", ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [],
};
