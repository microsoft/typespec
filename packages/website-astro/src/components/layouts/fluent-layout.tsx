// import BrowserOnly from "@docusaurus/BrowserOnly";
// import { useColorMode } from "@docusaurus/theme-common";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
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
  // const { colorMode } = useColorMode();
  const colorMode: string = "light"; // TODO: FIX THIS
  return (
    <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
