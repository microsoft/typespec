import { getEncode, type ModelProperty, type Program, type Scalar } from "@typespec/compiler";
import type { XmlEncodeData, XmlEncoding } from "./types.js";

/**
 * Resolve how the given type should be encoded in XML.
 * This will return the default encoding for each types.(e.g. TypeSpec.Xml.Encoding.xmlDateTime for a utcDatetime)
 * @param program
 * @param type
 * @returns
 */
export function getXmlEncoding(
  program: Program,
  type: Scalar | ModelProperty,
): XmlEncodeData | undefined {
  const encodeData = getEncode(program, type);
  if (encodeData) {
    return encodeData;
  }
  const def = getDefaultEncoding(type.kind === "Scalar" ? type : (type.type as any));
  if (def === undefined) {
    return undefined;
  }

  return { encoding: def, type: program.checker.getStdType("string") };
}

function getDefaultEncoding(type: Scalar): XmlEncoding | undefined {
  switch (type.name) {
    case "utcDateTime":
    case "offsetDateTime":
      return "TypeSpec.Xml.Encoding.xmlDateTime";
    case "plainDate":
      return "TypeSpec.Xml.Encoding.xmlDate";
    case "plainTime":
      return "TypeSpec.Xml.Encoding.xmlTime";
    case "duration":
      return "TypeSpec.Xml.Encoding.xmlDuration";
    case "bytes":
      return "TypeSpec.Xml.Encoding.xmlBase64Binary";
    default:
      return undefined;
  }
}
