import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  framework: "@storybook/react-vite",
  typescript: {
    reactDocgen: false,
  },
};

export default config;
