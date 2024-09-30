import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import { Diagnostic } from "../utils/diagnostic-reporter.js";

export interface SchemaValidatorOptions {
  coerceTypes?: boolean;
}
export class SchemaValidator<T> {
  private ajv: any;

  public constructor(
    private schema: JSONSchemaType<T>,
    options: SchemaValidatorOptions = {},
  ) {
    // https://github.com/ajv-validator/ajv/issues/2047
    this.ajv = new (Ajv as any)({
      strict: true,
      coerceTypes: options.coerceTypes,
    });
  }

  /**
   * Validate the config is valid
   * @param config Configuration
   * @param target @optional file for errors tracing.
   * @returns Validation
   */
  public validate(config: unknown, target: string): Diagnostic[] {
    const validate = this.ajv.compile(this.schema);
    validate(config);

    const diagnostics = [];
    for (const error of validate.errors ?? []) {
      const diagnostic = ajvErrorToDiagnostic(error, target);
      diagnostics.push(diagnostic);
    }

    return diagnostics;
  }
}

const IGNORED_AJV_PARAMS = new Set(["type", "errors"]);

function ajvErrorToDiagnostic(error: ErrorObject, target: string): Diagnostic {
  const messageLines = [`Schema violation: ${error.message} (${error.instancePath || "/"})`];
  for (const [name, value] of Object.entries(error.params).filter(
    ([name]) => !IGNORED_AJV_PARAMS.has(name),
  )) {
    const formattedValue = Array.isArray(value) ? [...new Set(value)].join(", ") : value;
    messageLines.push(`  ${name}: ${formattedValue}`);
  }

  const message = messageLines.join("\n");
  return {
    message,
    target,
  };
}
