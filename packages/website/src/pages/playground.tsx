import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import Layout from "@theme/Layout";
import { useEffect, useState } from "react";

import "@typespec/playground/style.css";

export default function PlaygroundPage() {
  return (
    <BrowserOnly>
      {() => {
        return (
          <FluentLayout>
            <div style={{ height: "calc(100vh - var(--ifm-navbar-height))", width: "100%" }}>
              <AsyncPlayground />
            </div>
          </FluentLayout>
        );
      }}
    </BrowserOnly>
  );
}

export const FluentLayout = ({ children }) => {
  return (
    <Layout>
      <FluentWrapper>{children}</FluentWrapper>
    </Layout>
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

const AsyncPlayground = () => {
  const [mod, setMod] = useState<
    typeof import("../components/playground-component/playground") | null
  >(null);
  useEffect(() => {
    import("../components/playground-component/playground")
      .then((x) => setMod(x))
      .catch((e) => {
        throw e;
      });
  }, []);

  return mod && <mod.WebsitePlayground />;
};
