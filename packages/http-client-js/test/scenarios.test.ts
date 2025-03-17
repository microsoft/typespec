import {
  createSnipperExtractor,
  createTypeScriptExtractorConfig,
  executeScenarios,
} from "@typespec/emitter-framework/testing";
import { join } from "path";
import { HttpClientJavascriptEmitterTestLibrary } from "../src/testing/index.js";

const tsExtractorConfig = createTypeScriptExtractorConfig();
const snipperExtractor = createSnipperExtractor(tsExtractorConfig);

await executeScenarios(
  HttpClientJavascriptEmitterTestLibrary,
  tsExtractorConfig,
  "./test/scenarios",
  join("tsp-output", "@typespec/http-client-js"),
  snipperExtractor,
);
