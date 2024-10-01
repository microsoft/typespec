// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "TypeSpec",
      sidebar: [
        {
          label: "Reference",
          autogenerate: { directory: "current" },
        },
      ],
      customCss: ["./src/css/custom.css"],
      components: {
        Header: "./src/components/header/header.astro",
      },
    }),
    react(),
  ],
});
