import Ajv, { ErrorObject } from "ajv";
import { compilerAssert } from "../compiler/diagnostics.js";
import { Diagnostic, SourceFile } from "../compiler/types.js";
import { ADLConfigJsonSchema } from "./config-schema.js";
import { ADLRawConfig } from "./types.js";

export class ConfigValidator {
  private ajv = new Ajv({
    strict: true,
  });

  /**
   * Validate the config is valid
   * @param config Configuration
   * @param file @optional file for errors tracing.
   * @returns Validation
   */
  public validateConfig(config: ADLRawConfig, file?: SourceFile): Diagnostic[] {
    const validate = this.ajv.compile(ADLConfigJsonSchema);
    const valid = validate(config);
    compilerAssert(
      !valid || !validate.errors,
      "There should be errors reported if the config file is not valid."
    );
    return validate.errors?.map((e) => ajvErrorToDiagnostic(e, file)) ?? [];
  }
}

const IGNORED_AJV_PARAMS = new Set(["type", "errors"]);

function ajvErrorToDiagnostic(error: ErrorObject, file?: SourceFile): Diagnostic {
  const messageLines = [`Schema violation: ${error.message} (${error.instancePath || "/"})`];
  for (const [name, value] of Object.entries(error.params).filter(
    ([name]) => !IGNORED_AJV_PARAMS.has(name)
  )) {
    const formattedValue = Array.isArray(value) ? [...new Set(value)].join(", ") : value;
    messageLines.push(`  ${name}: ${formattedValue}`);
  }

  return {
    severity: "error",
    message: messageLines.join("\n"),
    ...(file && { file }),
  };
}
