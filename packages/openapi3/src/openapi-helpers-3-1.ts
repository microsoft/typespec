import { ObjectBuilder } from "@typespec/asset-emitter";
import type { ModelProperty, Scalar, Type } from "@typespec/compiler";
import { getEncode, isNullType } from "@typespec/compiler";
import { applyEncoding as baseApplyEncoding } from "./encoding.js";
import type { OpenApiSpecSpecificProps } from "./openapi-spec-mappings.js";
import type { OpenAPISchema3_1, Refable } from "./types.js";
import { isScalarExtendsBytes } from "./util.js";

function getEncodingFieldName(typespecType: Scalar | ModelProperty) {
  // In Open API 3.1, `contentEncoding` is used for encoded binary data instead of `format`.
  const typeIsBytes = isScalarExtendsBytes(
    typespecType.kind === "ModelProperty" ? getNonNullType(typespecType.type) : typespecType,
  );
  if (typeIsBytes) {
    return "contentEncoding";
  }
  return "format";
}

/** Returns `T` for a nullable union `T | null`, otherwise the type itself. */
function getNonNullType(type: Type): Type {
  if (type.kind !== "Union") {
    return type;
  }
  const variants = [...type.variants.values()].filter((x) => !isNullType(x.type));
  return variants.length === 1 ? variants[0].type : type;
}

function isNullSchema(schema: Refable<OpenAPISchema3_1>): boolean {
  return "type" in schema && schema.type === "null";
}

export const applyEncoding: OpenApiSpecSpecificProps["applyEncoding"] = (
  program,
  typespecType,
  target,
  options,
) => {
  // A nullable `T | null` is emitted as `anyOf: [T, { type: "null" }]` in Open API 3.1.
  // The encoding describes `T` so it is applied to that member and not to the `anyOf` wrapper.
  const anyOf = (target as OpenAPISchema3_1).anyOf;
  if (anyOf?.length === 2 && anyOf.some(isNullSchema) && getEncode(program, typespecType)) {
    const result = new ObjectBuilder(target);
    result.anyOf = anyOf.map((member) =>
      isNullSchema(member)
        ? member
        : baseApplyEncoding(
            program,
            typespecType,
            member as OpenAPISchema3_1,
            getEncodingFieldName,
            options,
          ),
    );
    return result;
  }
  return baseApplyEncoding(program, typespecType, target, getEncodingFieldName, options);
};

export const getRawBinarySchema = (contentType?: string): OpenAPISchema3_1 => {
  if (contentType) {
    return { contentMediaType: contentType };
  }
  return {};
};

export const isRawBinarySchema = (schema: OpenAPISchema3_1): boolean => {
  return schema.type === undefined;
};
