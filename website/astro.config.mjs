// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import tailwind from "@astrojs/tailwind";
import astroExpressiveCode from "astro-expressive-code";
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";
import { defineConfig } from "astro/config";
import { readFile } from "fs/promises";
import { resolve } from "path";
import rehypeMermaid from "rehype-mermaid";
import remarkHeadingID from "remark-heading-id";
import { resolveSideBars } from "./sidebars";

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

const grammarPath = resolve(import.meta.dirname, "../grammars/typespec.json");
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
  site: "https://typespec.io",
  trailingSlash: "always",
  integrations: [
    astroExpressiveCode(),
    starlight({
      title: "TypeSpec",
      sidebar: await resolveSideBars(),
      favicon: "/img/favicon.svg",
      customCss: ["./src/css/custom.css"],
      components: {
        Header: "./src/components/header/header.astro",
        PageFrame: "./src/components/starlight-overrides/PageFrame.astro",
      },
      expressiveCode: false, // defined directly above
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
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    // @ts-expect-error wrong type
    remarkPlugins: [remarkHeadingID],
    rehypePlugins: [
      rehypeMermaid,
      [
        rehypeAstroRelativeMarkdownLinks,
        { base, contentPath: "src/content/docs", trailingSlash: "always" },
      ],
    ],
    shikiConfig: {
      langs: [typespecLang],
    },
  },
});
