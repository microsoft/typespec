import { visualizer } from "rollup-plugin-visualizer";
import { definePlaygroundViteConfig } from "./src/build-utils/index.js";

const config = definePlaygroundViteConfig({
  defaultEmitter: "@cadl-lang/http-low-level",
  libraries: [
    "@cadl-lang/compiler",
    "@cadl-lang/rest",
    "@cadl-lang/openapi",
    "@cadl-lang/versioning",
    "@cadl-lang/openapi3",
    "@cadl-lang/http-low-level",
  ],
  samples: {
    "API versioning": "samples/versioning.cadl",
    "Discriminated unions": "samples/unions.cadl",
    "HTTP service": "samples/http.cadl",
    "REST framework": "samples/rest.cadl",
  },
  enableSwaggerUI: true,
});

config.plugins!.push(
  visualizer({
    filename: "temp/stats.html",
  }) as any
);

export default config;
