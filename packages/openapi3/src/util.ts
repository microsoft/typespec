import {
  BooleanLiteral,
  getEncode,
  IntrinsicScalarName,
  isTemplateDeclaration,
  Model,
  ModelProperty,
  NumericLiteral,
  Program,
  Scalar,
  serializeValueAsJson,
  StringLiteral,
  Type,
  Value,
} from "@typespec/compiler";
import { HttpOperation, HttpProperty } from "@typespec/http";
import { createDiagnostic } from "./lib.js";
/**
 * Checks if two objects are deeply equal.
 *
 * Does not support cycles. Intended to be used only on plain data that can
 * be directly represented in JSON.
 */
export function deepEquals(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  if (Array.isArray(left)) {
    return Array.isArray(right) ? arrayEquals(left, right, deepEquals) : false;
  }
  return mapEquals(new Map(Object.entries(left)), new Map(Object.entries(right)), deepEquals);
}

export type EqualityComparer<T> = (x: T, y: T) => boolean;

/**
 * Check if two arrays have the same elements.
 *
 * @param equals Optional callback for element equality comparison.
 *               Default is to compare by identity using `===`.
 */
export function arrayEquals<T>(
  left: T[],
  right: T[],
  equals: EqualityComparer<T> = (x, y) => x === y,
): boolean {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i++) {
    if (!equals(left[i], right[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Check if two maps have the same entries.
 *
 * @param equals Optional callback for value equality comparison.
 *               Default is to compare by identity using `===`.
 */
export function mapEquals<K, V>(
  left: Map<K, V>,
  right: Map<K, V>,
  equals: EqualityComparer<V> = (x, y) => x === y,
): boolean {
  if (left === right) {
    return true;
  }
  if (left.size !== right.size) {
    return false;
  }
  for (const [key, value] of left) {
    if (!right.has(key) || !equals(value, right.get(key)!)) {
      return false;
    }
  }
  return true;
}
/**
 * Check if argument is not undefined.
 */
export function isDefined<T>(arg: T | undefined): arg is T {
  return arg !== undefined;
}

export interface SharedHttpOperation {
  kind: "shared";
  operations: HttpOperation[];
}
export function isSharedHttpOperation(
  operation: HttpOperation | SharedHttpOperation,
): operation is SharedHttpOperation {
  return (operation as SharedHttpOperation).kind === "shared";
}

export function isStdType(
  program: Program,
  type: Type,
): type is Scalar & { name: IntrinsicScalarName } {
  return program.checker.isStdType(type);
}

export function isLiteralType(type: Type): type is StringLiteral | NumericLiteral | BooleanLiteral {
  return type.kind === "Boolean" || type.kind === "String" || type.kind === "Number";
}

export function literalType(type: StringLiteral | NumericLiteral | BooleanLiteral) {
  switch (type.kind) {
    case "String":
      return "string";
    case "Number":
      return "number";
    case "Boolean":
      return "boolean";
  }
}

export function includeDerivedModel(model: Model): boolean {
  return (
    !isTemplateDeclaration(model) &&
    (model.templateMapper?.args === undefined ||
      model.templateMapper.args?.length === 0 ||
      model.derivedModels.length > 0)
  );
}

export function isScalarExtendsBytes(type: Type): boolean {
  if (type.kind !== "Scalar") {
    return false;
  }
  let current: Scalar | undefined = type;
  while (current) {
    if (current.name === "bytes") {
      return true;
    }
    current = current.baseScalar;
  }
  return false;
}

export function getDefaultValue(
  program: Program,
  defaultType: Value,
  modelProperty: ModelProperty,
): any {
  return serializeValueAsJson(program, defaultType, modelProperty);
}

export function isBytesKeptRaw(program: Program, type: Type) {
  return type.kind === "Scalar" && type.name === "bytes" && getEncode(program, type) === undefined;
}

export function ensureValidComponentFixedFieldKey(
  program: Program,
  type: Type,
  oldKey: string,
): string {
  if (isValidComponentFixedFieldKey(oldKey)) return oldKey;
  reportInvalidKey(program, type, oldKey);
  return createValidKey(oldKey);
}

function isValidComponentFixedFieldKey(key: string) {
  const validPattern = /^[a-zA-Z0-9.\-_]+$/;
  return validPattern.test(key);
}

function reportInvalidKey(program: Program, type: Type, key: string) {
  const diagnostic = createDiagnostic({
    code: "invalid-component-fixed-field-key",
    format: {
      value: key,
    },
    target: type,
  });
  return program.reportDiagnostic(diagnostic);
}

function createValidKey(invalidKey: string): string {
  return invalidKey.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export type HttpParameterProperties = Extract<
  HttpProperty,
  { kind: "header" | "query" | "path" | "cookie" }
>;

export function isHttpParameterProperty(
  httpProperty: HttpProperty,
): httpProperty is HttpParameterProperties {
  return ["header", "query", "path", "cookie"].includes(httpProperty.kind);
}
