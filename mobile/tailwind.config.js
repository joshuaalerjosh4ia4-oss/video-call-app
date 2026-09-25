/** @type {import('tailwindcss').Config} */
/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "app-bg": "#F7F4EE",
        "app-surface": "#FFFFFF",
        "app-surface-alt": "#EEE9DF",
        "app-border": "#D8D0C3",
        "app-text": "#292522",
        "app-muted": "#756D64",
        "app-muted-2": "#968D82",
        "app-primary": "#563B68",
        "app-primary-light": "#805A91",
        "app-success": "#28745A",
        "app-success-dot": "#3D9A73",
        "app-danger": "#B84A4A",
        "app-danger-light": "#D98282",
        "app-danger-bg": "#F4DEDA",
        "app-danger-text": "#7B2929",
        "app-warning": "#C17A28",
      },
    },
  },
  plugins: [],
};
