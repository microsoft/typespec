import PlaygroundManifest from "@typespec/playground/manifest";
import { renderReactPlayground } from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import samples from "../samples/samples.js";

import "@typespec/playground/style.css";
import "./style.css";

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
