// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: "https://selfhosting.sh",
  output: "static",

  integrations: [
    expressiveCode({
      themes: ["github-dark", "github-light"],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => {
        if (theme.name === "github-dark") return '[data-theme="dark"]';
        if (theme.name === "github-light") return '[data-theme="light"]';
        return `[data-theme="${theme.name}"]`;
      },
      styleOverrides: {
        borderRadius: "0.5rem",
        borderColor: "#21262d",
      },
      defaultProps: {
        wrap: true,
      },
    }),
    sitemap(),
    pagefind(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  build: {
    format: "directory",
  },
});
