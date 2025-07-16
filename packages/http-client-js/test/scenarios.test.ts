import {
  createSnippetExtractor,
  createTypeScriptExtractorConfig,
  executeScenarios,
} from "@typespec/emitter-framework/testing";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Tester } from "./test-host.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tsExtractorConfig = await createTypeScriptExtractorConfig();
const snipperExtractor = createSnippetExtractor(tsExtractorConfig);

// Construct the test path relative to this file.
const scenarioPath = join(__dirname, "scenarios");

await executeScenarios(
  Tester.import("@typespec/http", "@typespec/rest").using("Http", "Rest"),
  tsExtractorConfig,
  scenarioPath,
  snipperExtractor,
);
