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
import type { BrowserHost } from "@typespec/playground";
import samples from "@typespec/playground-website/samples";
import { Footer, FooterItem, StandalonePlayground } from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import "@typespec/playground/style.css";
import { ChangeEvent, FunctionComponent, useMemo } from "react";

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

export const WebsitePlayground = () => {
  const { colorMode } = useColorMode();

  const editorOptions = useMemo(() => {
    return { theme: colorMode === "dark" ? "typespec-dark" : "typespec" };
  }, [colorMode]);

  return (
    <StandalonePlayground
      libraries={libraries}
      defaultEmitter={defaultEmitter}
      samples={samples}
      emitterViewers={{ "@typespec/openapi3": [SwaggerUIViewer] }}
      importConfig={{ useShim: true }}
      editorOptions={editorOptions}
      footer={({ host }) => <PlaygroundFooter host={host} />}
    />
  );
};

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

interface VersionData {
  latest: string;
  requested: string;
  resolved: string;
}
const versionData: VersionData = (window as any).TSP_VERSION_DATA;
const versions = ["0.49.x", "0.50.x"];
const VersionsPopup: FunctionComponent<PlaygroundFooterProps> = ({ host }) => {
  return (
    <div style={{ maxWidth: "400px" }}>
      <div>
        <Title3>Select release</Title3>
        <Select value={versionData.resolved} onChange={changeVersion}>
          {versions.map((x) => (
            <option key={x} value={x}>
              {x} {x === versionData.latest ? "(latest)" : ""}
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
  const newUrl = window.location.pathname + "?" + query.toString();
  window.location.replace(newUrl);
}
