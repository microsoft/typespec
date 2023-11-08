import httpSample from "./http.tsp?raw";
import jsonSchemaSample from "./json-schema.tsp?raw";
import protobufSample from "./kiosk.tsp?raw";
import restSample from "./rest.tsp?raw";
import unionSample from "./unions.tsp?raw";
import versioningSamples from "./versioning.tsp?raw";

// @ts-check

/** @type {Record<string, import("@typespec/playground").PlaygroundSample>} */
const samples = {
  "API versioning": {
    filename: "versioning.tsp",
    content: versioningSamples,
    preferredEmitter: "@typespec/openapi3",
  },
  "Discriminated unions": {
    filename: "unions.tsp",
    content: unionSample,
    preferredEmitter: "@typespec/openapi3",
  },
  "HTTP service": {
    filename: "http.tsp",
    content: httpSample,
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
  },
  "REST framework": {
    filename: "rest.tsp",
    content: restSample,
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
  },
  "Protobuf Kiosk": {
    filename: "kiosk.tsp",
    content: protobufSample,
    preferredEmitter: "@typespec/protobuf",
  },
  "Json Schema": {
    filename: "json-schema.tsp",
    content: jsonSchemaSample,
    preferredEmitter: "@typespec/json-schema",
  },
};

export default samples;
