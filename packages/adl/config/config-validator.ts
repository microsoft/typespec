import Ajv, { ErrorObject } from "ajv";
import { DiagnosticError } from "../compiler/diagnostics.js";
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
   * @returns
   */
  public validateConfig(config: ADLRawConfig, file?: SourceFile) {
    this.validateSchema(config, file);
  }

  private validateSchema(config: ADLRawConfig, file?: SourceFile) {
    const validate = this.ajv.compile(ADLConfigJsonSchema);
    const valid = validate(config);

    if (!valid && validate.errors) {
      throw new DiagnosticError(
        validate.errors.map((error) => {
          return ajvErrorToDiagnostic(error, file);
        })
      );
    }
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
