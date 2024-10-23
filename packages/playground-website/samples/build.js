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
  },
  "Discriminated unions": {
    filename: "samples/unions.tsp",
    preferredEmitter: "@typespec/openapi3",
  },
  "HTTP service": {
    filename: "samples/http.tsp",
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
  },
  "REST framework": {
    filename: "samples/rest.tsp",
    preferredEmitter: "@typespec/openapi3",
    compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
  },
  "Protobuf Kiosk": {
    filename: "samples/kiosk.tsp",
    preferredEmitter: "@typespec/protobuf",
  },
  "Json Schema": {
    filename: "samples/json-schema.tsp",
    preferredEmitter: "@typespec/json-schema",
  },
});
