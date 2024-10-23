// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import {
  BooleanLiteral,
  IntrinsicType,
  ModelProperty,
  NoTarget,
  NumericLiteral,
  StringLiteral,
  Type,
  compilerAssert,
  getEncode,
  getProjectedName,
  isArrayModelType,
  isRecordModelType,
  resolveEncodedName,
} from "@typespec/compiler";
import { getHeaderFieldOptions, getPathParamOptions, getQueryParamOptions } from "@typespec/http";
import { JsContext, Module } from "../../ctx.js";
import { parseCase } from "../../util/case.js";
import { differentiateUnion, writeCodeTree } from "../../util/differentiate.js";
import { UnimplementedError } from "../../util/error.js";
import { indent } from "../../util/iter.js";
import { emitTypeReference, escapeUnsafeChars } from "../reference.js";
import { SerializableType, SerializationContext, requireSerialization } from "./index.js";

/**
 * Memoization cache for requiresJsonSerialization.
 */
const _REQUIRES_JSON_SERIALIZATION = new WeakMap<SerializableType | ModelProperty, boolean>();

export function requiresJsonSerialization(ctx: JsContext, type: Type): boolean {
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
      requiresSerialization = [...type.properties.values()].some((property) =>
        propertyRequiresJsonSerialization(ctx, property),
      );
      break;
    }
    case "Scalar": {
      requiresSerialization = getEncode(ctx.program, type) !== undefined;
      break;
    }
    case "Union": {
      requiresSerialization = [...type.variants.values()].some((variant) =>
        requiresJsonSerialization(ctx, variant),
      );
      break;
    }
    case "ModelProperty":
      requiresSerialization = requiresJsonSerialization(ctx, type.type);
      break;
  }

  _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

  return requiresSerialization;
}

function propertyRequiresJsonSerialization(ctx: JsContext, property: ModelProperty): boolean {
  return !!(
    isHttpMetadata(ctx, property) ||
    getEncode(ctx.program, property) ||
    resolveEncodedName(ctx.program, property, "application/json") !== property.name ||
    getProjectedName(ctx.program, property, "json") ||
    (isSerializable(property.type) && requiresJsonSerialization(ctx, property.type))
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
  yield `toJsonObject(input: ${typeName}): object {`;
  yield* indent(emitToJson(ctx, type, module));
  yield `},`;

  yield `fromJsonObject(input: object): ${typeName} {`;
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
          getProjectedName(ctx.program, property, "json") ??
          resolveEncodedName(ctx.program, property, "application/json") ??
          property.name;

        const expr = transposeExpressionToJson(
          ctx,
          property.type,
          `input.${property.name}`,
          module,
        );

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
      const codeTree = differentiateUnion(ctx, type);

      yield* writeCodeTree(ctx, codeTree, {
        subject: "input",
        referenceModelProperty(p) {
          return "input." + parseCase(p.name).camelCase;
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

        if (requiresJsonSerialization(ctx, argumentType)) {
          return `${expr}.map((item) => ${transposeExpressionToJson(ctx, argumentType, "item", module)})`;
        } else {
          return expr;
        }
      } else if (isRecordModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, argumentType)) {
          return `Object.fromEntries(Object.entries(${expr}).map(([key, value]) => [String(key), ${transposeExpressionToJson(
            ctx,
            argumentType,
            "value",
            module,
          )}]))`;
        } else {
          return expr;
        }
      } else if (!requiresJsonSerialization(ctx, type)) {
        return expr;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module);

        return `${typeReference}.toJsonObject(${expr})`;
      }
    }
    case "Scalar":
      return expr;
    case "Union":
      if (!requiresJsonSerialization(ctx, type)) {
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
    case "Function":
    case "Decorator":
    case "FunctionParameter":
    case "Object":
    case "Projection":
    case "ScalarConstructor":
    default:
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
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
          getProjectedName(ctx.program, property, "json") ??
          resolveEncodedName(ctx.program, property, "application/json") ??
          property.name;

        const expr = transposeExpressionFromJson(
          ctx,
          property.type,
          `input["${encodedName}"]`,
          module,
        );

        yield `  ${property.name}: ${expr},`;
      }

      yield "};";

      return;
    }
    case "Scalar": {
      yield `throw new Error("Unimplemented: scalar JSON serialization");`;
      return;
    }
    case "Union": {
      const codeTree = differentiateUnion(ctx, type);

      yield* writeCodeTree(ctx, codeTree, {
        subject: "input",
        referenceModelProperty(p) {
          const jsonName =
            getProjectedName(ctx.program, p, "json") ??
            resolveEncodedName(ctx.program, p, "application/json") ??
            p.name;
          return "input[" + JSON.stringify(jsonName) + "]";
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

        if (requiresJsonSerialization(ctx, argumentType)) {
          return `${expr}.map((item) => ${transposeExpressionFromJson(ctx, argumentType, "item", module)})`;
        } else {
          return expr;
        }
      } else if (isRecordModelType(ctx.program, type)) {
        const argumentType = type.indexer.value;

        if (requiresJsonSerialization(ctx, argumentType)) {
          return `Object.fromEntries(Object.entries(${expr}).map(([key, value]) => [key, ${transposeExpressionFromJson(
            ctx,
            argumentType,
            "value",
            module,
          )}]))`;
        } else {
          return expr;
        }
      } else if (!requiresJsonSerialization(ctx, type)) {
        return `${expr} as ${emitTypeReference(ctx, type, NoTarget, module)}`;
      } else {
        requireSerialization(ctx, type, "application/json");
        const typeReference = emitTypeReference(ctx, type, NoTarget, module);

        return `${typeReference}.fromJsonObject(${expr})`;
      }
    }
    case "Scalar":
      return expr;
    case "Union":
      if (!requiresJsonSerialization(ctx, type)) {
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
    case "Function":
    case "Decorator":
    case "FunctionParameter":
    case "Object":
    case "Projection":
    case "ScalarConstructor":
    default:
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
}
