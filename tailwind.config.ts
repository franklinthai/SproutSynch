import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'linear-gradient(226.18deg, #84A96E -54.45%, #EAF2E0 13.8%)'
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        customGreen: '#FAFFF4',
        customDarkGreen: '#50734A'
      },
      fontFamily: {
        sans: ['Open Sans', 'ui-sans-serif', 'system-ui'], // Add Open Sans to the sans-serif stack
      }
    },
  },
  plugins: [],
};
export default config;
