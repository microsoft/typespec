import type { Meta, StoryObj } from "@storybook/react";
import { createBrowserHost } from "../src/browser-host.js";
import { Playground } from "../src/react/playground.js";

const storyHost = await createBrowserHost(["@typespec/compiler"], { useShim: true });

const meta: Meta<typeof Playground> = {
  title: "Components/Playground",
  component: Playground,
  decorators: [(Story) => <div style={{ height: "100vh", margin: "-1rem" }}>{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof Playground>;

export const Default: Story = {
  args: {
    host: storyHost,
  },
};
