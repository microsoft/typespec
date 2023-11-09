import { registerMonacoDefaultWorkersForVite } from "@typespec/playground";
import PlaygroundManifest from "@typespec/playground/manifest";
import { renderReactPlayground } from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import samples from "../samples/dist/samples.js";

import "@typespec/playground/style.css";
import "./style.css";

registerMonacoDefaultWorkersForVite();

await renderReactPlayground({
  ...PlaygroundManifest,
  samples,
  emitterViewers: {
    "@typespec/openapi3": [SwaggerUIViewer],
  },
  importConfig: {
    useShim: true,
  },
});
