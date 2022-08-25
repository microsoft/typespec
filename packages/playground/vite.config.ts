import { definePlaygroundViteConfig } from "./src/build-utils";

export default definePlaygroundViteConfig({
  defaultEmitter: "@cadl-lang/openapi3",
  libraries: [
    "@cadl-lang/compiler",
    "@cadl-lang/rest",
    "@cadl-lang/openapi",
    "@cadl-lang/versioning",
    "@cadl-lang/openapi3",
  ],
  samples: {
    "API versioning": "samples/versioning.cadl",
    "Discriminated unions": "samples/unions.cadl",
    "Http service": "samples/http.cadl",
    "REST framework": "samples/rest.cadl",
  },
  enableSwaggerUI: true,
});
