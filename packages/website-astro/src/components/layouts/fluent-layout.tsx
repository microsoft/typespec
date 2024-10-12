import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useTheme } from "@site/src/utils/theme-react";

export const FluentLayout = ({ children }) => {
  return <FluentWrapper>{children}</FluentWrapper>;
};

const FluentWrapper = ({ children }) => {
  const theme = useTheme();
  return (
    <FluentProvider theme={theme === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
