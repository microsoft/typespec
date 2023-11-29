import { registerMonacoDefaultWorkersForVite } from "@typespec/playground";
import PlaygroundManifest from "@typespec/playground/manifest";
import {
  Footer,
  FooterItem,
  FooterVersionItem,
  renderReactPlayground,
} from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import samples from "../samples/dist/samples.js";

import { MANIFEST } from "@typespec/compiler";
import "@typespec/playground/style.css";
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
});
