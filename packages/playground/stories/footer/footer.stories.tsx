import type { Meta, StoryObj } from "@storybook/react";
import { createBrowserHostInternal } from "../../src/browser-host.js";
import { PlaygroundContextProvider } from "../../src/react/context/playground-context.js";
import { Footer, FooterItem, FooterVersionItem } from "../../src/react/footer/index.js";

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

const meta: Meta<typeof Footer> = {
  title: "Components/Footer/Footer",
  component: Footer,
  decorators: [
    (Story) => (
      <PlaygroundContextProvider value={{ host: storyHost, setContent: () => null }}>
        <Footer>{Story()}</Footer>
      </PlaygroundContextProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Footer>;

export const Multiple: Story = {
  args: {
    children: (
      <>
        <FooterItem>One</FooterItem>
        <FooterItem>Two</FooterItem>
        <FooterItem>Three</FooterItem>
      </>
    ),
  },
};

export const VersionItemAndInfo: Story = {
  args: {
    children: (
      <>
        <FooterItem>One</FooterItem>
        <FooterVersionItem />
      </>
    ),
  },
};
