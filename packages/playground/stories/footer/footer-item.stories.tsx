import type { Meta, StoryObj } from "@storybook/react";
import { Footer, FooterItem } from "../../src/react/footer/index.js";

const meta: Meta<typeof FooterItem> = {
  component: FooterItem,
};

export default meta;
type Story = StoryObj<typeof FooterItem>;

export const InsideFooter: Story = {
  args: {
    children: "Content",
  },
  decorators: [
    (Story) => (
      <Footer>
        <Story />
      </Footer>
    ),
  ],
};
