import PlaygroundManifest from "@typespec/playground/manifest";
import { renderReactPlayground } from "@typespec/playground/react";
import { SwaggerUIViewer } from "@typespec/playground/react/viewers";
import "@typespec/playground/style.css";
import "./style.css";

await renderReactPlayground({
  ...PlaygroundManifest,
  emitterViewers: {
    "@typespec/openapi3": [SwaggerUIViewer],
  },
  importConfig: {
    useShim: true,
  },
});
