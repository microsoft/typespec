// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { TypeSpecLang } from "@typespec/astro-utils/shiki";
import { processSidebar } from "@typespec/astro-utils/sidebar";
import astroExpressiveCode from "astro-expressive-code";
import rehypeAstroRelativeMarkdownLinks from "astro-rehype-relative-markdown-links";
import { defineConfig } from "astro/config";
import { resolve } from "pathe";
import rehypeMermaid from "rehype-mermaid";
import remarkHeadingID from "remark-heading-id";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import current from "./src/content/current-sidebar";

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

// https://astro.build/config
export default defineConfig({
  base,
  site: "https://typespec.io",
  trailingSlash: "always",
  integrations: [
    astroExpressiveCode(),
    starlight({
      title: "TypeSpec",
      sidebar: await processSidebar(
        resolve(import.meta.dirname, "src/content/docs"),
        "docs",
        current,
      ),
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
  ],
  markdown: {
    // @ts-expect-error wrong type
    remarkPlugins: [remarkHeadingID],
    rehypePlugins: [
      rehypeMermaid,
      [rehypeAstroRelativeMarkdownLinks, { base, collectionBase: false, trailingSlash: "always" }],
    ],
    shikiConfig: {
      langs: [TypeSpecLang],
    },
  },
  vite: {
    plugins: [
      // @ts-expect-error incompatible types due to version mismatch
      nodePolyfills({
        include: ["buffer"],
        globals: {
          process: "dev",
        },
      }),
    ],
  },
});
