import type { Meta, StoryObj } from "@storybook/react";
import { Footer, FooterItem } from "../../src/react/footer/index.js";

const meta: Meta<typeof FooterItem> = {
  title: "Components/Footer/FooterItem",
  component: FooterItem,
  decorators: [
    (Story) => (
      <Footer>
        <Story />
      </Footer>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FooterItem>;

export const Default: Story = {
  args: {
    children: "Content",
  },
};
export const WithLink: Story = {
  args: {
    children: "Go to typespec.io",
    link: "https://typespec.io",
  },
};
