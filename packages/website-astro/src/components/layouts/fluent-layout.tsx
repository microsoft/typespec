import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useColorMode } from "../docusaurus/core/theme-common";

export const FluentLayout = ({ children }) => {
  return <FluentWrapper>{children}</FluentWrapper>;
};

const FluentWrapper = ({ children }) => {
  const { colorMode } = useColorMode();
  return (
    <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
