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
        {
          tag: "script",
          attrs: {
            type: "module",
          },
          content: `const els = document.querySelectorAll("pre.mermaid");
if (els.length > 0) {
  const { default: mermaid } = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
  mermaid.initialize({ startOnLoad: false });
  await mermaid.run({ nodes: els });
}`,
        },
      ],
      social: [
        {
          label: "GitHub",
          icon: "github",
          href: "https://github.com/microsoft/typespec",
        },
        {
          label: "Discord",
          icon: "discord",
          href: "https://aka.ms/typespec/discord",
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
      [rehypeMermaid, { strategy: "pre-mermaid" }],
      [rehypeAstroRelativeMarkdownLinks, { base, collectionBase: false, trailingSlash: "always" }],
    ],
    shikiConfig: {
      langs: [TypeSpecLang],
    },
  },
});
