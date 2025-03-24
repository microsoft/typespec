import {
  createSnipperExtractor,
  createTypeScriptExtractorConfig,
  executeScenarios,
} from "@typespec/emitter-framework/testing";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { HttpClientJavascriptEmitterTestLibrary } from "../src/testing/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tsExtractorConfig = createTypeScriptExtractorConfig();
const snipperExtractor = createSnipperExtractor(tsExtractorConfig);

// Construct the test path relative to this file.
const scenarioPath = join(__dirname, "scenarios");
const outputPath = join("tsp-output", "@typespec", "http-client-js");

await executeScenarios(
  HttpClientJavascriptEmitterTestLibrary,
  tsExtractorConfig,
  scenarioPath,
  outputPath,
  snipperExtractor,
);
