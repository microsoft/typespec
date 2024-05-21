import type { Meta, StoryObj } from "@storybook/react";
import { createBrowserHostInternal } from "../src/browser-host.js";
import { Playground } from "../src/react/playground.js";

const storyHost = createBrowserHostInternal({
  compiler: await import("@typespec/compiler"),
  libraries: {
    lib1: {
      name: "lib1",
      isEmitter: false,
      packageJson: { name: "lib1", version: "1.0.0" },
      _TypeSpecLibrary_: { typespecSourceFiles: {}, jsSourceFiles: {} },
    },
    lib2: {
      name: "lib2",
      isEmitter: false,
      packageJson: { name: "lib2", version: "1.0.1" },
      _TypeSpecLibrary_: { typespecSourceFiles: {}, jsSourceFiles: {} },
    },
  },
});

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
