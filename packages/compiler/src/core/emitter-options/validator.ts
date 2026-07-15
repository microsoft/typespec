import { getPattern } from "../../lib/decorators.js";
import {
  getMaxLength,
  getMaxValueAsNumeric,
  getMaxValueExclusiveAsNumeric,
  getMinLength,
  getMinValueAsNumeric,
  getMinValueExclusiveAsNumeric,
} from "../intrinsic-type-state.js";
import { Numeric } from "../numeric.js";
import { isPathAbsolute } from "../path-utils.js";
import { Program } from "../program.js";
import { isArrayModelType } from "../type-utils.js";
import type { ArrayModelType, Enum, Model, ModelProperty, Scalar, Type, Union } from "../types.js";

export interface ValidationError {
  code: string;
  message: string;
  target: string[];
  /** Raw offending value, carried for codes that re-emit a specific diagnostic (e.g. `config-path-absolute`). */
  value?: string;
}

/**
 * Resolved, realm-specific references used to identify scalars by identity rather
 * than by name, so user-defined scalars that merely share a name with a built-in
 * (e.g. a user `scalar absolutePath`) are not mis-classified.
 */
interface ValidationContext {
  readonly program: Program;
  /** The `absolutePath` scalar from `@typespec/compiler/emitter`, if available in this realm. */
  readonly absolutePath: Scalar | undefined;
  /** The std `bytes` scalar, which has no literal type to synthesize and is validated structurally. */
  readonly bytes: Scalar | undefined;
}

function createValidationContext(program: Program): ValidationContext {
  // Resolve the real `absolutePath` scalar by identity. It is declared in
  // `@typespec/compiler/emitter` and only present when the emitter's options file
  // imports it; when absent, no value gets absolute-path semantics.
  const [absolutePathType] = program.resolveTypeReference("absolutePath");
  const absolutePath = absolutePathType?.kind === "Scalar" ? absolutePathType : undefined;

  const bytesType = program.checker.getStdType("bytes");
  const bytes = bytesType?.kind === "Scalar" ? bytesType : undefined;

  return { program, absolutePath, bytes };
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
  // legacy JSON-schema `format: absolute-path` validation. This is not part of type
  // assignability, so it is checked here rather than delegated to the relation checker.
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

  // `bytes` has no literal type that can be synthesized, so validate it structurally.
  if (context.bytes && scalarChainIncludes(type, context.bytes)) {
    if (value instanceof Uint8Array) {
      return [];
    }
    return [{ code: "type-mismatch", message: `Expected type bytes`, target: [] }];
  }

  // Delegate the core type decision to the compiler's relation checker by synthesizing the
  // value as a literal type: this reuses scalar identity, built-in numeric range/integer-ness,
  // and scalar-declared `@minValue`/`@maxValue`(`Exclusive`)/`@minLength`/`@maxLength` instead
  // of reimplementing them.
  const leaf = synthesizeLeaf(context.program, value);
  if (leaf === undefined) {
    return [
      { code: "invalid-value", message: `Value is not assignable to ${type.name}`, target: [] },
    ];
  }
  const [assignable, diagnostics] = context.program.checker.isTypeAssignableTo(leaf, type, type);
  if (!assignable) {
    return [
      {
        code: "invalid-value",
        message: diagnostics[0]?.message ?? `Value is not assignable to ${type.name}`,
        target: [],
      },
    ];
  }

  // Residual checks the type system does not enforce on assignment: `@pattern` (any string
  // position) and property-level value/length constraints (decorators on the owning
  // `ModelProperty`, which the relation checker ignores — it only reads scalar constraints).
  if (typeof value === "string") {
    return validateStringResidual(context, value, type, property);
  }
  if (typeof value === "number") {
    return validateNumericResidual(context, value, property);
  }
  return [];
}

/**
 * Synthesize a leaf literal type (or the intrinsic `null`) for a primitive config value so it
 * can be checked against a scalar via {@link Checker.isTypeAssignableTo}. Returns `undefined`
 * for values that have no literal representation (objects, arrays, `Uint8Array`, ...).
 */
function synthesizeLeaf(program: Program, value: unknown): Type | undefined {
  switch (typeof value) {
    case "string":
      return program.checker.createLiteralType(value);
    case "number":
      return program.checker.createLiteralType(value);
    case "boolean":
      return program.checker.createLiteralType(value);
  }
  if (value === null) {
    return program.checker.nullType;
  }
  return undefined;
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

function validateStringResidual(
  context: ValidationContext,
  value: string,
  scalar: Scalar,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  const errors: ValidationError[] = [];

  // `@pattern` is not encoded in type assignability, so it is checked here. Read it from the
  // owning property and the scalar chain so it applies in array/`Record`/union positions too.
  const pattern = effectiveConstraint(context, getPattern, scalar, property);
  if (pattern && !new RegExp(pattern).test(value)) {
    errors.push({
      code: "invalid-pattern",
      message: `${value} does not match pattern /${pattern}/`,
      target: [],
    });
  }

  // Property-level `@minLength`/`@maxLength` are decorator metadata the relation checker does
  // not enforce on assignment (only scalar-declared ones are), so apply them here.
  if (property) {
    const minLength = getMinLength(context.program, property);
    if (minLength !== undefined && value.length < minLength) {
      errors.push({
        code: "invalid-value",
        message: `String "${value}" is too short, expected at least ${minLength} characters.`,
        target: [],
      });
    }
    const maxLength = getMaxLength(context.program, property);
    if (maxLength !== undefined && value.length > maxLength) {
      errors.push({
        code: "invalid-value",
        message: `String "${value}" is too long, expected at most ${maxLength} characters.`,
        target: [],
      });
    }
  }

  return errors;
}

function validateNumericResidual(
  context: ValidationContext,
  value: number,
  property: ModelProperty | undefined,
): readonly ValidationError[] {
  // Property-level `@minValue`/`@maxValue` (and exclusive variants) are decorator metadata the
  // relation checker does not enforce on assignment (only scalar-declared ones are), so apply
  // them here.
  if (!property) {
    return [];
  }
  const errors: ValidationError[] = [];
  const numericValue = Numeric(String(value));

  const min = getMinValueAsNumeric(context.program, property);
  if (min !== undefined && numericValue.lt(min)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} is less than the minimum allowed value ${min.asNumber()}.`,
      target: [],
    });
  }
  const max = getMaxValueAsNumeric(context.program, property);
  if (max !== undefined && numericValue.gt(max)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} is greater than the maximum allowed value ${max.asNumber()}.`,
      target: [],
    });
  }
  const minExclusive = getMinValueExclusiveAsNumeric(context.program, property);
  if (minExclusive !== undefined && numericValue.lte(minExclusive)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} must be greater than ${minExclusive.asNumber()}.`,
      target: [],
    });
  }
  const maxExclusive = getMaxValueExclusiveAsNumeric(context.program, property);
  if (maxExclusive !== undefined && numericValue.gte(maxExclusive)) {
    errors.push({
      code: "invalid-value",
      message: `Value ${value} must be less than ${maxExclusive.asNumber()}.`,
      target: [],
    });
  }

  return errors;
}
