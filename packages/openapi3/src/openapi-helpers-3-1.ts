import { ModelProperty, Scalar } from "@typespec/compiler";
import { applyEncoding as baseApplyEncoding } from "./encoding.js";
import { OpenApiSpecSpecificProps } from "./openapi-spec-mappings.js";
import { OpenAPISchema3_1 } from "./types.js";
import { isScalarExtendsBytes } from "./util.js";

function getEncodingFieldName(typespecType: Scalar | ModelProperty) {
  // In Open API 3.1, `contentEncoding` is used for encoded binary data instead of `format`.
  const typeIsBytes = isScalarExtendsBytes(
    typespecType.kind === "ModelProperty" ? typespecType.type : typespecType,
  );
  if (typeIsBytes) {
    return "contentEncoding";
  }
  return "format";
}

export const applyEncoding: OpenApiSpecSpecificProps["applyEncoding"] = (
  program,
  typespecType,
  target,
  options,
) => {
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
