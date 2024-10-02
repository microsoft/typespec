// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import remarkHeadingID from "remark-heading-id";
import { resolveSideBars } from "./sidebars";

const base = process.env.TYPESPEC_WEBSITE_BASE_PATH ?? "/";

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
  redirects: {
    "/docs": base + "docs/introduction/installation/",
  },
  markdown: {
    remarkPlugins: [remarkHeadingID],
  },
});
