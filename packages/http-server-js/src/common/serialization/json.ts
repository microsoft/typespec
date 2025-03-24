// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  BooleanLiteral,
  DiagnosticTarget,
  IntrinsicType,
  ModelProperty,
  NoTarget,
  NumericLiteral,
  Scalar,
  StringLiteral,
  Type,
  compilerAssert,
  getEncode,
  isArrayModelType,
  isRecordModelType,
  resolveEncodedName,
} from "@typespec/compiler";
import { getHeaderFieldOptions, getPathParamOptions, getQueryParamOptions } from "@typespec/http";
import { JsContext, Module } from "../../ctx.js";
import { reportDiagnostic } from "../../lib.js";
import { access, parseCase } from "../../util/case.js";
import { differentiateUnion, writeCodeTree } from "../../util/differentiate.js";
import { UnimplementedError } from "../../util/error.js";
import { indent } from "../../util/iter.js";
import { keywordSafe } from "../../util/keywords.js";
import { getFullyQualifiedTypeName } from "../../util/name.js";
import { emitTypeReference, escapeUnsafeChars } from "../reference.js";
import { Encoder, JS_SCALAR_UNKNOWN, JsScalar, getJsScalar } from "../scalar.js";
import { SerializableType, SerializationContext, requireSerialization } from "./index.js";

/**
 * Memoization cache for requiresJsonSerialization.
 */
const _REQUIRES_JSON_SERIALIZATION = new WeakMap<SerializableType | ModelProperty, boolean>();

export function requiresJsonSerialization(
  ctx: JsContext,
  module: Module,
  type: Type,
  diagnosticTarget: DiagnosticTarget | typeof NoTarget = NoTarget,
): boolean {
  if (!isSerializable(type)) return false;

  if (_REQUIRES_JSON_SERIALIZATION.has(type)) {
    return _REQUIRES_JSON_SERIALIZATION.get(type)!;
  }

  // Assume the type is serializable until proven otherwise, in case this model is encountered recursively.
  // This isn't an exactly correct algorithm, but in the recursive case it will at least produce something that
  // is correct.
  _REQUIRES_JSON_SERIALIZATION.set(type, true);

  let requiresSerialization: boolean;

  switch (type.kind) {
    case "Model": {
      if (isArrayModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;
        requiresSerialization = requiresJsonSerialization(ctx, module, argumentType);
        break;
      }

      requiresSerialization = [...type.properties.values()].some((property) =>
        propertyRequiresJsonSerialization(ctx, module, property),
      );
      break;
    }
    case "Scalar": {
      const scalar = getJsScalar(ctx, module, type, diagnosticTarget);
      requiresSerialization =
        !scalar.isJsonCompatible ||
        getEncode(ctx.program, type) !== undefined ||
        scalar.getDefaultMimeEncoding("application/json") !== undefined;
      break;
    }
    case "Union": {
      requiresSerialization = [...type.variants.values()].some((variant) =>
        requiresJsonSerialization(ctx, module, variant),
      );
      break;
    }
    case "ModelProperty":
      requiresSerialization = requiresJsonSerialization(ctx, module, type.type);
      break;
  }

  _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

  return requiresSerialization;
}

function propertyRequiresJsonSerialization(
  ctx: JsContext,
  module: Module,
  property: ModelProperty,
): boolean {
  return !!(
    isHttpMetadata(ctx, property) ||
    getEncode(ctx.program, property) ||
    resolveEncodedName(ctx.program, property, "application/json") !== property.name ||
    (isSerializable(property.type) &&
      requiresJsonSerialization(ctx, module, property.type, property))
  );
}

function isHttpMetadata(ctx: JsContext, property: ModelProperty): boolean {
  return (
    getQueryParamOptions(ctx.program, property) !== undefined ||
    getHeaderFieldOptions(ctx.program, property) !== undefined ||
    getPathParamOptions(ctx.program, property) !== undefined
  );
}

function isSerializable(type: Type): type is SerializableType | ModelProperty {
  return (
    type.kind === "Model" ||
    type.kind === "Scalar" ||
    type.kind === "Union" ||
    type.kind === "ModelProperty"
  );
}

export function* emitJsonSerialization(
  ctx: SerializationContext,
  type: SerializableType,
  module: Module,
  typeName: string,
): Iterable<string> {
  yield `toJsonObject(input: ${typeName}): any {`;
  yield* indent(emitToJson(ctx, type, module));
  yield `},`;

  yield `fromJsonObject(input: any): ${typeName} {`;
  yield* indent(emitFromJson(ctx, type, module));
  yield `},`;
}

function* emitToJson(
  ctx: SerializationContext,
  type: SerializableType,
  module: Module,
): Iterable<string> {
  switch (type.kind) {
    case "Model": {
      yield `return {`;

      for (const property of type.properties.values()) {
        const encodedName =
          resolveEncodedName(ctx.program, property, "application/json") ?? property.name;

        const propertyName = keywordSafe(parseCase(property.name).camelCase);

        let expr: string = access("input", propertyName);

        const encoding = getEncode(ctx.program, property);

        if (property.type.kind === "Scalar" && encoding) {
          const scalar = getJsScalar(ctx, module, property.type, property.type);
          const scalarEncoder = scalar.getEncoding(encoding.encoding ?? "default", encoding.type);

          if (scalarEncoder) {
            expr = transposeExpressionToJson(
              ctx,
              // Assertion: scalarEncoder.target.scalar is defined because we resolved an encoder.
              scalarEncoder.target.scalar as Scalar,
              scalarEncoder.encode(expr),
              module,
            );
          } else {
            reportDiagnostic(ctx.program, {
              code: "unknown-encoding",
              target: NoTarget,
              format: {
                encoding: encoding.encoding ?? "<default>",
                type: getFullyQualifiedTypeName(property.type),
                target: getFullyQualifiedTypeName(encoding.type),
              },
            });

            // We treat this as unknown from here on out. The encoding was not deciphered.
          }
        } else {
          expr = transposeExpressionToJson(ctx, property.type, expr, module);
        }

        yield `  ${encodedName}: ${expr},`;
      }

      yield `};`;

      return;
    }
    case "Scalar": {
      yield `throw new Error("Unimplemented: scalar JSON serialization");`;
      return;
    }
    case "Union": {
      const codeTree = differentiateUnion(ctx, module, type);

      yield* writeCodeTree(ctx, codeTree, {
        subject: "input",
        referenceModelProperty(p) {
          return access("input", parseCase(p.name).camelCase);
        },
        renderResult(type) {
          return [`return ${transposeExpressionToJson(ctx, type, "input", module)};`];
        },
      });

      return;
    }
  }
}

function transposeExpressionToJson(
  ctx: SerializationContext,
  type: Type,
  expr: string,
  module: Module,
): string {
  switch (type.kind) {
    case "Model": {
      if (isArrayModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, module, argumentType)) {
          return `(${expr})?.map((item) => ${transposeExpressionToJson(ctx, argumentType, "item", module)})`;
        } else {
          return expr;
        }
      } else if (isRecordModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, module, argumentType)) {
          return `Object.fromEntries(Object.entries(${expr}).map(([key, value]) => [String(key), ${transposeExpressionToJson(
            ctx,
            argumentType,
            "value",
            module,
          )}]))`;
        } else {
          return expr;
        }
      } else if (!requiresJsonSerialization(ctx, module, type)) {
        return expr;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module);

        return `${typeReference}.toJsonObject(${expr})`;
      }
    }
    case "Scalar":
      const scalar = getJsScalar(ctx, module, type, NoTarget);

      const encoder: Encoder = getScalarEncoder(ctx, type, scalar);

      const encoded = encoder.encode(expr);

      if (encoder.target.isJsonCompatible || !encoder.target.scalar) {
        return encoded;
      } else {
        // Assertion: encoder.target.scalar is a scalar because "unknown" is JSON compatible.
        return transposeExpressionToJson(ctx, encoder.target.scalar as Scalar, encoded, module);
      }
    case "Union":
      if (!requiresJsonSerialization(ctx, module, type)) {
        return expr;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module, {
          altName: "WeirdUnion",
          requireDeclaration: true,
        });

        return `${typeReference}.toJsonObject(${expr})`;
      }
    case "ModelProperty":
      return transposeExpressionToJson(ctx, type.type, expr, module);
    case "Intrinsic":
      switch (type.name) {
        case "void":
          return "undefined";
        case "null":
          return "null";
        case "ErrorType":
          compilerAssert(false, "Encountered ErrorType in JSON serialization", type);
          return expr;
        case "never":
        case "unknown":
        default:
          // Unhandled intrinsics will have been caught during type construction. We'll ignore this and
          // just return the expr as-is.
          return expr;
      }
    case "String":
    case "Number":
    case "Boolean":
      return literalToExpr(type);
    case "Interface":
    case "Enum":
    case "EnumMember":
    case "TemplateParameter":
    case "Namespace":
    case "Operation":
    case "StringTemplate":
    case "StringTemplateSpan":
    case "Tuple":
    case "UnionVariant":
    case "Decorator":
    case "FunctionParameter":
    case "ScalarConstructor":
    default:
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
}

function getScalarEncoder(ctx: SerializationContext, type: Scalar, scalar: JsScalar) {
  const encoding = getEncode(ctx.program, type);

  let encoder: Encoder;

  if (encoding) {
    const encodingName = encoding.encoding ?? "default";
    const scalarEncoder = scalar.getEncoding(encodingName, encoding.type);

    // TODO - we should detect this before realizing models and use a transform to represent
    // the defective scalar as the encoding target type.
    // See: https://github.com/microsoft/typespec/issues/6376
    if (!scalarEncoder) {
      reportDiagnostic(ctx.program, {
        code: "unknown-encoding",
        target: NoTarget,
        format: {
          encoding: encoding.encoding ?? "<default>",
          type: getFullyQualifiedTypeName(type),
          target: getFullyQualifiedTypeName(encoding.type),
        },
      });

      encoder = {
        target: JS_SCALAR_UNKNOWN,
        encode: (expr) => expr,
        decode: (expr) => expr,
      };
    } else {
      encoder = scalarEncoder;
    }
  } else {
    // No encoding specified, use the default content type encoding for json
    encoder = scalar.getDefaultMimeEncoding("application/json") ?? {
      target: JS_SCALAR_UNKNOWN,
      encode: (expr) => expr,
      decode: (expr) => expr,
    };
  }
  return encoder;
}

function literalToExpr(type: StringLiteral | BooleanLiteral | NumericLiteral): string {
  switch (type.kind) {
    case "String":
      return escapeUnsafeChars(JSON.stringify(type.value));
    case "Number":
    case "Boolean":
      return String(type.value);
  }
}

function* emitFromJson(
  ctx: SerializationContext,
  type: SerializableType,
  module: Module,
): Iterable<string> {
  switch (type.kind) {
    case "Model": {
      yield `return {`;

      for (const property of type.properties.values()) {
        const encodedName =
          resolveEncodedName(ctx.program, property, "application/json") ?? property.name;

        let expr = access("input", encodedName);

        const encoding = getEncode(ctx.program, property);

        if (property.type.kind === "Scalar" && encoding) {
          const scalar = getJsScalar(ctx, module, property.type, property.type);
          const scalarEncoder = scalar.getEncoding(encoding.encoding ?? "default", encoding.type);

          if (scalarEncoder) {
            expr = transposeExpressionFromJson(
              ctx,
              // Assertion: scalarEncoder.target.scalar is defined because we resolved an encoder.
              scalarEncoder.target.scalar as Scalar,
              scalarEncoder.decode(expr),
              module,
            );
          } else {
            reportDiagnostic(ctx.program, {
              code: "unknown-encoding",
              target: NoTarget,
              format: {
                encoding: encoding.encoding ?? "<default>",
                type: getFullyQualifiedTypeName(property.type),
                target: getFullyQualifiedTypeName(encoding.type),
              },
            });

            // We treat this as unknown from here on out. The encoding was not deciphered.
          }
        } else {
          expr = transposeExpressionFromJson(ctx, property.type, expr, module);
        }

        const propertyName = keywordSafe(parseCase(property.name).camelCase);

        yield `  ${propertyName}: ${expr},`;
      }

      yield "};";

      return;
    }
    case "Scalar": {
      yield `throw new Error("Unimplemented: scalar JSON serialization");`;
      return;
    }
    case "Union": {
      const codeTree = differentiateUnion(ctx, module, type);

      yield* writeCodeTree(ctx, codeTree, {
        subject: "input",
        referenceModelProperty(p) {
          const jsonName = resolveEncodedName(ctx.program, p, "application/json") ?? p.name;
          return access("input", jsonName);
        },
        renderResult(type) {
          return [`return ${transposeExpressionFromJson(ctx, type, "input", module)};`];
        },
      });

      return;
    }
  }
}

function transposeExpressionFromJson(
  ctx: SerializationContext,
  type: Type,
  expr: string,
  module: Module,
): string {
  switch (type.kind) {
    case "Model": {
      if (isArrayModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, module, argumentType)) {
          return `(${expr})?.map((item: any) => ${transposeExpressionFromJson(ctx, argumentType, "item", module)})`;
        } else {
          return expr;
        }
      } else if (isRecordModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, module, argumentType)) {
          return `Object.fromEntries(Object.entries(${expr}).map(([key, value]) => [key, ${transposeExpressionFromJson(
            ctx,
            argumentType,
            "value",
            module,
          )}]))`;
        } else {
          return expr;
        }
      } else if (!requiresJsonSerialization(ctx, module, type)) {
        return `${expr} as ${emitTypeReference(ctx, type, NoTarget, module)}`;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module);

        return `${typeReference}.fromJsonObject(${expr})`;
      }
    }
    case "Scalar":
      const scalar = getJsScalar(ctx, module, type, type);

      const encoder = getScalarEncoder(ctx, type, scalar);

      const decoded = encoder.decode(expr);

      if (encoder.target.isJsonCompatible || !encoder.target.scalar) {
        return decoded;
      } else {
        // Assertion: encoder.target.scalar is a scalar because "unknown" is JSON compatible.
        return transposeExpressionFromJson(ctx, encoder.target.scalar as Scalar, decoded, module);
      }
    case "Union":
      if (!requiresJsonSerialization(ctx, module, type)) {
        return expr;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module, {
          altName: "WeirdUnion",
          requireDeclaration: true,
        });

        return `${typeReference}.fromJsonObject(${expr})`;
      }
    case "ModelProperty":
      return transposeExpressionFromJson(ctx, type.type, expr, module);
    case "Intrinsic":
      switch (type.name) {
        case "ErrorType":
          throw new Error("UNREACHABLE: ErrorType in JSON deserialization");
        case "void":
          return "undefined";
        case "null":
          return "null";
        case "never":
        case "unknown":
          return expr;
        default:
          throw new Error(
            `Unreachable: intrinsic type ${(type satisfies never as IntrinsicType).name}`,
          );
      }
    case "String":
    case "Number":
    case "Boolean":
      return literalToExpr(type);
    case "Interface":
    case "Enum":
    case "EnumMember":
    case "TemplateParameter":
    case "Namespace":
    case "Operation":
    case "StringTemplate":
    case "StringTemplateSpan":
    case "Tuple":
    case "UnionVariant":
    case "Decorator":
    case "FunctionParameter":
    case "ScalarConstructor":
    default:
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
}
