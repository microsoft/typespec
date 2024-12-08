import { strictEqual } from "assert";
import { assert, beforeAll, describe, it } from "vitest";
import { InitTemplateSchema } from "../../../compiler/dist/src/init/init-template.js";
import { ConsoleLogLogger } from "../../src/log/console-log-listener.js";
import logger from "../../src/log/logger.js";

beforeAll(() => {
  // we don't have vscode in test env. Hook console log listener
  logger.registerLogListener("test", new ConsoleLogLogger());
});

describe("Hello world test", () => {
  it("should pass", () => {
    assert(true, "test sample");
  });

  it("Check inputs type supported in InitTemplate", () => {
    // Add this test to ensure we won't forget to add the support in VS/VSCode extension of typespec
    // when we add more input types support in InitTemplate.inputs
    const schema = InitTemplateSchema;
    strictEqual(schema.properties.inputs.additionalProperties.properties.type.enum.length, 1);
    strictEqual(schema.properties.inputs.additionalProperties.properties.type.enum[0], "text");
  });
});
