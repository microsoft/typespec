import { applyEncoding as baseApplyEncoding } from "./encoding.js";
import { OpenApiSpecSpecificProps } from "./openapi-spec-mappings.js";
import { OpenAPI3Schema } from "./types.js";

function getEncodingFieldName() {
  // In Open API 3.0, format is always used for encoding.
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

export const getRawBinarySchema = (): OpenAPI3Schema => {
  return { type: "string", format: "binary" };
};

export const isRawBinarySchema = (schema: OpenAPI3Schema): boolean => {
  return schema.type === "string" && schema.format === "binary";
};
