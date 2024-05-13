import {
  BooleanLiteral,
  ModelProperty,
  NoTarget,
  NumericLiteral,
  StringLiteral,
  Type,
  getEncode,
  getProjectedName,
  isArrayModelType,
  isRecordModelType,
  resolveEncodedName,
} from "@typespec/compiler";
import { JsContext, Module } from "../../ctx.js";
import { UnimplementedError } from "../../util/error.js";
import { indent } from "../../util/indent.js";
import { emitTypeReference } from "../reference.js";
import { SerializableType, SerializationContext, requireSerialization } from "./index.js";

const _REQUIRES_JSON_SERIALIZATION = new WeakMap<SerializableType | ModelProperty, boolean>();

export function requiresJsonSerialization(ctx: JsContext, type: Type): boolean {
  if (!isSerializable(type)) return false;

  if (_REQUIRES_JSON_SERIALIZATION.has(type)) {
    return _REQUIRES_JSON_SERIALIZATION.get(type)!;
  }

  // Assume the type is serializable until proven otherwise, in case this model is encountered recursively.
  _REQUIRES_JSON_SERIALIZATION.set(type, true);

  switch (type.kind) {
    case "Model": {
      const requiresSerialization = [...type.properties.values()].some((property) =>
        propertyRequiresSerialization(ctx, property)
      );

      _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

      return requiresSerialization;
    }
    case "Scalar": {
      const requiresSerialization = getEncode(ctx.program, type) !== undefined;

      _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

      return requiresSerialization;
    }
    case "Union": {
      const requiresSerialization = [...type.variants.values()].some((variant) =>
        requiresJsonSerialization(ctx, variant)
      );

      _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

      return requiresSerialization;
    }
    case "ModelProperty":
      const requiresSerialization = requiresJsonSerialization(ctx, type.type);

      _REQUIRES_JSON_SERIALIZATION.set(type, requiresSerialization);

      return requiresSerialization;
  }
}

function propertyRequiresSerialization(ctx: JsContext, property: ModelProperty): boolean {
  return !!(
    getEncode(ctx.program, property) ||
    resolveEncodedName(ctx.program, property, "application/json") ||
    getProjectedName(ctx.program, property, "json") ||
    (isSerializable(property.type) && requiresJsonSerialization(ctx, property.type))
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
  typeName: string
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
  module: Module
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
          module
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
      yield `throw new Error("Unimplemented: union JSON serialization");`;
      return;
    }
  }
}

function transposeExpressionToJson(
  ctx: SerializationContext,
  type: Type,
  expr: string,
  module: Module
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
            module
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
      // TODO/witemple - pretty sure this isn't right. If the model property has additional encode/decode parameters we
      // should have some way to prioritize them lower than the top level property that this originated from.
      return transposeExpressionToJson(ctx, type.type, expr, module);
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
    case "Intrinsic":
    case "Function":
    case "Decorator":
    case "FunctionParameter":
    case "Object":
    case "Projection":
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
}

function literalToExpr(type: StringLiteral | BooleanLiteral | NumericLiteral): string {
  switch (type.kind) {
    case "String":
      return JSON.stringify(type.value);
    case "Number":
    case "Boolean":
      return String(type.value);
  }
}

function* emitFromJson(
  ctx: SerializationContext,
  type: SerializableType,
  module: Module
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
          module
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
      yield `throw new Error("Unimplemented: union JSON serialization");`;
      return;
    }
  }
}

function transposeExpressionFromJson(
  ctx: SerializationContext,
  type: Type,
  expr: string,
  module: Module
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
            module
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
      // TODO/witemple - pretty sure this isn't right. If the model property has additional encode/decode parameters we
      // should have some way to prioritize them lower than the top level property that this originated from.
      return transposeExpressionFromJson(ctx, type.type, expr, module);
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
    case "Intrinsic":
    case "Function":
    case "Decorator":
    case "FunctionParameter":
    case "Object":
    case "Projection":
      throw new UnimplementedError(`transformJsonExprForType: ${type.kind}`);
  }
}
