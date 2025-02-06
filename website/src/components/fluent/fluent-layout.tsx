import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useTheme } from "@typespec/astro-utils/utils/theme-react";
import type { CSSProperties, ReactNode } from "react";

export const FluentLayout = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => {
  const theme = useTheme();
  return (
    <FluentProvider style={style} theme={theme === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
