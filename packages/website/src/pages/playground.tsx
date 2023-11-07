import BrowserOnly from "@docusaurus/BrowserOnly";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import Layout from "@theme/Layout";
import "@typespec/playground/style.css";
import { useEffect, useState } from "react";

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

async function createPlaygroundComponent() {
  // Need to import dynamically to avoid SSR issues due to monaco editor referencing navigator.
  const { createReactPlayground } = await import("@typespec/playground/react");
  const { default: samples } = await import("@typespec/playground-website/samples");
  const { SwaggerUIViewer } = await import("@typespec/playground/react/viewers");
  return createReactPlayground({
    libraries,
    defaultEmitter,
    samples,
    emitterViewers: {
      "@typespec/openapi3": [SwaggerUIViewer],
    },
    importConfig: { useShim: true },
  });
}
