/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        stage: {
          dark: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          accent: "#38bdf8",
          lx: "#eab308", // Amber/Yellow for Lighting
          vx: "#a855f7", // Purple for Visual LED
          sq: "#06b6d4", // Cyan for Sound
          action: "#22c55e", // Green for Action/Go
          standby: "#f97316", // Orange for Standby
        },
      },
    },
  },
  plugins: [],
}
