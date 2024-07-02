import { KeyRegular } from "@fluentui/react-icons";
import type { Meta, StoryObj } from "@storybook/react";
import { createBrowserHost } from "../src/browser-host.js";
import { Playground } from "../src/react/playground.js";
import type { ProgramViewer } from "../src/react/types.js";
import { registerMonacoLanguage } from "../src/services.js";

const storyHost = await createBrowserHost(["@typespec/compiler"], { useShim: true });

await registerMonacoLanguage(storyHost);

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

const viewer: ProgramViewer = {
  icon: <KeyRegular />,
  key: "show-models",
  label: "show models",
  render: (props) => {
    const { program } = props;
    const models = [...program.getGlobalNamespaceType().models.values()];
    return (
      <div>
        <div>Models: </div>
        <ul>
          {models.map((x) => {
            return <li key={x.name}>{x.name}</li>;
          })}
        </ul>
      </div>
    );
  },
};
export const CustomViewer: Story = {
  args: {
    defaultContent: `model Foo {}\nmodel Bar {}\nmodel Baz {}\nscalar NotAModel;\n`,
    host: storyHost,
    viewers: [viewer],
  },
};
