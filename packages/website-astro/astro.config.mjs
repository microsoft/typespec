// @ts-check
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import { resolveSideBars } from "./sidebars";

// https://astro.build/config
export default defineConfig({
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
            type: "module",
            async: true,
            src: "1ds-init.js",
          },
        },
      ],
    }),
    react(),
  ],
  redirects: {
    "/docs": "/current/introduction/installation",
  },
});
