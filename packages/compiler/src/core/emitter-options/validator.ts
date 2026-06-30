import { getPattern } from "../../lib/decorators.js";
import {
  getMaxLength,
  getMaxValueAsNumeric,
  getMaxValueExclusiveAsNumeric,
  getMinLength,
  getMinValueAsNumeric,
  getMinValueExclusiveAsNumeric,
} from "../intrinsic-type-state.js";
import { numericRanges } from "../numeric-ranges.js";
import { Numeric } from "../numeric.js";
import { isPathAbsolute } from "../path-utils.js";
import { Program } from "../program.js";
import { isArrayModelType } from "../type-utils.js";
import type {
  ArrayModelType,
  Enum,
  IntrinsicScalarName,
  Model,
  ModelProperty,
  Scalar,
  Type,
  Union,
} from "../types.js";

export interface ValidationError {
  code: string;
  message: string;
  target: string[];
  /** Raw offending value, carried for codes that re-emit a specific diagnostic (e.g. `config-path-absolute`). */
  value?: string;
}

const knownScalarNames: readonly IntrinsicScalarName[] = [
  "string",
  "url",
  "boolean",
  "bytes",
  "numeric",
  "integer",
  "float",
  "decimal",
  "decimal128",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "safeint",
  "float32",
  "float64",
];

/**
 * Resolved, realm-specific references used to identify scalars by identity rather
 * than by name, so user-defined scalars that merely share a name with a built-in
 * (e.g. a user `scalar int32` or `scalar absolutePath`) are not mis-classified.
 */
interface ValidationContext {
  readonly program: Program;
  /** Identity map of the std scalar type to its intrinsic name. */
  readonly stdScalars: Map<Scalar, IntrinsicScalarName>;
  /** The `absolutePath` scalar from `@typespec/compiler/emitter`, if available in this realm. */
  readonly absolutePath: Scalar | undefined;
}

function createValidationContext(program: Program): ValidationContext {
  const stdScalars = new Map<Scalar, IntrinsicScalarName>();
  for (const name of knownScalarNames) {
    const scalar = program.checker.getStdType(name);
    if (scalar) {
      stdScalars.set(scalar, name);
    }
  }

  // Resolve the real `absolutePath` scalar by identity. It is declared in
  // `@typespec/compiler/emitter` and only present when the emitter's options file
  // imports it; when absent, no value gets absolute-path semantics.
  const [absolutePathType] = program.resolveTypeReference("absolutePath");
  const absolutePath = absolutePathType?.kind === "Scalar" ? absolutePathType : undefined;

  return { program, stdScalars, absolutePath };
}

export function validateEmitterOptions(
  program: Program,
  value: unknown,
  type: Type,
): readonly ValidationError[] {
  return validate(createValidationContext(program), value, type, undefined);
}

function validate(
  context: ValidationContext,
  value: unknown,
  type: Type,
  /** The model property (if any) that owns this value, used to read property-level constraint decorators. */
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  switch (type.kind) {
    case "Model":
      if (isArrayModelType(type)) {
        return validateArray(context, value, type);
      }
      return validateModel(context, value, type);
    case "Scalar":
      return validateScalar(context, value, type, property);
    case "Union":
      return validateUnion(context, value, type, property);
    case "Enum":
      return validateEnum(value, type);
    case "String":
    case "Number":
    case "Boolean":
      return validateLiteral(value, type.value);
  }
  return [];
}

function validateModel(
  context: ValidationContext,
  value: unknown,
  type: Model,
): readonly ValidationError[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [
      {
        code: "type-mismatch",
        message: `Expected type object`,
        target: [],
      },
    ];
  }

  const errors: ValidationError[] = [];
  const valObj = value as Record<string, unknown>;

  // `Record<T>` style models: validate every entry against the indexer value type.
  if (type.indexer && type.indexer.key.name === "string") {
    for (const [key, entryValue] of Object.entries(valObj)) {
      const entryErrors = validate(context, entryValue, type.indexer.value, undefined);
      for (const err of entryErrors) {
        errors.push({ ...err, target: [key, ...err.target] });
      }
    }
    return errors;
  }

  for (const propType of type.properties.values()) {
    const propValue = valObj[propType.name];
    if (propValue === undefined) {
      if (!propType.optional) {
        errors.push({
          code: "missing-property",
          message: `Missing required property "${propType.name}"`,
          target: [propType.name],
        });
      }
      continue;
    }
    const propErrors = validate(context, propValue, propType.type, propType);
    for (const err of propErrors) {
      errors.push({
        ...err,
        target: [propType.name, ...err.target],
      });
    }
  }

  // Reject unknown properties for plain (non-indexed) models.
  for (const key of Object.keys(valObj)) {
    if (!type.properties.has(key)) {
      errors.push({
        code: "unknown-property",
        message: `Unknown property "${key}"`,
        target: [key],
      });
    }
  }
  return errors;
}

function validateArray(
  context: ValidationContext,
  value: unknown,
  type: ArrayModelType,
): readonly ValidationError[] {
  if (!Array.isArray(value)) {
    return [
      {
        code: "type-mismatch",
        message: `Expected type array`,
        target: [],
      },
    ];
  }
  const errors: ValidationError[] = [];
  for (let i = 0; i < value.length; i++) {
    const itemErrors = validate(context, value[i], type.indexer.value, undefined);
    for (const err of itemErrors) {
      errors.push({
        ...err,
        target: [i.toString(), ...err.target],
      });
    }
  }
  return errors;
}

function validateUnion(
  context: ValidationContext,
  value: unknown,
  type: Union,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  const variants = [...type.variants.values()];

  let best: { errors: readonly ValidationError[]; score: number } | undefined;
  for (const variant of variants) {
    const errors = validate(context, value, variant.type, property);
    if (errors.length === 0) {
      return [];
    }
    // Prefer the variant whose JS shape matches the value (e.g. an object value
    // against a model variant) so we can surface its nested errors instead of a
    // flat "no variant matched" message. Break ties by fewest errors.
    const score = (valueMatchesKind(value, variant.type) ? 100 : 0) - errors.length;
    if (best === undefined || score > best.score) {
      best = { errors, score };
    }
  }

  // When every variant is a literal/enum we can produce a friendly enumeration of
  // the allowed values rather than surfacing per-variant assignability errors.
  const literals = collectLiteralValues(variants);
  if (literals !== undefined) {
    return [
      {
        code: "invalid-value",
        message: `Value ${JSON.stringify(value)} is not one of the allowed values: ${literals
          .map((l) => JSON.stringify(l))
          .join(", ")}`,
        target: [],
      },
    ];
  }

  return best?.errors ?? [];
}

/** Whether the JS `value` structurally matches the family of the given type. */
function valueMatchesKind(value: unknown, type: Type): boolean {
  switch (type.kind) {
    case "Model":
      return isArrayModelType(type)
        ? Array.isArray(value)
        : typeof value === "object" && value !== null && !Array.isArray(value);
    case "String":
      return typeof value === "string";
    case "Number":
      return typeof value === "number";
    case "Boolean":
      return typeof value === "boolean";
    default:
      return false;
  }
}

function validateEnum(value: unknown, type: Enum): readonly ValidationError[] {
  const allowed: (string | number)[] = [];
  for (const member of type.members.values()) {
    const memberValue = member.value ?? member.name;
    allowed.push(memberValue);
    if (value === memberValue) {
      return [];
    }
  }
  return [
    {
      code: "invalid-value",
      message: `Value ${JSON.stringify(value)} is not one of the allowed values: ${allowed
        .map((l) => JSON.stringify(l))
        .join(", ")}`,
      target: [],
    },
  ];
}

function validateLiteral(
  value: unknown,
  expected: string | number | boolean,
): readonly ValidationError[] {
  if (value === expected) {
    return [];
  }
  return [
    {
      code: "invalid-value",
      message: `Expected ${JSON.stringify(expected)}`,
      target: [],
    },
  ];
}

/**
 * If every variant of a union resolves to a literal (or enum) value, return the
 * flattened list of allowed values so we can produce a friendly error message.
 */
function collectLiteralValues(
  variants: { type: Type }[],
): (string | number | boolean)[] | undefined {
  const values: (string | number | boolean)[] = [];
  for (const variant of variants) {
    const type = variant.type;
    switch (type.kind) {
      case "String":
      case "Number":
      case "Boolean":
        values.push(type.value);
        break;
      case "Enum":
        for (const member of type.members.values()) {
          values.push(member.value ?? member.name);
        }
        break;
      default:
        return undefined;
    }
  }
  return values;
}

function validateScalar(
  context: ValidationContext,
  value: unknown,
  type: Scalar,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  // Special-case the built-in `absolutePath` scalar (from `@typespec/compiler/emitter`).
  // Matched by identity so a user-defined `scalar absolutePath` is not affected. It extends
  // `string` but additionally requires the value to be an absolute path, mirroring the
  // legacy JSON-schema `format: absolute-path` validation.
  if (context.absolutePath && scalarChainIncludes(type, context.absolutePath)) {
    if (typeof value === "string" && (value.startsWith(".") || !isPathAbsolute(value))) {
      return [
        {
          code: "config-path-absolute",
          message: `Path "${value}" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
          target: [],
          value,
        },
      ];
    }
  }

  // Resolve custom scalars (e.g. `scalar myInt extends int32`) to their known built-in
  // base by identity so they validate against the underlying representation.
  let builtin: IntrinsicScalarName | undefined;
  for (let scalar: Scalar | undefined = type; scalar; scalar = scalar.baseScalar) {
    const name = context.stdScalars.get(scalar);
    if (name !== undefined) {
      builtin = name;
      break;
    }
  }
  if (builtin === undefined) {
    return [
      {
        code: "unsupported",
        message: `${type.name} is not supported for emitter options.`,
        target: [],
      },
    ];
  }

  const typeErrors = validateBuiltinScalar(value, builtin);
  if (typeErrors.length > 0) {
    return typeErrors;
  }

  if (typeof value === "string") {
    return validateStringConstraints(context, value, type, property);
  }
  if (typeof value === "number") {
    return validateNumericConstraints(context, value, builtin, type, property);
  }
  return [];
}

/** Whether `scalar` or any of its base scalars is identical to `target`. */
function scalarChainIncludes(scalar: Scalar, target: Scalar): boolean {
  for (let current: Scalar | undefined = scalar; current; current = current.baseScalar) {
    if (current === target) {
      return true;
    }
  }
  return false;
}

/**
 * Read the most specific value of a constraint decorator: the owning property takes
 * precedence, then the scalar chain from the leaf scalar up to its base.
 */
function effectiveConstraint<T>(
  context: ValidationContext,
  accessor: (program: Program, target: Type) => T | undefined,
  scalar: Scalar,
  property: ModelProperty | undefined,
): T | undefined {
  if (property) {
    const value = accessor(context.program, property);
    if (value !== undefined) {
      return value;
    }
  }
  for (let current: Scalar | undefined = scalar; current; current = current.baseScalar) {
    const value = accessor(context.program, current);
    if (value !== undefined) {
      return value;
    }
  }
  return undefined;
}

function validateStringConstraints(
  context: ValidationContext,
  value: string,
  scalar: Scalar,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  const errors: ValidationError[] = [];

  const pattern = effectiveConstraint(context, getPattern, scalar, property);
  if (pattern && !new RegExp(pattern).test(value)) {
    errors.push({
      code: "invalid-pattern",
      message: `${value} does not match pattern /${pattern}/`,
      target: [],
    });
  }

  const minLength = effectiveConstraint(context, getMinLength, scalar, property);
  if (minLength !== undefined && value.length < minLength) {
    errors.push({
      code: "invalid-value",
      message: `String "${value}" is too short, expected at least ${minLength} characters.`,
      target: [],
    });
  }

  const maxLength = effectiveConstraint(context, getMaxLength, scalar, property);
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push({
      code: "invalid-value",
      message: `String "${value}" is too long, expected at most ${maxLength} characters.`,
      target: [],
    });
  }

  return errors;
}

function validateNumericConstraints(
  context: ValidationContext,
  value: number,
  builtin: IntrinsicScalarName,
  scalar: Scalar,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  const errors: ValidationError[] = [];
  const numericValue = Numeric(String(value));

  // Built-in integer-ness and range for sized scalars (int8, uint32, float32, ...).
  if (builtin === "integer") {
    if (!numericValue.isInteger) {
      errors.push({
        code: "invalid-value",
        message: `Value ${value} is not assignable to ${builtin}, expected an integer.`,
        target: [],
      });
    }
  } else if (builtin in numericRanges) {
    const [low, high, options] = numericRanges[builtin as keyof typeof numericRanges];
    if (options.int && !numericValue.isInteger) {
      errors.push({
        code: "invalid-value",
        message: `Value ${value} is not assignable to ${builtin}, expected an integer.`,
        target: [],
      });
    } else if (numericValue.lt(low) || numericValue.gt(high)) {
      errors.push({
        code: "invalid-value",
        message: `Value ${value} is not assignable to ${builtin}, out of range [${low.asNumber()}, ${high.asNumber()}].`,
        target: [],
      });
    }
  }

  // Explicit `@minValue`/`@maxValue` (and exclusive variants) on the property or scalar.
  const min = effectiveConstraint(context, getMinValueAsNumeric, scalar, property);
  if (min !== undefined && numericValue.lt(min)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} is less than the minimum allowed value ${min.asNumber()}.`,
      target: [],
    });
  }
  const max = effectiveConstraint(context, getMaxValueAsNumeric, scalar, property);
  if (max !== undefined && numericValue.gt(max)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} is greater than the maximum allowed value ${max.asNumber()}.`,
      target: [],
    });
  }
  const minExclusive = effectiveConstraint(
    context,
    getMinValueExclusiveAsNumeric,
    scalar,
    property,
  );
  if (minExclusive !== undefined && numericValue.lte(minExclusive)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} must be greater than ${minExclusive.asNumber()}.`,
      target: [],
    });
  }
  const maxExclusive = effectiveConstraint(
    context,
    getMaxValueExclusiveAsNumeric,
    scalar,
    property,
  );
  if (maxExclusive !== undefined && numericValue.gte(maxExclusive)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} must be less than ${maxExclusive.asNumber()}.`,
      target: [],
    });
  }

  return errors;
}

function validateBuiltinScalar(
  value: unknown,
  name: IntrinsicScalarName,
): readonly ValidationError[] {
  switch (name) {
    case "string":
    case "url":
      return assertType(value, "string");
    case "boolean":
      return assertType(value, "boolean");
    case "numeric":
    case "integer":
    case "float":
    case "decimal":
    case "decimal128":
    case "int8":
    case "int16":
    case "int32":
    case "int64":
    case "uint8":
    case "uint16":
    case "uint32":
    case "uint64":
    case "safeint":
    case "float32":
    case "float64":
      return assertType(value, "number");
    case "bytes":
      if (value instanceof Uint8Array) {
        return [];
      }
      return [{ code: "type-mismatch", message: `Expected type bytes`, target: [] }];
    default:
      return [
        {
          code: "unsupported",
          message: `${name} is not supported for emitter options.`,
          target: [],
        },
      ];
  }
}

function assertType(value: unknown, expectedType: string): readonly ValidationError[] {
  if (typeof value === expectedType) {
    return [];
  }
  return [{ code: "type-mismatch", message: `Expected type ${expectedType}`, target: [] }];
}
