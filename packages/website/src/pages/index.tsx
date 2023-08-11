import { useColorMode } from "@docusaurus/theme-common";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import Layout from "@theme/Layout";
import { useEffect, useState } from "react";
import { HomeContent } from "../components/homepage/homepage";

export default function Home() {
  return (
    <Layout>
      <HomeWithFluent />
    </Layout>
  );
}

const HomeWithFluent = () => {
  const { colorMode } = useColorMode();
  const [_, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(true); // Doing this to force the theme to update.
  }, []);
  return (
    <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
      <HomeContent />
    </FluentProvider>
  );
};
