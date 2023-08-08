import Ajv, { DefinedError } from "ajv";
import { createYamlDiagnosticTarget } from "../yaml/diagnostics.js";
import { YamlScript } from "../yaml/types.js";
import { compilerAssert } from "./diagnostics.js";
import { Diagnostic, JSONSchemaType, JSONSchemaValidator, NoTarget, SourceFile } from "./types.js";

export interface JSONSchemaValidatorOptions {
  coerceTypes?: boolean;
  strict?: boolean;
}

export function createJSONSchemaValidator<T>(
  schema: JSONSchemaType<T>,
  options: JSONSchemaValidatorOptions = { strict: true }
): JSONSchemaValidator {
  const ajv = new (Ajv as any)({
    strict: options.strict,
    coerceTypes: options.coerceTypes,
  });

  return { validate };

  function validate(
    config: unknown,
    target: YamlScript | SourceFile | typeof NoTarget
  ): Diagnostic[] {
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
  error: DefinedError,
  target: YamlScript | SourceFile | typeof NoTarget
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
    target:
      target === NoTarget
        ? target
        : "kind" in target
        ? createYamlDiagnosticTarget(target, getErrorPath(error), "key")
        : { file: target, pos: 0, end: 0 },
  };
}

function getErrorPath(error: DefinedError): string[] {
  const instancePath = parseJsonPointer(error.instancePath);
  switch (error.keyword) {
    case "additionalProperties":
      return [...instancePath, error.params.additionalProperty];
    default:
      return instancePath;
  }
}

/**
 * Converts a json pointer into a array of reference tokens
 */
export function parseJsonPointer(pointer: string): string[] {
  if (pointer === "") {
    return [];
  }
  if (pointer.charAt(0) !== "/") {
    compilerAssert(false, `Invalid JSON pointer: "${pointer}"`);
  }
  return pointer.substring(1).split(/\//).map(unescape);
}

/**
 * Unescape a reference token
 *
 * @param str
 * @returns {string}
 */
function unescape(str: string): string {
  return str.replace(/~1/g, "/").replace(/~0/g, "~");
}
