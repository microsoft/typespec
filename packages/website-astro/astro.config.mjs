// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { readFileSync } from "fs";

const grammarPath = "../../packages/compiler/dist/typespec.tmLanguage.json";
const tspGrammar = JSON.parse(readFileSync(grammarPath));

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
      langs: [myLanguage],
    },
  },
});
