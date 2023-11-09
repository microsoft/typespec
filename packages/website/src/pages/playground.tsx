import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import Layout from "@theme/Layout";
import { useEffect, useMemo, useState } from "react";

import { PlaygroundSample } from "@typespec/playground";
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
  const { colorMode } = useColorMode();

  const [mod, setMod] = useState<PlaygroundModules | null>(null);
  useEffect(() => {
    resolvePlaygroundModules()
      .then((x) => setMod(x))
      .catch((e) => {
        throw e;
      });
  }, []);

  const editorOptions = useMemo(() => {
    return { theme: colorMode === "dark" ? "typespec-dark" : "typespec" };
  }, [colorMode]);

  return (
    mod && (
      <mod.StandalonePlayground
        libraries={libraries}
        defaultEmitter={defaultEmitter}
        samples={mod.samples}
        emitterViewers={{ "@typespec/openapi3": [mod.SwaggerUIViewer] }}
        importConfig={{ useShim: true }}
        editorOptions={editorOptions}
      />
    )
  );
};

interface PlaygroundModules {
  StandalonePlayground: typeof import("@typespec/playground/react").StandalonePlayground;
  samples: Record<string, PlaygroundSample>;
  SwaggerUIViewer: typeof import("@typespec/playground/react/viewers").SwaggerUIViewer;
}
async function resolvePlaygroundModules(): Promise<PlaygroundModules> {
  // Need to import dynamically to avoid SSR issues due to monaco editor referencing navigator.
  const { StandalonePlayground } = await import("@typespec/playground/react");
  const { default: samples } = await import("@typespec/playground-website/samples");
  const { SwaggerUIViewer } = await import("@typespec/playground/react/viewers");

  return { StandalonePlayground, samples, SwaggerUIViewer } as const;
}
