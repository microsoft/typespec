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
      filename: "samples/versioning.tsp",
      preferredEmitter: "@typespec/openapi3",
    },
    "Discriminated unions": {
      filename: "samples/unions.tsp",
      preferredEmitter: "@typespec/openapi3",
    },
    "HTTP service": { filename: "samples/http.tsp", preferredEmitter: "@typespec/openapi3" },
    "REST framework": { filename: "samples/rest.tsp", preferredEmitter: "@typespec/openapi3" },
    "Protobuf Kiosk": {
      filename: "samples/kiosk.tsp",
      preferredEmitter: "@typespec/protobuf",
    },
    "Json Schema": {
      fileName: "samples/json-schema.tsp",
      preferredEmitter: "@typespec/json-schema",
    },
  },
  enableSwaggerUI: true,
  links: {
    githubIssueUrl: `https://github.com/microsoft/typespec/issues/new`,
    documentationUrl: "https://microsoft.github.io/typespec",
  },
});

config.plugins!.push(
  visualizer({
    filename: "temp/stats.html",
  }) as any
);

export default config;
