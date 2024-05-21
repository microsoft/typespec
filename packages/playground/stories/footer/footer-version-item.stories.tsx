import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { createBrowserHostInternal } from "../../src/browser-host.js";
import { PlaygroundContextProvider } from "../../src/react/context/playground-context.js";
import {
  Footer,
  FooterVersionItem,
  type VersionSelectorProps,
} from "../../src/react/footer/index.js";

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

const meta: Meta<typeof FooterVersionItem> = {
  component: FooterVersionItem,
  title: "Footer/FooterVersionItem",
  decorators: [
    (Story) => (
      <FluentProvider theme={webLightTheme}>
        <PlaygroundContextProvider value={{ host: storyHost }}>
          <Footer>{Story()}</Footer>
        </PlaygroundContextProvider>
      </FluentProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FooterVersionItem>;

export const Readonly: Story = {
  name: "Read only",
  args: {},
};

const versionSelector: VersionSelectorProps = {
  versions: [
    { name: "1.0.0", label: "1.0.0" },
    { name: "1.1.0", label: "1.1.0" },
    { name: "1.2.1", label: "1.2.0" },
  ],
  selected: "1.0.0",
  latest: "1.2.0",
  onChange: fn(),
};

export const WithSelector: Story = {
  args: {
    versionSelector: versionSelector,
  },
};
