import { type ModelProperty, Program, type Scalar, getEncode } from "@typespec/compiler";
import { ObjectBuilder } from "@typespec/compiler/emitter-framework";
import type { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { getSchemaForStdScalars } from "./std-scalar-schemas.js";
import type { OpenAPI3Schema } from "./types.js";

export function applyEncoding(
  program: Program,
  typespecType: Scalar | ModelProperty,
  target: OpenAPI3Schema,
  options: ResolvedOpenAPI3EmitterOptions
): OpenAPI3Schema {
  const encodeData = getEncode(program, typespecType);
  if (encodeData) {
    const newTarget = new ObjectBuilder(target);
    const newType = getSchemaForStdScalars(encodeData.type as any, options);
    newTarget.type = newType.type;
    // If the target already has a format it takes priority. (e.g. int32)
    newTarget.format = mergeFormatAndEncoding(
      newTarget.format,
      encodeData.encoding,
      newType.format
    );
    return newTarget;
  }
  return new ObjectBuilder(target);
}

function mergeFormatAndEncoding(
  format: string | undefined,
  encoding: string | undefined,
  encodeAsFormat: string | undefined
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
