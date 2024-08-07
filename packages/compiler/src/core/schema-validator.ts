import { Ajv, type ErrorObject, type Options } from "ajv";
import { getLocationInYamlScript } from "../yaml/diagnostics.js";
import { YamlPathTarget, YamlScript } from "../yaml/types.js";
import { compilerAssert } from "./diagnostics.js";
import { createDiagnostic } from "./messages.js";
import { isPathAbsolute } from "./path-utils.js";
import {
  Diagnostic,
  DiagnosticTarget,
  JSONSchemaType,
  JSONSchemaValidator,
  NoTarget,
  SourceFile,
} from "./types.js";

export interface JSONSchemaValidatorOptions {
  coerceTypes?: boolean;
  strict?: boolean;
}

function absolutePathStatus(path: string): "valid" | "not-absolute" | "windows-style" {
  if (path.startsWith(".") || !isPathAbsolute(path)) {
    return "not-absolute";
  }
  if (path.includes("\\")) {
    return "windows-style";
  }
  return "valid";
}

export function createJSONSchemaValidator<T>(
  schema: JSONSchemaType<T>,
  options: JSONSchemaValidatorOptions = { strict: true }
): JSONSchemaValidator {
  const ajv = new Ajv({
    strict: options.strict,
    coerceTypes: options.coerceTypes,
    allErrors: true,
  } satisfies Options);

  ajv.addFormat("absolute-path", {
    type: "string",
    validate: (path) => absolutePathStatus(path) === "valid",
  });
  return { validate };

  function validate(
    config: unknown,
    target: YamlScript | YamlPathTarget | SourceFile | typeof NoTarget
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
  target: YamlScript | YamlPathTarget | SourceFile | typeof NoTarget
): Diagnostic {
  const tspTarget = resolveTarget(error, target);
  if (error.params.format === "absolute-path") {
    const value = getErrorValue(obj, error) as any;
    const status = absolutePathStatus(value);
    if (status === "windows-style") {
      return createDiagnostic({
        code: "path-unix-style",
        format: { path: value },
        target: tspTarget,
      });
    } else {
      return createDiagnostic({
        code: "config-path-absolute",
        format: { path: value },
        target: tspTarget,
      });
    }
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

function resolveTarget(
  error: ErrorObject<string, Record<string, any>, unknown>,
  target: YamlScript | YamlPathTarget | SourceFile | typeof NoTarget
): DiagnosticTarget | typeof NoTarget {
  if (target === NoTarget) {
    return NoTarget;
  }
  if (!("kind" in target)) {
    return { file: target, pos: 0, end: 0 };
  }
  switch (target.kind) {
    case "yaml-script":
      return getLocationInYamlScript(target, getErrorPath(error), "key");
    case "path-target":
      return getLocationInYamlScript(
        target.script,
        [...target.path, ...getErrorPath(error)],
        "key"
      );
  }
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
