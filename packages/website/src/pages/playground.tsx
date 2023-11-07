import BrowserOnly from "@docusaurus/BrowserOnly";
import Layout from "@theme/Layout";
import { useEffect, useState } from "react";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import "@typespec/playground/style.css";

const libraries = [
  "@typespec/compiler",
  "@typespec/http",
  "@typespec/rest",
  "@typespec/openapi",
  "@typespec/versioning",
  "@typespec/openapi3",
  "@typespec/json-schema",
  "@typespec/protobuf",
];
const defaultEmitter = "@typespec/openapi3";

async function createPlaygroundComponent() {
  const { createReactPlayground } = await import("@typespec/playground/react");
  return createReactPlayground({ libraries, defaultEmitter, importConfig: { useShim: true } });
}

export default function PlaygroundPage() {
  return (
    <BrowserOnly>
      {() => {
        return (
          <Layout>
            <FluentProvider
              theme={webLightTheme}
              style={{ height: "calc(100vh - var(--ifm-navbar-height))", width: "100%" }}
            >
              <AsyncPlayground />
            </FluentProvider>
          </Layout>
        );
      }}
    </BrowserOnly>
  );
}

const AsyncPlayground = () => {
  const [mod, setMod] = useState<any | null>(null);
  useEffect(() => {
    createPlaygroundComponent()
      .then((x) => setMod(x))
      .catch((e) => {
        throw e;
      });
  }, []);

  return mod;
};
