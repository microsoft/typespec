import BrowserOnly from "@docusaurus/BrowserOnly";
import { useColorMode } from "@docusaurus/theme-common";
import {
  FluentProvider,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Select,
  SelectOnChangeData,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title3,
  webDarkTheme,
  webLightTheme,
} from "@fluentui/react-components";
import Layout from "@theme/Layout";
import type { BrowserHost, PlaygroundSample } from "@typespec/playground";
import { ChangeEvent, FunctionComponent, useEffect, useMemo, useState } from "react";

import { Footer, FooterItem } from "@typespec/playground/react";
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
        footer={({ host }) => <PlaygroundFooter host={host} />}
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

interface PlaygroundFooterProps {
  host: BrowserHost;
}

const PlaygroundFooter: FunctionComponent<PlaygroundFooterProps> = ({ host }) => {
  return (
    <Footer>
      <FooterItem>
        <Popover>
          <PopoverTrigger disableButtonEnhancement>
            <div>
              <span>TypeSpec Version </span>
              <span>{host.compiler.MANIFEST.version}</span>
            </div>
          </PopoverTrigger>

          <PopoverSurface>
            <VersionsPopup host={host} />
          </PopoverSurface>
        </Popover>
      </FooterItem>
    </Footer>
  );
};

const columns = [
  { columnKey: "name", label: "Library" },
  { columnKey: "version", label: "Version" },
];

const selectedVersion = "0.49.x";
const versions = ["0.49.x", "0.50.x"];
const latestRelease = (window as any).TSP_LATEST_RELEASE;
const VersionsPopup: FunctionComponent<PlaygroundFooterProps> = ({ host }) => {
  return (
    <div style={{ maxWidth: "400px" }}>
      <div>
        <Title3>Select release</Title3>
        <Select value={selectedVersion} onChange={changeVersion}>
          {versions.map((x) => (
            <option key={x} value={x}>
              {x} {x === latestRelease ? "(latest)" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Title3>Loaded libraries</Title3>
        <Table size="small">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHeaderCell key={column.columnKey}>{column.label}</TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.values(host.libraries).map((item) => (
              <TableRow key={item.name}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.packageJson.version}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

function changeVersion(ev: ChangeEvent<HTMLSelectElement>, data: SelectOnChangeData): void {
  const query = new URLSearchParams(window.location.search);
  query.set("version", data.value);
  window.location.href = window.location.pathname + "?" + query.toString();
}
