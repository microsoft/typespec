import Ajv, { ErrorObject } from "ajv";
import { compilerAssert, DiagnosticHandler } from "../compiler/diagnostics.js";
import { Diagnostic, SourceFile } from "../compiler/types.js";
import { CadlConfigJsonSchema } from "./config-schema.js";
import { CadlRawConfig } from "./types.js";

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
  public validateConfig(
    config: CadlRawConfig,
    file: SourceFile,
    reportDiagnostic: DiagnosticHandler
  ): void {
    const validate = this.ajv.compile(CadlConfigJsonSchema);
    const valid = validate(config);
    compilerAssert(
      !valid || !validate.errors,
      "There should be errors reported if the config file is not valid."
    );

    for (const error of validate.errors ?? []) {
      const diagnostic = ajvErrorToDiagnostic(error, file);
      reportDiagnostic(diagnostic);
    }
  }
}

const IGNORED_AJV_PARAMS = new Set(["type", "errors"]);

function ajvErrorToDiagnostic(error: ErrorObject, file: SourceFile): Diagnostic {
  const messageLines = [`Schema violation: ${error.message} (${error.instancePath || "/"})`];
  for (const [name, value] of Object.entries(error.params).filter(
    ([name]) => !IGNORED_AJV_PARAMS.has(name)
  )) {
    const formattedValue = Array.isArray(value) ? [...new Set(value)].join(", ") : value;
    messageLines.push(`  ${name}: ${formattedValue}`);
  }

  const message = messageLines.join("\n");
  return { message, severity: "error", file };
}
