import { ObjectBuilder } from "@typespec/asset-emitter";
import { type ModelProperty, Program, type Scalar, getEncode } from "@typespec/compiler";
import { isHeader, isQueryParam } from "@typespec/http";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import type { OpenAPI3Schema, OpenAPISchema3_1 } from "./types.js";

function isParameterStyleEncoding(encoding: string | undefined): boolean {
  if (!encoding) return false;
  return ["ArrayEncoding.pipeDelimited", "ArrayEncoding.spaceDelimited"].includes(encoding);
}

export function applyEncoding(
  program: Program,
  typespecType: Scalar | ModelProperty,
  target: OpenAPI3Schema | OpenAPISchema3_1,
  getEncodedFieldName: (typespecType: Scalar | ModelProperty) => string,
  options: ResolvedOpenAPI3EmitterOptions,
): OpenAPI3Schema & OpenAPISchema3_1 {
  const encodedFieldName = getEncodedFieldName(typespecType);
  const targetObject = new ObjectBuilder(target);

  const encodeData = getEncode(program, typespecType);
  if (encodeData) {
    // Query parameters have a couple of special cases where encoding ends up as style.
    if (isQueryParam(program, typespecType) && isParameterStyleEncoding(encodeData.encoding)) {
      return targetObject;
    }
    const newType = getSchemaForStdScalars(encodeData.type as any, options);
    targetObject.type = newType.type;
    // If the target already has a format it takes priority. (e.g. int32)
    targetObject[encodedFieldName] = mergeFormatAndEncoding(
      targetObject[encodedFieldName],
      encodeData.encoding,
      newType.format,
    );
    return targetObject;
  }

  if (isDateTimeHeader(program, typespecType, targetObject, encodedFieldName)) {
    targetObject[encodedFieldName] = "http-date";
    return targetObject;
  }

  return targetObject;
}

function mergeFormatAndEncoding(
  format: string | undefined,
  encoding: string | undefined,
  encodeAsFormat: string | undefined,
): string | undefined {
  switch (format) {
    case undefined:
      return encodeAsFormat ?? encoding ?? format;
    case "date-time":
      switch (encoding) {
        case "rfc3339":
          return "date-time";
        case "unixTimestamp":
          return "unixtime";
        case "rfc7231":
          return "http-date";
        default:
          return encoding;
      }
    case "duration":
      switch (encoding) {
        case "ISO8601":
          return "duration";
        default:
          return encodeAsFormat ?? encoding;
      }
    default:
      return encodeAsFormat ?? encoding ?? format;
  }
}

function isDateTimeHeader(
  program: Program,
  typespecType: Scalar | ModelProperty,
  target: ObjectBuilder<any>,
  encodedFieldName: string,
): boolean {
  if (isHeader(program, typespecType) && target[encodedFieldName] === "date-time") {
    return true;
  }
  return false;
}
