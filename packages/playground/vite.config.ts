import { visualizer } from "rollup-plugin-visualizer";
import { definePlaygroundViteConfig } from "./src/build-utils/index.js";

const config = definePlaygroundViteConfig({
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/protobuf",
  ],
  samples: {
    "API versioning": {
      fileName: "samples/versioning.tsp",
    },
    "Discriminated unions": {
      fileName: "samples/unions.tsp",
    },
    "HTTP service": { fileName: "samples/http.tsp" },
    "REST framework": { fileName: "samples/rest.tsp" },
    Protobuf: {
      fileName: "samples/protobuf.tsp",
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
