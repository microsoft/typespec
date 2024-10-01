import versions from "@site/playground-versions.json";
import { useColorMode } from "@site/src/components/docusaurus/core/theme-common";
import { ImportToolbarButton, TypeSpecPlaygroundConfig } from "@typespec/playground-website";
import {
  Footer,
  FooterVersionItem,
  StandalonePlayground,
  type VersionSelectorProps,
  type VersionSelectorVersion,
} from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import { type FunctionComponent, useMemo } from "react";
import { type VersionData } from "./import-map";
import { LoadingSpinner } from "./loading-spinner";

import "@typespec/playground-website/style.css";
import "@typespec/playground/styles.css";

export interface WebsitePlaygroundProps {
  versionData: VersionData;
}

export const WebsitePlayground = ({ versionData }: WebsitePlaygroundProps) => {
  const { colorMode } = useColorMode();

  const editorOptions = useMemo(() => {
    return { theme: colorMode === "dark" ? "typespec-dark" : "typespec" };
  }, [colorMode]);

  return (
    <StandalonePlayground
      {...TypeSpecPlaygroundConfig}
      emitterViewers={{ "@typespec/openapi3": [SwaggerUIViewer] }}
      importConfig={{ useShim: true }}
      editorOptions={editorOptions}
      footer={<PlaygroundFooter versionData={versionData} />}
      fallback={<LoadingSpinner message="Loading libraries..." />}
      onFileBug={fileBugToGithub}
      commandBarButtons={<ImportToolbarButton />}
    />
  );
};

const fileBugToGithub = () => {
  const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
  const url = `https://github.com/microsoft/typespec/issues/new?body=${bodyPayload}`;
  window.open(url, "_blank");
};

interface PlaygroundFooterProps {
  versionData: VersionData;
}

const PlaygroundFooter: FunctionComponent<PlaygroundFooterProps> = ({ versionData }) => {
  const versionSelectorProps: VersionSelectorProps = useMemo(() => {
    return {
      versions: versions.map((x) => ({ name: x, label: x })),
      selected: versionData.resolved,
      latest: versionData.latest,
      onChange: changeVersion,
    };
  }, [versionData.resolved, versionData.latest]);
  return (
    <Footer>
      <FooterVersionItem versionSelector={versionSelectorProps} />
    </Footer>
  );
};

function changeVersion(version: VersionSelectorVersion): void {
  const query = new URLSearchParams(window.location.search);
  query.set("version", version.name);
  const newUrl = window.location.pathname + "?" + query.toString();
  window.location.replace(newUrl);
}
