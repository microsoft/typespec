import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import Layout from "@theme/Layout";
import style from "./layouts.module.css";

export const FluentLayout = ({ children }) => {
  return (
    <Layout>
      <FluentWrapper>{children}</FluentWrapper>
    </Layout>
  );
};

export const ShowcaseLayout = ({ children }) => {
  return (
    // Need to do this because fluentui can't do SSR simply...
    <BrowserOnly
      children={() => (
        <FluentLayout>
          <div className={style["showcase-layout"]}>{children}</div>
        </FluentLayout>
      )}
    />
  );
};

const FluentWrapper = ({ children }) => {
  const { colorMode } = useColorMode();

  return (
    <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
      {children}
    </FluentProvider>
  );
};
