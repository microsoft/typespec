import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useColorMode } from "../docusaurus/core/theme-common";
import style from "./layouts.module.css";

export const FluentLayout = ({ children }) => {
  return <FluentWrapper>{children}</FluentWrapper>;
};

export const ShowcaseLayout = ({ children }) => {
  return (
    // Need to do this because fluentui can't do SSR simply...
    <FluentLayout>
      <div className={style["showcase-layout"]}>{children}</div>
    </FluentLayout>
  );
};

const FluentWrapper = ({ children }) => {
  const { colorMode } = useColorMode();
  console.log("COlor mode change", colorMode);
  return (
    <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
