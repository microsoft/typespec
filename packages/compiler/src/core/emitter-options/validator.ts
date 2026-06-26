import { getPattern } from "../../lib/decorators.js";
import { Program } from "../program.js";
import { isArrayModelType } from "../type-utils.js";
import type { ArrayModelType, Enum, Model, Scalar, StdTypeName, Type, Union } from "../types.js";

export interface ValidationError {
  code: string;
  message: string;
  target: string[];
}

const knownScalarNames = new Set<StdTypeName>([
  "string",
  "boolean",
  "bytes",
  "int8",
  "int16",
  "int32",
  "uint8",
  "uint16",
  "uint32",
  "float32",
  "float64",
]);

export function validateEmitterOptions(
  program: Program,
  value: unknown,
  type: Type,
): readonly ValidationError[] {
  switch (type.kind) {
    case "Model":
      if (isArrayModelType(program, type)) {
        return validateArray(program, value, type);
      }
      return validateModel(program, value, type);
    case "Scalar":
      return validateScalar(value, type);
    case "Union":
      return validateUnion(program, value, type);
    case "Enum":
      return validateEnum(value, type);
    case "String":
    case "Number":
    case "Boolean":
      return validateLiteral(value, type.value);
  }
  return [];
}

function validateModel(program: Program, value: unknown, type: Model): readonly ValidationError[] {
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
      const entryErrors = validateEmitterOptions(program, entryValue, type.indexer.value);
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
    const propErrors = validateEmitterOptions(program, propValue, propType.type);
    for (const err of propErrors) {
      errors.push({
        ...err,
        target: [propType.name, ...err.target],
      });
    }
    const pattern = getPattern(program, propType);
    if (pattern) {
      if (typeof propValue !== "string" || !new RegExp(pattern).test(propValue)) {
        errors.push({
          code: "invalid-pattern",
          message: `${propValue} does not match pattern /${pattern}/`,
          target: [propType.name],
        });
      }
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
  program: Program,
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
    const itemErrors = validateEmitterOptions(program, value[i], type.indexer.value);
    for (const err of itemErrors) {
      errors.push({
        ...err,
        target: [i.toString(), ...err.target],
      });
    }
  }
  return errors;
}

function validateUnion(program: Program, value: unknown, type: Union): readonly ValidationError[] {
  const variants = [...type.variants.values()];
  for (const variant of variants) {
    if (validateEmitterOptions(program, value, variant.type).length === 0) {
      return [];
    }
  }

  const literals = collectLiteralValues(variants);
  const message =
    literals !== undefined
      ? `Value ${JSON.stringify(value)} is not one of the allowed values: ${literals
          .map((l) => JSON.stringify(l))
          .join(", ")}`
      : `Value ${JSON.stringify(value)} does not match any of the expected types.`;
  return [{ code: "invalid-value", message, target: [] }];
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

function validateScalar(value: unknown, type: Scalar): readonly ValidationError[] {
  // Resolve custom scalars (e.g. `scalar absolutePath extends string`) to their
  // known built-in base so they validate against the underlying representation.
  let current: Scalar | undefined = type;
  while (current && !knownScalarNames.has(current.name as StdTypeName)) {
    current = current.baseScalar;
  }
  if (current === undefined) {
    return [
      {
        code: "unsupported",
        message: `${type.name} is not supported for emitter options.`,
        target: [],
      },
    ];
  }
  return validateBuiltinScalar(value, current.name as StdTypeName, []);
}

function validateBuiltinScalar(
  value: unknown,
  name: StdTypeName,
  target: string[],
): readonly ValidationError[] {
  switch (name) {
    case "string":
      return assertType(value, "string", target);
    case "boolean":
      return assertType(value, "boolean", target);
    case "int8":
    case "int16":
    case "int32":
    case "uint8":
    case "uint16":
    case "uint32":
    case "float32":
    case "float64":
      return assertType(value, "number", target);
    case "bytes":
      if (value instanceof Uint8Array) {
        return [];
      }
      return [{ code: "type-mismatch", message: `Expected type bytes`, target }];
    default:
      return [
        {
          code: "unsupported",
          message: `${name} is not supported for emitter options.`,
          target,
        },
      ];
  }
}

function assertType(
  value: unknown,
  expectedType: string,
  target: string[],
): readonly ValidationError[] {
  if (typeof value === expectedType) {
    return [];
  }
  return [{ code: "type-mismatch", message: `Expected type ${expectedType}`, target }];
}
