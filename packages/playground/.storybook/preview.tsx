import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { Preview } from "@storybook/react";

const preview: Preview = {
  decorators: [
    (Story, { parameters }) => {
      return (
        <FluentProvider theme={webLightTheme}>
          <Story />
        </FluentProvider>
      );
    },
  ],
};

export default preview;
