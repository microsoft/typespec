import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  typescript: {
    reactDocgen: false,
  },
  addons: ["@storybook/addon-actions"],
};

export default config;
