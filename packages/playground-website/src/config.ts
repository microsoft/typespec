import samples from "../samples/dist/samples.js";

export const TypeSpecPlaygroundConfig = {
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/graphql",
    "@typespec/protobuf",
    "@typespec/streams",
    "@typespec/events",
    "@typespec/sse",
    "@typespec/xml",
    "@typespec/http-client-js",
    "@typespec/http-server-csharp",
    "@typespec/http-server-js",
  ],
  deferredEmitters: ["@typespec/http-server-csharp"],
  samples,
} as const;
