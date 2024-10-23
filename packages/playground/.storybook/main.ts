import type { FrameworkOptions, StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: "vite.storybook.config.ts",
      },
    } satisfies FrameworkOptions,
  },
  typescript: {
    reactDocgen: false,
  },
  addons: ["@storybook/addon-actions"],
};

export default config;
