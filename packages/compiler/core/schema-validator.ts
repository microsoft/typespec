import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import { compilerAssert } from "./diagnostics.js";
import { NoTarget } from "./index.js";
import { Diagnostic, SourceFile } from "./types.js";

export interface JSONSchemaValidatorOptions {
  coerceTypes?: boolean;
}

export interface JSONSchemaValidator {
  /**
   * Validate the config is valid
   * @param config Configuration
   * @param target @optional file for errors tracing.
   * @returns Validation
   */
  validate(config: unknown, target: SourceFile | typeof NoTarget): Diagnostic[];
}

export function createJSONSchemaValidator<T>(
  schema: JSONSchemaType<T>,
  options: JSONSchemaValidatorOptions = {}
) {
  const ajv = new Ajv({
    strict: true,
    coerceTypes: options.coerceTypes,
  });

  return { validate };

  function validate(config: unknown, target: SourceFile | typeof NoTarget): Diagnostic[] {
    const validate = ajv.compile(schema);
    const valid = validate(config);
    compilerAssert(
      !valid || !validate.errors,
      "There should be errors reported if the schema is not valid."
    );

    const diagnostics = [];
    for (const error of validate.errors ?? []) {
      const diagnostic = ajvErrorToDiagnostic(error, target);
      diagnostics.push(diagnostic);
    }

    return diagnostics;
  }
}

const IGNORED_AJV_PARAMS = new Set(["type", "errors"]);

function ajvErrorToDiagnostic(
  error: ErrorObject,
  target: SourceFile | typeof NoTarget
): Diagnostic {
  const messageLines = [`Schema violation: ${error.message} (${error.instancePath || "/"})`];
  for (const [name, value] of Object.entries(error.params).filter(
    ([name]) => !IGNORED_AJV_PARAMS.has(name)
  )) {
    const formattedValue = Array.isArray(value) ? [...new Set(value)].join(", ") : value;
    messageLines.push(`  ${name}: ${formattedValue}`);
  }

  const message = messageLines.join("\n");
  return {
    code: "invalid-schema",
    message,
    severity: "error",
    target: target === NoTarget ? target : { file: target, pos: 0, end: 0 },
  };
}
