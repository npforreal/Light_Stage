/** @type {import('tailwindcss').Config} */
function colorToken(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

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
          0: colorToken("--color-surface-0"),
          1: colorToken("--color-surface-1"),
          2: colorToken("--color-surface-2"),
          3: colorToken("--color-surface-3"),
        },
        border: {
          subtle: colorToken("--color-border-subtle"),
          default: colorToken("--color-border-default"),
          strong: colorToken("--color-border-strong"),
        },
        content: {
          1: colorToken("--color-text-1"),
          2: colorToken("--color-text-2"),
          3: colorToken("--color-text-3"),
        },
        accent: colorToken("--color-accent"),
        dept: {
          lx: colorToken("--color-dept-lx"),
          vx: colorToken("--color-dept-vx"),
          sq: colorToken("--color-dept-sq"),
          st: colorToken("--color-dept-st"),
        },
        status: {
          go: colorToken("--color-status-go"),
          standby: colorToken("--color-status-standby"),
          hold: colorToken("--color-status-hold"),
          danger: colorToken("--color-status-danger"),
        },
      },
      borderColor: {
        subtle: colorToken("--color-border-subtle"),
        default: colorToken("--color-border-default"),
        strong: colorToken("--color-border-strong"),
      },
    },
  },
  plugins: [],
}
