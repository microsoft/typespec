import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import { compilerAssert } from "./diagnostics.js";
import { Diagnostic, SourceFile } from "./types.js";

export class SchemaValidator<T> {
  private ajv = new Ajv({
    strict: true,
  });

  public constructor(private schema: JSONSchemaType<T>) {}

  /**
   * Validate the config is valid
   * @param config Configuration
   * @param file @optional file for errors tracing.
   * @returns Validation
   */
  public validate(config: unknown, file: SourceFile): Diagnostic[] {
    const validate = this.ajv.compile(this.schema);
    const valid = validate(config);
    compilerAssert(
      !valid || !validate.errors,
      "There should be errors reported if the schema is not valid."
    );

    const diagnostics = [];
    for (const error of validate.errors ?? []) {
      const diagnostic = ajvErrorToDiagnostic(error, file);
      diagnostics.push(diagnostic);
    }

    return diagnostics;
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
  return { code: "invalid-schema", message, severity: "error", target: { file, pos: 0, end: 0 } };
}
