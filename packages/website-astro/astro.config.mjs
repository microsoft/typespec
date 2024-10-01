// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

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
          label: "Reference",
          autogenerate: { directory: "current" },
        },
      ],
    }),
    react(),
  ],
});
