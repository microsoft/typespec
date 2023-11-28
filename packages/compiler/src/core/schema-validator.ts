import Ajv, { ErrorObject, Options } from "ajv";
import { getLocationInYamlScript } from "../yaml/diagnostics.js";
import { YamlScript } from "../yaml/types.js";
import { compilerAssert } from "./diagnostics.js";
import { createDiagnostic } from "./messages.js";
import { isPathAbsolute } from "./path-utils.js";
import { Diagnostic, JSONSchemaType, JSONSchemaValidator, NoTarget, SourceFile } from "./types.js";

export interface JSONSchemaValidatorOptions {
  coerceTypes?: boolean;
  strict?: boolean;
}

export function createJSONSchemaValidator<T>(
  schema: JSONSchemaType<T>,
  options: JSONSchemaValidatorOptions = { strict: true }
): JSONSchemaValidator {
  const ajv: import("ajv").default = new (Ajv as any)({
    strict: options.strict,
    coerceTypes: options.coerceTypes,
    allErrors: true,
  } satisfies Options);

  ajv.addFormat("absolute-path", {
    type: "string",
    validate: (path) => {
      return !path.startsWith(".") && isPathAbsolute(path);
    },
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
      const diagnostic = ajvErrorToDiagnostic(config, error, target);
      diagnostics.push(diagnostic);
    }

    return diagnostics;
  }
}

const IGNORED_AJV_PARAMS = new Set(["type", "errors"]);

function ajvErrorToDiagnostic(
  obj: unknown,
  error: ErrorObject<string, Record<string, any>, unknown>,
  target: YamlScript | SourceFile | typeof NoTarget
): Diagnostic {
  const tspTarget =
    target === NoTarget
      ? target
      : "kind" in target
        ? getLocationInYamlScript(target, getErrorPath(error), "key")
        : { file: target, pos: 0, end: 0 };
  if (error.params.format === "absolute-path") {
    return createDiagnostic({
      code: "config-path-absolute",
      format: { path: getErrorValue(obj, error) as any },
      target: tspTarget,
    });
  }

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
    target: tspTarget,
  };
}

function getErrorPath(error: ErrorObject<string, Record<string, any>, unknown>): string[] {
  const instancePath = parseJsonPointer(error.instancePath);
  switch (error.keyword) {
    case "additionalProperties":
      return [...instancePath, error.params.additionalProperty];
    default:
      return instancePath;
  }
}
function getErrorValue(
  obj: any,
  error: ErrorObject<string, Record<string, any>, unknown>
): unknown {
  const path = getErrorPath(error);
  let current = obj;
  for (const segment of path) {
    current = current[segment];
  }
  return current;
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
