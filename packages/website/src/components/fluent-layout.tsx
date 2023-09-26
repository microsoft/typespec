import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import {
  FluentProvider,
  makeStyles,
  tokens,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import Layout from "@theme/Layout";

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
    <BrowserOnly>
      {() => (
        <FluentProvider theme={colorMode === "dark" ? webDarkTheme : webLightTheme}>
          <FluentContainer>{children}</FluentContainer>
        </FluentProvider>
      )}
    </BrowserOnly>
  );
};

const useFluentStyles = makeStyles({
  bg: { backgroundColor: tokens.colorNeutralBackground3 },
});

const FluentContainer = ({ children }) => {
  const fluentStyles = useFluentStyles();
  return <div className={fluentStyles.bg}> {children}</div>;
};
