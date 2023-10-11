// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const websiteRoot = dirname(fileURLToPath(import.meta.url));

const grammarPath = resolve(websiteRoot, "../compiler/dist/typespec.tmLanguage.json");
const tspGrammar = JSON.parse(readFileSync(grammarPath).toString());

const myLanguage = {
  id: "typespec",
  scopeName: "source.tsp",
  path: grammarPath,
  grammar: tspGrammar,
  aliases: ["typespec", "tsp"],
};

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "My Docs",
      social: {
        github: "https://github.com/withastro/starlight",
      },
      sidebar: [
        {
          label: `Next 🚧`,
          autogenerate: { directory: "current" },
        },
        {
          label: `Latest 🚀`,
          autogenerate: { directory: "current" },
        },
      ],
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      langs: [myLanguage],
    },
  },
});
