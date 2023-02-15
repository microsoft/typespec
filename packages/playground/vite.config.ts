import { visualizer } from "rollup-plugin-visualizer";
import { definePlaygroundViteConfig } from "./src/build-utils/index.js";

const config = definePlaygroundViteConfig({
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
  ],
  samples: {
    "API versioning": "samples/versioning.tsp",
    "Discriminated unions": "samples/unions.tsp",
    "HTTP service": "samples/http.tsp",
    "REST framework": "samples/rest.tsp",
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
