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
        surface: {
          0: "var(--color-surface-0)",
          1: "var(--color-surface-1)",
          2: "var(--color-surface-2)",
          3: "var(--color-surface-3)",
        },
        border: {
          subtle: "var(--color-border-subtle)",
          default: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
        },
        content: {
          1: "var(--color-text-1)",
          2: "var(--color-text-2)",
          3: "var(--color-text-3)",
        },
        accent: "var(--color-accent)",
        dept: {
          lx: "var(--color-dept-lx)",
          vx: "var(--color-dept-vx)",
          sq: "var(--color-dept-sq)",
          st: "var(--color-dept-st)",
        },
        status: {
          go: "var(--color-status-go)",
          standby: "var(--color-status-standby)",
          hold: "var(--color-status-hold)",
          danger: "var(--color-status-danger)",
        },
      },
    },
  },
  plugins: [],
}
