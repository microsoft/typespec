import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useTheme } from "@site/src/utils/theme-react";

export const FluentLayout = (props) => {
  return <FluentWrapper {...props} />;
};

const FluentWrapper = ({ children, style }) => {
  const theme = useTheme();
  return (
    <FluentProvider style={style} theme={theme === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
