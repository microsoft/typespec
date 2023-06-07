import { definePlaygroundViteConfig } from "@typespec/playground/vite";
import { visualizer } from "rollup-plugin-visualizer";

const config = definePlaygroundViteConfig({
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/protobuf",
  ],
  samples: {
    "API versioning": {
      fileName: "samples/versioning.tsp",
      preferredEmitter: "@typespec/openapi3",
    },
    "Discriminated unions": {
      fileName: "samples/unions.tsp",
      preferredEmitter: "@typespec/openapi3",
    },
    "HTTP service": { fileName: "samples/http.tsp", preferredEmitter: "@typespec/openapi3" },
    "REST framework": { fileName: "samples/rest.tsp", preferredEmitter: "@typespec/openapi3" },
    "Protobuf Kiosk": {
      fileName: "samples/kiosk.tsp",
      preferredEmitter: "@typespec/protobuf",
    },
  },
  enableSwaggerUI: true,
  links: {
    newIssue: `https://github.com/microsoft/typespec/issues/new`,
    documentation: "https://microsoft.github.io/typespec",
  },
});

config.plugins!.push(
  visualizer({
    filename: "temp/stats.html",
  }) as any
);

export default config;
