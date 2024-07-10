import { MANIFEST } from "@typespec/compiler";
import { registerMonacoDefaultWorkersForVite } from "@typespec/playground";
import PlaygroundManifest from "@typespec/playground/manifest";
import {
  Footer,
  FooterItem,
  FooterVersionItem,
  renderReactPlayground,
} from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import "@typespec/playground/styles.css";
import samples from "../samples/dist/samples.js";
import { ImportToolbarButton } from "./import-openapi3.js";
import "./style.css";

registerMonacoDefaultWorkersForVite();

declare const __PR__: string | undefined;
declare const __COMMIT_HASH__: string | undefined;

const commit = typeof __COMMIT_HASH__ !== "undefined" ? __COMMIT_HASH__ : undefined;
const pr = typeof __PR__ !== "undefined" ? __PR__ : undefined;
const PlaygroundFooter = () => {
  const prItem = pr ? (
    <FooterItem link={`https://github.com/microsoft/typespec/pull/${pr}`}>
      <span>PR </span>
      <span>{pr}</span>
    </FooterItem>
  ) : (
    <></>
  );

  return (
    <Footer className={pr && "pr-footer"}>
      {prItem}
      <FooterVersionItem />
      <FooterItem link={`https://github.com/microsoft/typespec/commit/${commit}`}>
        <span>Commit </span>
        <span>{MANIFEST.commit.slice(0, 6)}</span>
      </FooterItem>
    </Footer>
  );
};

await renderReactPlayground({
  ...PlaygroundManifest,
  samples,
  emitterViewers: {
    "@typespec/openapi3": [SwaggerUIViewer],
  },
  importConfig: {
    useShim: true,
  },
  footer: <PlaygroundFooter />,
  commandBarButtons: <ImportToolbarButton />,
  onFileBug: () => {
    const bodyPayload = encodeURIComponent(`\n\n\n[Playground Link](${document.location.href})`);
    const url = `https://github.com/microsoft/typespec/issues/new?body=${bodyPayload}`;
    window.open(url, "_blank");
  },
});
