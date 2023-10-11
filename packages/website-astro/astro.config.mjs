// @ts-check
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

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
});
