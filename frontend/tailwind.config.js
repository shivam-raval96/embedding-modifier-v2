/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-slate-800",
    "text-white",
    "border-slate-700",
    "bg-slate-700",
    "text-slate-200",
    "text-slate-300",
    "rounded-lg",
    "p-4",
    "mb-4",
    "space-y-4",
    "grid",
    "grid-cols-1",
    "lg:grid-cols-4",
    "gap-6",
    "min-h-screen",
    "bg-white",
  ],
  theme: {
    extend: {
      colors: {
        embedding: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "scale-in": "scaleIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
