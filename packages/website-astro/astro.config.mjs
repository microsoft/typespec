// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { readFile } from "fs/promises";
import { resolve } from "path";
import rehypeMermaid from "rehype-mermaid";
import remarkHeadingID from "remark-heading-id";
import { resolveSideBars } from "./sidebars";
import tspTryitCode from "./src/plugins/tsp-tryit-code";

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

const grammarPath = resolve(import.meta.dirname, "../../grammars/typespec.json");
const tspGrammar = JSON.parse((await readFile(grammarPath)).toString());

const typespecLang = {
  ...tspGrammar,
  id: "typespec",
  scopeName: "source.tsp",
  path: grammarPath,
  aliases: ["typespec", "tsp"],
};

// https://astro.build/config
export default defineConfig({
  base,
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "TypeSpec",
      sidebar: await resolveSideBars(),
      customCss: ["./src/css/custom.css"],
      components: {
        Header: "./src/components/header/header.astro",
      },
      expressiveCode: {
        themes: ["one-light", "one-dark-pro"],
        styleOverrides: {
          frames: {
            frameBoxShadowCssValue: "",
          },
        },
        // @ts-expect-error version mismatch
        plugins: [tspTryitCode(base + "playground/")],
      },
      head: [
        {
          tag: "script",
          attrs: {
            src: "https://consentdeliveryfd.azurefd.net/mscc/lib/v2/wcp-consent.js",
          },
        },
        {
          tag: "script",
          attrs: {
            type: "module",
            async: true,
            src: "1ds-init.js",
          },
        },
      ],
      plugins: [],
    }),
    react(),
  ],
  markdown: {
    // @ts-expect-error wrong type
    remarkPlugins: [remarkHeadingID],
    rehypePlugins: [rehypeMermaid],
    shikiConfig: {
      langs: [typespecLang],
    },
  },
});
