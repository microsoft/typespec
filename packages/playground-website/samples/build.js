// @ts-check
import { buildSamples_experimental } from "@typespec/playground/tooling";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");

await buildSamples_experimental(packageRoot, resolve(__dirname, "dist/samples.ts"), {
  "API versioning": {
    filename: "samples/versioning.tsp",
    preferredEmitter: "@typespec/openapi3",
    description: "Learn how to version your API using TypeSpec's versioning library.",
  },
  "Discriminated unions": {
    filename: "samples/unions.tsp",
    preferredEmitter: "@typespec/openapi3",
    description: "Define discriminated unions for polymorphic types with different variants.",
  },
  "HTTP service": {
    filename: "samples/http.tsp",
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
    description: "Build an HTTP service with routes, parameters, and responses.",
  },
  "REST framework": {
    filename: "samples/rest.tsp",
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
    description: "Use the REST framework for resource-oriented API design patterns.",
  },
  "Protobuf Kiosk": {
    filename: "samples/kiosk.tsp",
    preferredEmitter: "@typespec/protobuf",
    description: "Generate Protocol Buffer definitions from TypeSpec models.",
  },
  "Json Schema": {
    filename: "samples/json-schema.tsp",
    preferredEmitter: "@typespec/json-schema",
    description: "Emit JSON Schema from TypeSpec type definitions.",
  },
});
