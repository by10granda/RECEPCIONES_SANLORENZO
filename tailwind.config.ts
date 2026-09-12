import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pasRed: "#FF0000",
        pasGreen: "#22DB04",
        ink: "#172026"
      },
      boxShadow: {
        soft: "0 20px 50px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
