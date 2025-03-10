import { type ModelProperty, Program, type Scalar, getEncode } from "@typespec/compiler";
import { ObjectBuilder } from "@typespec/compiler/emitter-framework";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import type { OpenAPI3Schema, OpenAPISchema3_1 } from "./types.js";

export function applyEncoding(
  program: Program,
  typespecType: Scalar | ModelProperty,
  target: OpenAPI3Schema | OpenAPISchema3_1,
  getEncodedFieldName: (typespecType: Scalar | ModelProperty) => string,
  isHeader: boolean,
  options: ResolvedOpenAPI3EmitterOptions,
): OpenAPI3Schema & OpenAPISchema3_1 {
  const encodeData = getEncode(program, typespecType);
  if (encodeData) {
    const newTarget = new ObjectBuilder(target);
    const newType = getSchemaForStdScalars(encodeData.type as any, options);
    newTarget.type = newType.type;
    // If the target already has a format it takes priority. (e.g. int32)
    const encodedFieldName = getEncodedFieldName(typespecType);
    newTarget[encodedFieldName] = mergeFormatAndEncoding(
      newTarget[encodedFieldName],
      encodeData.encoding,
      newType.format,
      isHeader,
    );
    return newTarget;
  }
  return new ObjectBuilder(target);
}

function mergeFormatAndEncoding(
  format: string | undefined,
  encoding: string | undefined,
  encodeAsFormat: string | undefined,
  isHeader: boolean,
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
        case undefined:
          return isHeader ? "http-date": "date-time";
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
